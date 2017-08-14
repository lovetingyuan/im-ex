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
 
function resolveFile(pathStr, dir = config._server.root) {
  pathStr = path.resolve(dir, pathStr)
  if (fs.existsSync(pathStr)) {
    let stat = fs.statSync(pathStr)
    if (stat.isFile()) 
      return slash('/' + path.relative(config._server.root, pathStr))
  }
  const resolve = index => {
    for (let i = 0; i < config.resolve.exts.length; i++) {
      let ext = '.' + config.resolve.exts[i]
      if (index) {
        let _pathStr = path.posix.join(pathStr, 'index' + ext)
        if (fs.existsSync(_pathStr)) {
          let stat = fs.statSync(_pathStr)
          if (stat.isFile()) return _pathStr
        }
      } else {
        let _pathStr = pathStr + ext
        if (fs.existsSync(_pathStr)) {
          let stat = fs.statSync(_pathStr)
          if (stat.isFile()) return _pathStr
        }
      }
    }
  }
  const ret = resolve(false) || resolve(true)
  if (!ret) {
    handleError(`${pathStr} not found`)
  }
  return '/' + slash(path.relative(config._server.root, ret))
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
  if (importer.indexOf('!') >= 0) { // webpack inline loader, we ignore
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
  let error = (importPath) => {
    handleError(`module: ${importPath} has not been resolved at ${currentPath},
    you can config the module file path in "config.resolve.import"`
    )
  }

  if (importPath[0] === '.' || importPath[0] === '/') {
    let contextDir = importPath[0] === '.' ? path.dirname(currentPath) : config._server.root
    // meta.filePath = filePath
    meta.importer = resolveFile(importPath, contextDir)
    meta.moduleType = 'module'
  } else { // third module
    /**
     *'react-intl': { // react-intl, react-intl/locals/en
        path: 'node_modules/react-intl/dist/react-intl.js',
        export: 'ReactIntl'
      },
      'react-intl': /node_modules/react-intl/
      'sanitize.css': './node_modules/sanitize.css',  sanitize.css/sanitize.css

      components: './app/components',   components/App
     */
    const resolveImport = config.resolve.import
    let moduleName = importPath

    if (importPath.indexOf('/') > 0) {
      moduleName = importPath.split('/')[0]
      if (!(moduleName in resolveImport)) {
        error(importPath)
      }
      if (typeof resolveImport[moduleName] === 'object') {
        let _path = resolveImport[moduleName].path.substr(1)
        _path = _path.substr(0, _path.indexOf('node_modules'))
        _path = path.posix.join(_path, 'node_modules', importPath)
        meta.importer = resolveFile(_path)
        meta.moduleType = 'aliasThirdModule'
      } else {
        let _path = resolveImport[moduleName]
        _path = path.posix.join(_path.substr(1), importPath.substr(moduleName.length + 1))
        meta.importer = resolveFile(_path)
        if (/node_modules\//.test(_path)) {
          meta.moduleType = 'aliasThirdModule'
        } else {
          meta.moduleType = 'aliasModule'
        }
      }
    } else {
      if (!(moduleName in resolveImport)) {
        error(moduleName)
      }
      meta.importer = resolveImport[importPath].path
      meta.moduleType = 'thirdModule'
    }
  }
  return meta
}

function convertImportByAst(code, filePath, depCollection) {
  const ast = babylon.parse(code, {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    plugins: ['jsx', 'objectRestSpread', 'classProperties', 'asyncGenerators', 'dynamicImport']
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
      if (importStr === 'babel-polyfill') {
        path.replaceWith(t.stringLiteral('babel-polyfill'));
        // path.node.source.value += '?__imex__=__imex__&moduleType=ignore'
        return
      }
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

