const readFile = require('./utils').readFile
const result = {}
const path = require('path')
const hasFile = require('fs').existsSync
const babylon = require('babylon')
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default
const t = require('babel-types')

const opts = {
  sourceType: 'module',
  allowImportExportEverywhere: false,
  plugins: ["jsx"]
}
 
function resolveImport(filePath) {

  const code = readFile(filePath)
  const ast = babylon.parse(code, opts)
  const deps = result[filePath] = []
  traverse(ast, {
    ImportDeclaration(_path) {
      const importer = _path.node.source.value
      if (isThirdModule(importer)) {
        deps.push(importer)
      } else {
        let importerPath = path.resolve(path.dirname(filePath), importer)
        const ext = path.extname(importerPath).substr(1).toLowerCase()
        if (ext && !/^jsx?$/.test(ext)) {
          deps.push(importerPath)
          return
        }
        if (!ext) {
          if (hasFile(importerPath + '.js')) {
            importerPath += '.js'
          } else if (hasFile(importerPath + '.jsx')) {
            importerPath += '.jsx'
          } else {
            deps.push(importerPath)
            return
          }
        }
        deps.push(importerPath)
        if (!(importerPath in result)) resolveImport(importerPath)
      }
    }
  })
}

const {convertImportByAst} = require('./resolveImport')

convertImportByAst('E:\\learn\\cra\\src\\index.js')
console.log(JSON.stringify(result, null, 2))

function changed(filePath, ret = []) {
  Object.keys(result).forEach(fp => {
    if (result[fp].includes(filePath)) {
      ret.push(fp)
      changed(fp, ret)
    }
  })
  return [filePath].concat(ret)
}

console.log(changed('E:\\learn\\cra\\src\\components\\Item\\item.jsx'))