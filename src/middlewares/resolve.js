const sendScript = require('../services/utils').sendScript
const path = require('path')

const warningModule = {}

const { convertImportByAst, umdToModule } = require('../services/resolveImport')

module.exports = function (req, res, next) {
  if (!req.query.__imex__) return next()
  const fileContent = res.body
  const {
    moduleType,
    importType,
    importStr,
    importer,
    // filePath
  } = req.query
  let ret = ''
  try {
    if (moduleType === 'ignore') {
      ret = `export default {}`
    } else if (moduleType === 'entryModule') {
      ret = convertImportByAst(fileContent, path.resolve(config._server.root, req.locals.reqPath))
    } else if (['thirdESModule', 'aliasModule', 'module'].includes(moduleType)) {
      ret = convertImportByAst(fileContent, req.locals.filePath)
    } else if (moduleType === 'thirdUMDModule') {
      ret = umdToModule(fileContent, importStr, JSON.parse(importType))
    }
    sendScript(res, ret)
  } catch(e) {
    next(e)
    console.error('babylon error', req.locals.filePath)
  }
}