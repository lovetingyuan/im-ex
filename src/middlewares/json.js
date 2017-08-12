const json5 = require('json5')
const { readFile, sendScript} = require('../services/utils')

module.exports = function json(req, res, next) {
  if (!req.query.__imex__) return next()
  const ext = req.locals.ext
  try {
    let ret 
    if (ext === 'json') {
      ret = require(req.locals.filePath)
    } else if (ext === 'json5') {
      ret = json5.parse(readFile(req.locals.filePath))
    }
    sendScript(res, `export default ${JSON.stringify(ret)};`)
  } catch (e) {
    next(e)
  }
}