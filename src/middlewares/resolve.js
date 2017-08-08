const babel = require('babel-core')
const chalk = require('chalk')
const babylon = require('babylon')
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default
const t = require('babel-types')
const querystring = require('querystring')
const readFile = require('../services/readFile')
const addExt = require('../services/addExt')
const path = require('path')

const warningModule = {}

// 'react', 'lodash/map', './list.js'
const isThirdModule = val => {
  return (val[0] !== '/' && val[0] !== '.' && !/^http(s)?:\/\//i.test(val))
}

function resolveImportModule(importStr, type, filePath) {
  // let moduleName = path.node.value
  if (isThirdModule(importStr)) {
    if (importStr in config.resolve.import) {
      // request with import query word means it has been resolve by config
      const query = querystring.stringify({
        type: 'thirdModule',
        moduleType: 'resolvedUMD',
        moduleName: importStr,
        importType: JSON.stringify(type)
      })
      let resPath = config.resolve.import[importStr].path
      if (/^\.\//.test(resPath)) {
        resPath = resPath.substr(1)
      }
      return resPath + '?' + query
    } else {
      if (!warningModule[importStr]) {
        warningModule[importStr] = importStr
        console.error(chalk.red(`Error: there is no resolve config for "${importStr}"`))
      }
      process.exit(1)
    }
  } else {
    const query = querystring.stringify({
      type: 'module',
      moduleType: 'es6', // in fact, no need to do extra things
      moduleName: importStr,
      importType: JSON.stringify(type)
    })
    if (!path.extname(importStr)) {
      const ext = addExt(filePath, importStr)
      if (ext) {
        importStr += '.' + ext
      }
    }
    return importStr + '?' + query
  }
}

function resolveImport(code, filePath) {
  const ast = babylon.parse(code, {
    sourceType: 'module',
    allowImportExportEverywhere: false,
    plugins: ["jsx"]
  })
  traverse(ast, {
    ImportDeclaration(path) {
      let importStr, type = []
      if (t.isStringLiteral(path.node.source)) {
        importStr = path.node.source.value
      }
      path.node.specifiers.forEach(spec => {
        if (t.isImportDefaultSpecifier(spec)) {
          type.push({
            type: 'default',
            value: spec.local.name
          })
        } else if (t.isImportSpecifier(spec)) {
          let ret = {
            type: 'module',
            value: spec.local.name
          }
          if (spec.imported) {
            ret.value = spec.imported.name
          }
          type.push(ret)
        } else if (t.isImportNamespaceSpecifier(spec)) {
          type.push({
            type: 'namespace',
            value: spec.local.name
          })
        }
      })
      path.node.source.value = resolveImportModule(importStr, type, filePath)
    }
  })
  return generate(ast, {}, code).code
}

const umdToModule = (code, importName, importType) => {
  const importResolve = config.resolve.import[importName]
  let newFileContent = code, exportConf = importResolve.export
  if (typeof exportConf === 'function') {
    newFileContent = exportConf(code, importName, importType)
  } else if (typeof exportConf === 'string') {
    const modules = importType.map(({ type, value }) => {
      if (type === 'module') {
        return `export const ${value} = ${exportConf}.${value};`
      } else {
        return ''
      }
    }).join('\n')
    newFileContent = `
      ;(function(){${code}}).call(window);
      ${modules};
      export default ${exportConf};
    `
  }
  return newFileContent
}

module.exports = function resolve(req, res) {
  const fileContent = res.body
  const filePath = req.locals.filePath
  const {
    type,
    moduleType,
    importType,
    moduleName
  } = req.query
  let ret = ''

  if (type === 'module') {
    ret = resolveImport(fileContent, filePath)
  } else if (type === 'thirdModule') {
    ret = umdToModule(fileContent, moduleName, JSON.parse(importType))
  } else {
    ret = resolveImport(fileContent, filePath)
  }
  res.status(200)
    .type('application/javascript')
    .send(ret)
}