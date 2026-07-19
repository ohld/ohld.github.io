#!/usr/bin/env python3
"""Build the public Telegram semantic atlas from a local GBrain vector export."""

from __future__ import annotations

import argparse
import base64
import html
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
import umap
from sklearn.cluster import KMeans
from sklearn.neighbors import NearestNeighbors

PALETTE = [
    "#0F6B78", "#E07A5F", "#3D405B", "#81B29A",
    "#D6A84B", "#6D597A", "#B56576", "#457B9D",
    "#2A9D8F", "#C58B24", "#F4A261", "#264653",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--metrics", required=True)
    parser.add_argument("--labels")
    parser.add_argument("--output", required=True)
    parser.add_argument("--representatives", required=True)
    parser.add_argument("--clusters", type=int, default=12)
    return parser.parse_args()


def clean_text(value: str) -> str:
    value = re.sub(r"!\[([^]]*)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"[*_`~]{1,3}", "", value)
    value = re.sub(r"^#{1,6}\s*", "", value, flags=re.MULTILINE)
    value = html.unescape(value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def metric_number(value: Any) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return max(0, int(value))
    if isinstance(value, dict):
        return sum(metric_number(item) for item in value.values())
    if isinstance(value, list):
        return sum(metric_number(item) for item in value)
    return 0


def telegram_id(page: dict[str, Any]) -> int:
    frontmatter = page.get("frontmatter") or {}
    if frontmatter.get("telegram_id") is not None:
        return int(frontmatter["telegram_id"])
    match = re.search(r"-telegram-(\d+)$", page["slug"])
    if not match:
        raise ValueError(f"Cannot parse Telegram ID from {page['slug']}")
    return int(match.group(1))


def decode_vectors(pages: list[dict[str, Any]], dimensions: int) -> np.ndarray:
    matrix = np.empty((len(pages), dimensions), dtype=np.float32)
    for index, page in enumerate(pages):
        raw = base64.b64decode(page.get("vector", ""))
        vector = np.frombuffer(raw, dtype=np.int8).astype(np.float32)
        if vector.size != dimensions:
            raise ValueError(f"Vector size mismatch for {page['slug']}: {vector.size}")
        matrix[index] = vector * float(page.get("scale", 1))
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    matrix /= np.maximum(norms, 1e-12)
    return matrix


def normalize_axis(values: np.ndarray) -> np.ndarray:
    low, high = np.percentile(values, [1, 99])
    if high <= low:
        return np.full_like(values, 0.5)
    return np.clip((values - low) / (high - low), 0, 1)


def main() -> None:
    args = parse_args()
    source = json.loads(Path(args.source).read_text())
    pages = source["pages"]
    dimensions = int(source["dimensions"])
    vectors = decode_vectors(pages, dimensions)

    metrics_rows = json.loads(Path(args.metrics).read_text())["posts"]
    metrics = {int(row["telegram_message_id"]): row for row in metrics_rows}
    # OHLDBot represents this historical album by its last item; GBrain uses the first.
    if 275 not in metrics and 276 in metrics:
        metrics[275] = metrics[276]

    reducer = umap.UMAP(
        n_neighbors=20,
        min_dist=0.08,
        n_components=2,
        metric="cosine",
        random_state=42,
        low_memory=True,
    )
    coordinates = reducer.fit_transform(vectors)
    x_values = normalize_axis(coordinates[:, 0])
    y_values = normalize_axis(coordinates[:, 1])

    clusterer = KMeans(n_clusters=args.clusters, random_state=42, n_init=20)
    clusters = clusterer.fit_predict(vectors)

    neighbor_model = NearestNeighbors(n_neighbors=7, metric="cosine", algorithm="brute", n_jobs=-1)
    neighbor_model.fit(vectors)
    distances, indices = neighbor_model.kneighbors(vectors)

    labels: dict[str, str] = {}
    if args.labels and Path(args.labels).exists():
        labels = json.loads(Path(args.labels).read_text())

    ids = [telegram_id(page) for page in pages]
    post_rows: list[dict[str, Any]] = []
    for index, page in enumerate(pages):
        post_id = ids[index]
        frontmatter = page.get("frontmatter") or {}
        metric = metrics.get(post_id, {})
        date = str(frontmatter.get("date") or page.get("date") or "")[:10]
        text = clean_text(page.get("text") or "")
        cluster = int(clusters[index])
        post_rows.append({
            "id": post_id,
            "date": date,
            "year": int(date[:4]),
            "url": str(frontmatter.get("url") or f"https://t.me/danokhlopkov/{post_id}"),
            "text": text,
            "topic": f"c{cluster}",
            "x": round(float(x_values[index]), 6),
            "y": round(float(y_values[index]), 6),
            "views": metric_number(metric.get("views")),
            "reactions": metric_number(metric.get("reactions")),
            "comments": metric_number(metric.get("comments")),
            "forwards": metric_number(metric.get("forwards")),
            "hasMedia": bool(metric.get("has_media")),
            "neighbors": [
                {
                    "id": ids[int(neighbor_index)],
                    "similarity": round(float(1 - neighbor_distance), 4),
                }
                for neighbor_distance, neighbor_index in zip(distances[index][1:], indices[index][1:])
            ],
        })

    counts = Counter(int(value) for value in clusters)
    topics = [
        {
            "id": f"c{cluster}",
            "label": labels.get(str(cluster), f"Тема {cluster + 1}"),
            "color": PALETTE[cluster % len(PALETTE)],
            "count": counts[cluster],
        }
        for cluster in sorted(counts)
    ]

    representatives = []
    for cluster in sorted(counts):
        member_indices = np.flatnonzero(clusters == cluster)
        centroid = clusterer.cluster_centers_[cluster]
        scores = vectors[member_indices] @ centroid
        sample_indices = member_indices[np.argsort(scores)[::-1][:10]]
        representatives.append({
            "cluster": cluster,
            "count": counts[cluster],
            "samples": [
                {
                    "id": ids[int(index)],
                    "date": post_rows[int(index)]["date"],
                    "text": post_rows[int(index)]["text"][:500],
                    "views": post_rows[int(index)]["views"],
                }
                for index in sample_indices
            ],
        })

    newest = max(post_rows, key=lambda post: (post["date"], post["id"]))
    public = {
        "version": 1,
        "meta": {
            "source": "gbrain:writings",
            "generatedAt": source["generated_at"],
            "posts": len(post_rows),
            "newestId": newest["id"],
            "newestDate": newest["date"],
            "projection": {
                "algorithm": "UMAP",
                "metric": "cosine",
                "neighbors": 20,
                "minDist": 0.08,
                "seed": 42,
            },
            "clustering": {"algorithm": "KMeans", "clusters": args.clusters, "seed": 42},
        },
        "topics": topics,
        "posts": post_rows,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")))
    representatives_path = Path(args.representatives)
    representatives_path.write_text(json.dumps(representatives, ensure_ascii=False, indent=2))
    print(json.dumps({
        "posts": len(post_rows),
        "topics": len(topics),
        "output_bytes": output_path.stat().st_size,
        "representatives": str(representatives_path),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
