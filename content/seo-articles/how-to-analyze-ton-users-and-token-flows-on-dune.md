---
slug: how-to-analyze-ton-users-and-token-flows-on-dune
title: How to Analyze TON Users and Token Flows on Dune: A Practical Guide
description: Learn TON on-chain data analysis on Dune with SQL for real users, historical balances, token flows, Telegram Stars, and NFT marketplace volume estimates.
seoTitle: TON On-Chain Data Analysis on Dune: Advanced SQL Guide
seoDescription: Learn TON on-chain data analysis on Dune with SQL for real users, historical balances, token flows, Telegram Stars, and NFT marketplace volume estimates.
publishedAt: 2025-07-31
updatedAt: 2025-07-31
lang: en
readingTime: 15 min
tags: TON, Dune Analytics, On-Chain Analytics, SQL, Telegram Stars, NFT Data
coverImage: /assets/articles/how-to-analyze-ton-users-and-token-flows-on-dune/ton-users-token-flows-dune-guide.webp
coverAlt: TON on-chain data analysis on Dune guide covering users, balances, token flows, Telegram Stars, and NFT volumes
sourceTelegramId: 1538
primaryKeyword: TON on-chain data analysis on Dune
secondaryKeywords: TON Dune SQL; analyze TON users; TON token flows; Telegram Stars Dune; TON NFT trading volume
views: 11268
forwards: 116
comments: 2
reactions:
---

