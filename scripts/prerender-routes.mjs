import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

// Read route declarations without running the prerenderer's build-time side effects.
// Dynamic paths come from the content inventory and topic hubs instead.
export function staticPrerenderRoutes(root) {
  const filename = path.join(root, 'scripts/prerender.mjs')
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const routes = new Set()
  let declared = false
  const collect = (node) => {
    if (!ts.isObjectLiteralExpression(node)) return
    const property = node.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(source) === 'path')
    if (!property || !ts.isStringLiteralLike(property.initializer)) return
    const value = property.initializer.text
    if (!value.startsWith('/') || value.startsWith('//') || /[?#]/.test(value)) throw new Error(`Invalid static prerender route: ${value}`)
    routes.add(value === '/' ? '/' : `${value.replace(/\/+$/, '')}/`)
  }
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'ROUTES' && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      declared = true
      node.initializer.elements.forEach(collect)
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText(source) === 'ROUTES' && node.expression.name.text === 'push') {
      node.arguments.forEach(collect)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (!declared) throw new Error('Missing ROUTES array in scripts/prerender.mjs')
  return [...routes]
}
