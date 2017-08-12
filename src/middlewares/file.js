const path = require('path')
const slash = require('slash')
const sendScript = require('../services/utils').sendScript

module.exports = function file (req, res, next) {
  if (!req.query.__imex__) return next()
  if (req.query.type === 'file') {
    next()
  } else {
    const relativePath = slash('/' + path.relative(config._server.root, req.locals.filePath))
    sendScript(res, `export default "${relativePath}";`)
  }
}