> **Archive note:** I originally published this guide on TON Blog on July 31, 2025. After the original page was removed, I restored the article here from the [Internet Archive](https://web.archive.org/web/20251110020346/https://blog.ton.org/how-to-analyze-ton-users-and-token-flows-on-dune), together with its original cover. The SQL and methodology below are preserved as published; check the linked queries and current documentation before using them in production.

This is the second part of our guide to TON on-chain data analysis on Dune. This installment demonstrates how to analyze balances and value flows between real blockchain users.

[Read the first part on TON architecture, Dune tables, and SQL fundamentals](/en/articles/ton-on-chain-data-analysis-dune/), or use the [current TON analytics documentation](https://docs.ton.org/onboarding/analytics) for up-to-date table references.

## **Quick Answer**

For advanced TON on-chain data analysis on Dune, first filter wallet contracts to remove custodial, Sybil, masterchain, and organizational addresses. Reconstruct historical balances from `ton.balances_history`, combine `ton.messages` with `ton.jetton_events` for token flows, use Fragment labels to track Telegram Stars, and estimate off-chain NFT volume from marketplace deposits and withdrawals.

## **Who Will Benefit From This Guide?**

This post is designed for:

- On-chain analysts
- Experienced Dune wizards
- Founders and researchers
- Dashboard builders
- Anyone seeking deep understanding of TON’s ecosystem dynamics

## **In This Post, You'll Learn:**

1. How to analyze authentic users (excluding contracts and custodial wallets)
2. How to calculate TVL using balance tables
3. How to calculate USD volumes flowing through addresses
4. How to track Telegram Stars volumes on TON Blockchain
5. How to analyze both on-chain and estimated off-chain NFT trading volumes

## **1. Identifying Real Users**

When analyzing large address datasets, the first critical step is filtering out non-user accounts. The following systematic approach ensures data quality:

### **Filtering Methodology**

**1. Filter by Wallet Interfaces:** Real users typically interact through contracts implementing `wallet_*` interfaces or multisig contracts. These serve as reliable starting points for user identification.

**2. Remove Masterchain Wallets:** Masterchain addresses (prefixed with -1:) primarily serve staking, network infrastructure, or legacy wallet functions with elevated gas costs. In some cases, these should be excluded from user analysis.

**3. Remove Custodial Wallets:** We have identified [over 8 million custodial addresses](https://dune.com/queries/5032986) belonging to exchanges, trading bots, or payment providers. These represent institutional holdings rather than individual users and must be excluded from user-level analysis.

**4. Remove Sybil Addresses:** Programmatically created wallets designed for airdrop farming or app-based reward exploitation. While complete detection remains challenging, we have [labeled many known instances](https://dune.com/queries/5206440). Exclude these when analyzing organic user behavior.

**5. Remove Organizational Wallets:** Addresses belonging to entities like Tradoor or TON Foundation represent organizational rather than individual user activity.

### **Implementation**

The following SQL implements all filtering rules to identify real users:

```sql
, ADDRESSES_OF_REAL_USERS AS (
    SELECT A.address
    FROM ton.accounts A
    LEFT JOIN dune.ton_foundation.result_sybil_wallets AS SYBILS
        ON A.address = SYBILS.address
    LEFT JOIN dune.ton_foundation.result_custodial_wallets AS CUSTS
        ON A.address = CUSTS.address
    LEFT JOIN dune.ton_foundation.dataset_labels AS LABELS
        ON A.address = LABELS.address
    WHERE 1=1
        -- filter masterchain addresses
        AND substr(A.address, 1, 3) != '-1:'
        -- only accounts with wallet or multisig interface
        AND cardinality(FILTER(A.interfaces, i->regexp_like(i, '^(wallet_|multisig_).*') )) > 0 

        -- not a sybil
        AND SYBILS.address IS NULL
        -- not a custodial wallet
        AND CUSTS.address IS NULL 
        -- not labelled (we label only orgs, not users)
        AND LABELS.address IS NULL
)
```

**Source:** [TON Wallets of Real Users](https://dune.com/queries/5206674)

## **2. Calculating TVL and Balances**

Dune provides two primary tables for token balance analysis:

- **`ton.balances_history`** - Records every change in user Jetton balances
- **`ton.latest_balances`** - Contains current TON and Jetton balances for each user

For current balance analysis, query `ton.latest_balances`, filter for relevant addresses, and multiply amounts by latest token prices from `ton.prices_daily` to obtain USD-denominated balances.

> **Important:** In both balance tables, TON native token appears as `asset = 'TON'` (not the null address `0:...000`) due to legacy formatting constraints that cannot be modified without breaking existing dashboards.

### **Understanding Balance History Mechanics**

The `ton.balances_history` table logs balance *changes* only. If a user receives tokens on January 1 and sends them on January 3, **no record exists for January 2** since the balance remained unchanged. This creates gaps when plotting daily or monthly balance trends, requiring SQL interpolation techniques.

### **TVL Calculation Example: Lending Protocols**

The following approach constructs daily token balances from change-only data:

### **Step 1: Generate Date Intervals**

This CTE creates the date range for TVL tracking:

```sql
, DATES AS (
    SELECT block_date
    FROM UNNEST(sequence(
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '367' DAY),
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1' MONTH, -- extra month for query optimization
        INTERVAL '1' MONTH
    )) AS t(block_date)
)
```

### **Step 2: Aggregate Balance Changes**

For daily or monthly analysis, aggregate balance changes by interval to reduce data volume and improve query performance:

```sql
, BALANCE_UPDATES AS (
    SELECT 
        DATE_TRUNC('month', block_date) AS block_date,
        BH.address, 
        CASE WHEN asset = 'TON' 
            THEN '0:0000000000000000000000000000000000000000000000000000000000000000'
            ELSE asset 
        END AS asset, 
        MAX_BY(amount, block_time) AS amount,
        ANY_VALUE(L.name) AS project
    FROM ton.balances_history BH
    INNER JOIN dune.ton_foundation.dataset_labels L
        ON BH.address = L.address 
        AND L.category = 'lending'
    WHERE block_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '367' DAY)
    GROUP BY 1,2,3
)
```

### **Step 3: Find Most Recent Balance Updates**

For each date, identify the most recent balance change before that date:

```sql
, LAST_BALANCE_UPDATE AS (
    SELECT
        DATES.block_date,
        BALANCE_UPDATES.address,
        BALANCE_UPDATES.asset,
        MAX(BALANCE_UPDATES.block_date) AS latest_block_date
    FROM DATES
    INNER JOIN BALANCE_UPDATES
        ON BALANCE_UPDATES.block_date < DATES.block_date
    GROUP BY 1,2,3
)
```

### **Step 4: Reconstruct Complete Balance Timeline**

Join the most recent balance data to each date, providing accurate balance snapshots:

```sql
, BALANCE_UPDATES_FULL AS (
    SELECT
        LAST_BALANCE_UPDATE.block_date - INTERVAL '1' MONTH AS block_date,
        LAST_BALANCE_UPDATE.address,
        LAST_BALANCE_UPDATE.asset,
        BALANCE_UPDATES.amount,
        BALANCE_UPDATES.project
    FROM LAST_BALANCE_UPDATE
    INNER JOIN BALANCE_UPDATES
        ON  LAST_BALANCE_UPDATE.address           = BALANCE_UPDATES.address
        AND LAST_BALANCE_UPDATE.latest_block_date = BALANCE_UPDATES.block_date
        AND LAST_BALANCE_UPDATE.asset             = BALANCE_UPDATES.asset
)
```

This approach avoids generating full user × date matrix or using computationally expensive window functions with partition/sort operations.

### **Step 5: Calculate USD-Denominated TVL**

Multiply reconstructed Jetton balances by historical prices to compute TVL:

```sql
, PRICES AS (
    -- currently missing TLP prices, check dune.com/queries/5436653 
    SELECT 
        DATE_TRUNC('month', timestamp) AS block_date,
        token_address,
        MAX_BY(price_usd, timestamp) AS price_usd
    FROM ton.prices_daily
    GROUP BY 1,2
)

, TVL_USD AS (
    SELECT 
        project,
        BALANCE_UPDATES_FULL.block_date,
        SUM(amount * price_usd) AS tvl_usd,
        SUM(amount) AS amount
    FROM BALANCE_UPDATES_FULL
    LEFT JOIN PRICES
        ON PRICES.block_date = BALANCE_UPDATES_FULL.block_date
        AND PRICES.token_address = BALANCE_UPDATES_FULL.asset
    GROUP BY 1,2
)
```

**Source:** [TVL of Lending Protocols](https://dune.com/queries/5436653)

## **3. Calculate Volume, Inflow, Outflow, and Netflow**

TON Blockchain supports three primary methods for transferring USD-equivalent value between addresses: native TON transfers, Jetton token transfers, and NFT transfers. While NFT valuations require complex estimation (e.g., collection floor price comparisons), token transfers provide straightforward analysis.

### **Data Sources**

Building comprehensive token transfer analysis requires combining two data sources:

- **`ton.messages`** - Contains all message data including TON transfers
- **`ton.jetton_events`** - Decoded table tracking all Jetton transfers between addresses

> **Important:** Every Jetton transfer includes a small TON amount for gas fees, creating corresponding entries in `ton.messages`. To avoid double-counting, filter out messages with `opcode = 260734629` when analyzing pure TON transfers.

### **Extracting TON Transfers**

The following query extracts native TON transfers while excluding gas payments for Jetton operations:

```sql
, TON_TRANSFERS AS (
    SELECT 
        block_date, source, destination, 
        '0:0000000000000000000000000000000000000000000000000000000000000000' AS token_address,
        value AS amount
    FROM ton.messages M
    WHERE 1=1
        AND direction = 'in' AND bounced = FALSE 
        AND COALESCE(opcode, 0) != 260734629 -- ton sent during the jetton transfer
)
```

### **Extracting Jetton Transfers**

This query captures all successful Jetton token transfers:

```sql
, JETTON_TRANSFERS AS (
    SELECT 
        block_date, source, destination, 
        jetton_master AS token_address, amount
    FROM ton.jetton_events JE
    WHERE 1=1
        AND tx_aborted = FALSE AND amount > 0
        AND source IS NOT NULL AND destination IS NOT NULL 
)
```

### **Calculating Bidirectional Flows**

Each transfer has a sender (source) and receiver (destination). To calculate inflows, outflows, volume, and netflows per address, expand the transfer table by duplicating each row with reversed address pairs and negative amounts:

```sql
, TRANSFERS AS (
    SELECT * FROM JETTON_TRANSFERS
    UNION ALL
    SELECT * FROM TON_TRANSFERS
)

, NET_VOLUME AS (
    SELECT 
        from_, to_, T.token_address,
        block_date,
        COALESCE(amount_ * P.price_usd, 0) AS net_volume_usd
    FROM TRANSFERS T
    CROSS JOIN UNNEST (ARRAY[
      ROW(source, destination, amount), 
      ROW(destination, source, amount * -1)
    ]) AS T(from_, to_, amount_)
    INNER JOIN query_4675316 AS TOKEN_WHITELIST 
        -- tokens with $1k+ in TVL, source: https://dune.com/queries/4675316
        -- required to filter fake prices
        ON TOKEN_WHITELIST.address = T.token_address
        AND tvl_usd >= 1_000
        
    LEFT JOIN ton.prices_daily P
        ON P.timestamp = T.block_date AND P.token_address = T.token_address
)

```

### **Token Price Filtering**

**Critical Note:** The token whitelist prevents price manipulation artifacts. Anyone can create DEX pools, add liquidity, and generate trading volume for worthless tokens while holding trillions in supply. This can result in artificial billion-dollar balances exceeding total blockchain TVL. The whitelist approach or TVL-based filtering ([example implementation](https://github.com/duneanalytics/spellbook/blob/027641afa34fb1500e7f26bd2c7f8c9530bcdf80/dbt_subprojects/daily_spellbook/models/ton/tokens_ton_net_transfers_daily.sql#L25-L39)) mitigates these issues.

### **Aggregating Volume Statistics**

With the bidirectional flow structure, you can efficiently calculate comprehensive volume metrics:

```sql
, STATS_VOLUME AS (
    SELECT 
        from_ AS address,
        MAX(block_date) as max_date,
        MIN(block_date) as min_date
        , SUM(net_volume_usd) AS net_volume_usd
        , SUM(ABS(net_volume_usd)) AS volume_usd
        , SUM(net_volume_usd) FILTER (WHERE net_volume_usd > 0) AS out_volume_usd
        , COUNT(DISTINCT trace_id) AS traces -- inbound + outbound
    FROM NET_VOLUME
    GROUP BY 1
)
```

This methodology provides flexible, scalable analysis of asset movements across TON Blockchain, supporting address-level filtering, user group analysis, and temporal volume tracking.

**Source:** [Custodial Wallets Detection](https://dune.com/queries/5032986)

## **BONUS: Tracking Telegram Stars Volumes**

Telegram Stars represents Telegram's off-chain currency used within mini apps and bots. Users can purchase Stars through Apple Pay (with 30% fees) or Fragment at discounted rates.

While **most transactions occur off-chain**, all Fragment-related operations are recorded **on-chain**, enabling comprehensive tracking:

- **Star Purchases:** $TON → Sent to Fragment → Converted into Stars
- **Star Withdrawals:** Stars → Sent to Fragment → Converted into $TON → Sent to your wallet

Although only approximately 10% of Gifts migrate to TON Blockchain, this provides valuable proxy signals for broader adoption analysis.

### **Tracking Star Purchases**

Telegram Stars purchases appear as TON transfers to Fragment addresses with specific comment patterns:

```sql
, TG_STARS_BUY_STATS AS (
    SELECT 
        T.source AS address,
        T.amount * P.price_usd * (-1) AS stars_volume_usd
    FROM TON_TRANSFERS T
    INNER JOIN dune.ton_foundation.dataset_labels WHITELIST 
        ON WHITELIST.address = T.destination
        AND WHITELIST.label = 'fragment' -- transfers only to fragment	
    INNER JOIN ton.prices_daily P 
        ON P.timestamp = T.block_date
        AND P.token_address = '0:0000000000000000000000000000000000000000000000000000000000000000'
    WHERE 1=1
        AND T.comment LIKE '%Telegram Stars%Ref#%'
)
```

### **Tracking Star Withdrawals**

Star withdrawals manifest as TON transfers from Fragment addresses to user wallets:

```sql
, TG_STARS_SELL_STATS AS (
    SELECT 
        T.destination AS address,
        T.amount * P.price_usd AS stars_volume_usd
    FROM TON_TRANSFERS T
    INNER JOIN dune.ton_foundation.dataset_labels WHITELIST 
        ON WHITELIST.address = T.source
        AND WHITELIST.label = 'fragment' -- transfers only from fragment	
    INNER JOIN ton.prices_daily P 
        ON P.timestamp = T.block_date
        AND P.token_address = '0:0000000000000000000000000000000000000000000000000000000000000000'
        
    WHERE 1=1
        AND (
            T.comment LIKE '%Reward from Telegram bot%Ref#%'
            OR 
            T.comment LIKE '%Reward from Telegram channel%Ref#%'
        )
)
```

This data enables estimation of Telegram Stars volume flowing through individual addresses and quantification of users engaging in Star transactions.

**Source:** https://dune.com/queries/4896663

## **4. Calculating On-Chain & Off-Chain NFT Trade Volumes**

This section demonstrates calculation of on-chain NFT sales volumes and approximation of off-chain marketplace activity through on-chain footprint analysis.

### **On-Chain NFT Trading**

On-chain NFT trades, including **Telegram Gifts**, **Anonymous Numbers**, **Telegram Usernames**, and other collections, are decoded and stored in `ton.nft_items`. Currently, all trades settle in TON tokens. For USD conversion, multiply by corresponding daily TON prices.

For demonstration purposes, this example uses an alternative TON price feed based on DEX trades across EVM chains:

```sql
, TON_PRICE AS (
    SELECT 
        day, 
        AVG(price) / 1e9 AS price_usd 
    FROM prices.usd_daily
    WHERE symbol = 'TON' AND blockchain IS NULL
    GROUP BY 1
)

, TON_NFT_EVENTS AS (
    SELECT 
        NE.block_date,
        LABELS.name AS project,
        NE.sale_price * TON_PRICE.price_usd AS amount_usd,
        NE.prev_owner AS seller,
        NE.owner_address AS buyer,
        NE.marketplace_fee * TON_PRICE.price_usd AS marketplace_fee_usd,
        NE.royalty_amount * TON_PRICE.price_usd AS royalty_amount_usd
    FROM ton.nft_events NE
    LEFT JOIN TON_PRICE
        ON DATE_TRUNC('day', NE.block_time) = TON_PRICE.day
    LEFT JOIN dune.ton_foundation.dataset_labels LABELS 
        ON LABELS.address = NE.marketplace_address
    WHERE 1=1
        AND NE.type = 'sale'
        AND NE.payment_asset = 'TON'
)
```

### **On-Chain vs Off-Chain NFT Trading**

**Telegram Gifts** exemplify the complexity: they can trade fully on-chain (as NFTs listed and transferred between wallets) or off-chain through internal marketplace systems that leave no direct on-chain sale records.

Off-chain marketplaces like **MRKT**, **Portals**, and **Tonnel** only create on-chain traces when users deposit TON into internal marketplace balances or withdraw proceeds.

### **Estimating Off-Chain Marketplace Volume**

Assuming buyers deposit TON for purchases and sellers subsequently withdraw proceeds, estimated trading volume can be calculated as:

**Volume ≈ (Deposits + Withdrawals) / 2**

Since each successful trade generates one deposit (buyer funding) and one withdrawal (seller payout), this formula provides reasonable approximation.

> **⚠️ Methodology Limitation:** This approach represents an approximation. Users may fund internal balances through alternative means, and single deposits may facilitate multiple purchases before withdrawal. However, comparisons with disclosed marketplace data indicate that our estimates typically underreport actual volumes by approximately **30%** — providing a conservative off-chain activity analysis.

### **Implementation: Off-Chain Marketplace Analysis**

First, load labeled addresses for off-chain NFT marketplaces from our public GitHub repository, already integrated into Dune:

```sql
-- Marketplace address labels
, MARKETPLACES AS (
    SELECT *
    FROM dune.ton_foundation.dataset_labels
    WHERE category = 'merchant'
      AND subcategory = 'offchain_marketplace'
)
```

### **Step 1: Calculate TON Withdrawals**

Collect all TON **withdrawals** from off-chain marketplace wallets, excluding internal transfers between marketplace-controlled addresses:

```sql
, WITHDRAWS_TON AS (
    SELECT 
        block_date,
        NULL AS buyer,
        M.destination AS seller, 
        SOURCE_LABEL.name AS marketplace_name,
        M.value * P.price_usd * (-1) AS net_value_usd,
        M.value * P.price_ton * (-1) AS net_value_ton
    FROM ton.messages M
    LEFT JOIN MARKETPLACES AS SOURCE_LABEL
        ON SOURCE_LABEL.address = M.source
    LEFT JOIN MARKETPLACES AS DEST_LABEL
        ON DEST_LABEL.address = M.destination
    LEFT JOIN ton.prices_daily P 
        ON P.timestamp = M.block_date
           AND P.token_address = '0:0000000000000000000000000000000000000000000000000000000000000000'  -- native TON address
    WHERE SOURCE_LABEL.address IS NOT NULL 
      AND SOURCE_LABEL.name IS DISTINCT FROM DEST_LABEL.name -- don't count inner transfers
      AND M.direction = 'in' AND NOT M.bounced
      AND COALESCE(opcode, 0) != 260734629  -- exclude Jetton transfers
```

### **Step 2: Calculate TON Deposits**

Calculate **deposits** to off-chain marketplace wallets:

```sql
, DEPOSITS_TON AS (
    SELECT 
        block_date,
        M.source AS buyer, 
        NULL AS seller,
        DEST_LABEL.name AS marketplace_name,
        M.value * P.price_usd AS net_value_usd,
        M.value * P.price_ton AS net_value_ton
    FROM ton.messages M
    LEFT JOIN MARKETPLACES AS SOURCE_LABEL
        ON SOURCE_LABEL.address = M.source
    LEFT JOIN MARKETPLACES AS DEST_LABEL
        ON DEST_LABEL.address = M.destination
    LEFT JOIN ton.prices_daily P 
        ON P.timestamp = M.block_date
           AND P.token_address = '0000000000000000000000000000000000000000000000000000000000000000'
    WHERE DEST_LABEL.address IS NOT NULL 
	-- don't count inner transfers
      AND SOURCE_LABEL.name IS DISTINCT FROM DEST_LABEL.name
      AND M.direction = 'in' AND NOT M.bounced
      AND COALESCE(opcode, 0) != 260734629
)

```

The same methodology applies to Jetton token deposits and withdrawals for comprehensive marketplace analysis.

### **Final Step: Aggregate Estimated Off-Chain Volume**

Combine all transfer types and calculate estimated daily off-chain trading volumes:

```sql
, ALL_TRANSFERS AS (
    SELECT * FROM DEPOSITS_TON
    UNION ALL 
    SELECT * FROM WITHDRAWS_TON
    UNION ALL 
    SELECT * FROM DEPOSITS_JETTON
    UNION ALL 
    SELECT * FROM WITHDRAWS_JETTON
)

, TON_GIFTS_EVENTS AS (
    SELECT 
        block_date,
        marketplace_name AS project,
        SUM(ABS(net_value_usd) * 0.5) AS amount_usd
    FROM ALL_TRANSFERS
    GROUP BY 1, 2
)
```

This methodology provides baseline estimates for off-chain NFT marketplace volumes and enables comparison with on-chain activity. While not perfectly precise, it delivers sufficient accuracy for analytical and product decision-making, trend tracking, and ecosystem monitoring.

**Source:** [TON NFT Market Stats](https://dune.com/queries/5155787/8509222)

---

This represents a focused slice of how TON Foundation and the broader TON Data Hub community analyze TON Blockchain. As TON’s ecosystem continues rapid expansion, we persistently develop our analytical tools and capabilities.

If you're building on TON and require dashboards or on-chain analytics, TON Foundation provides comprehensive support. 

[Partner with us to host a Data Contest](https://builders.ton.org/opportunities/data-contest) through TON Data Hub — an effective approach to engage top analysts, generate powerful Dune dashboards, and obtain actionable insights for your project.

[Join TON’s Data Hub community](https://t.me/tondatahub) for contest updates and advanced Dune techniques.

Stay tuned for additional practical guides covering advanced analytics, fraud detection, and ecosystem benchmarking!

---

## **Related TON Data Guides**

- [TON data: all guides and research](/topics/ton-data/)
- [ton-analyst: an open-source AI skill for TON analysis on Dune](/en-ton-analyst-open-source-ai-skill-dune/)
- [How I automated TON blockchain data analysis with an AI agent](/en-automated-ton-data-analysis-ai-agent-habr/)
- [Official TON analytics and data providers documentation](https://docs.ton.org/onboarding/analytics)
- [Dune TON data catalog](https://docs.dune.com/data-catalog/ton/overview)
