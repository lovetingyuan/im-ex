const chalk = require('chalk')
const babylon = require('babylon')
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default
const t = require('babel-types')
const querystring = require('querystring')
const path = require('path')
const fs = require('fs')
const { handleError } = require('./utils')
const slash = require('slash')

/**
 * 寻址规则：
 *    如果有后缀，那么直接返回文件地址（如果本地没有则抛出错误）
 *    否则以resolve.exts依次进行寻址，找到返回，如果是不支持的后缀则打印warning
 *    如果还未找到则以索引方式进行寻址，仍然需要按照exts依次寻找
 *    找到返回，否则抛出错误
 *    
 * @param {*} dirname 
 * @param {*} importer 
 */

function findFile(importer, dirname) {
  let ext = path.extname(importer)
  let filePath = path.resolve(dirname, importer)
  if (!ext) {
    const exts = config.resolve.exts
    for (let i = 0; i < exts.length; i++) {
      let fp = filePath + '.' + exts[i]
      if (fs.existsSync(fp)) {
        return {
          importer: importer + '.' + exts[i],
          filePath: fp
        }
      }
    }
    for (let i = 0; i < exts.length; i++) {
      let fp = filePath + '/index.' + exts[i]
      if (fs.existsSync(fp)) {
        return {
          importer: importer + '/index.' + exts[i],
          filePath: fp
        }
      }
    }
  }
  if (fs.existsSync(filePath)) {
    return {
      importer,
      filePath
    }
  }
  handleError(`file: ${filePath} does not exist`)
}

/**
 * 对于importer，首先提取path部分
 * 如果path以.或者/开头则是用户模块
 *    以.开头，进行文件寻址，以当前目录拼接可能的后缀或者索引寻址
 *    以/开头，进行文件寻址，以serverRoot拼接
 * 否则则可能是第三方模块或者用户模块
 *    在resolve中查找，如果未找到则抛出异常
 *    否则判断是第三方模块还是用户模块
 *        如果是第三方模块（是Object 而不是 string），直接获取地址
 *        否则以serverRoot寻址
 * 对应的meta结构：{
 *  __imex__: '__imex__', // indicating the request with this query param need to be resolve to a module
 *  importStr: importer, // code import
 *  importer: ,// resolved import
 *  filePath: filePath, // real absolute file path
 *  query: query, // extra user query obj
 *  currentPath: currentPath, // this file path handling currently
 *  moduleType: '', // module, entryModule, thirdModule, aliasModule
 * }
 */
function resolveImporter(importer, currentPath) {
  if (importer.indexOf('!') > 0) { // webpack inline loader, we ignore
    importer = importer.split('!').pop()
  }
  let query = {}, importPath = importer
  if (importer.indexOf('?') > 0) { // user config
    const [_importPath, queryStr] = importer.split('?')
    query = querystring.parse(queryStr)
    importPath = _importPath
  }
  const meta = {
    __imex__: '__imex__',
    query,
    importStr: importPath,
    // currentPath,
  }

  if (importPath[0] === '.' || importPath[0] === '/') {
    let contextDir = importPath[0] === '.' ? path.dirname(currentPath) : config._server.root
    let { importer, filePath } = findFile(importPath, contextDir)
    // meta.filePath = filePath
    meta.importer = importer
    meta.moduleType = 'module'
  } else { // third module
    const reolvedImport = config.resolve.import
    if (typeof reolvedImport[importPath] === 'object') {
      meta.moduleType = 'thirdModule'
      meta.importer = reolvedImport[importPath].path
      // meta.filePath = join(config._server.root, path.substr(1)) // remove '/'
    } else { // user alias, 'comp': '/src/components/', import from 'comp/Header'
      for (let alias in reolvedImport) {
        if (importPath === alias || importPath.indexOf(alias + '/') === 0) {
          let aliasVal = reolvedImport[alias].substr(1)
          if (aliasVal.substr(-1) === '/') {
            aliasVal = aliasVal.substr(0, -1)
          }

          let { importer, filePath } = findFile(aliasVal + importPath.substr(alias.length), config._server.root)
          // meta.filePath = filePath
          meta.importer = '/' + importer
          if (/node_modules\/.+/.test(slash(filePath))) {
            meta.moduleType = 'aliasThirdModule'
          } else {
            meta.moduleType = 'aliasModule'
          }
          return meta
        }
      }
      handleError(`module: ${importPath} has not been resolved,
        you can config the module file path in "config.resolve.import"`
      )
    }
  }
  return meta
}

function convertImportByAst(code, filePath, depCollection) {
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
      const importerResolved = resolveImporter(importStr, filePath)

      importerResolved.importType = type
      if (Array.isArray(depCollection)) {
        depCollection.push(Object.assign({}, importerResolved))
      }
      Object.keys(importerResolved).forEach(key => {
        if (typeof importerResolved[key] === 'object') {
          importerResolved[key] = JSON.stringify(importerResolved[key])
        }
      })
      const queryStr = '?' + querystring.stringify(importerResolved)
      path.node.source.value = importerResolved.importer + queryStr
      if (['module', 'aliasModule'].includes(importerResolved.moduleType)) {
        path.node.source.value += '&_t=' + Date.now()
      }
    }
  })
  if (!depCollection) return generate(ast, {}, code).code
}

function umdToModule(code, importName, importType) {
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
    newFileContent = `;(function(){${code}}).call(window);
      ${modules}; export default ${exportConf};`
  }
  return newFileContent
}

module.exports = {
  resolveImporter,
  convertImportByAst,
  umdToModule,
}

