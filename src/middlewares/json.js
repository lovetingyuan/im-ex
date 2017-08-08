const json5 = require('json5')
const readFile = require('../services/readFile')

module.exports = function json(req, res, next) {
  const ext = req.locals.ext
  try {
    let ret 
    if (ext === 'json') {
      ret = require(req.locals.filePath)
    } else if (ext === 'json5') {
      ret = json5.parse(readFile(req.locals.filePath))
    }
    res.status(200)
        .type('application/javascript')
        .send(`export default ${JSON.stringify(ret)};`)
  } catch (e) {
    next(e)
  }
}