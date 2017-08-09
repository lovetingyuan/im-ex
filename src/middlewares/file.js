const path = require('path')
const slash = require('slash')
const sendScript = require('../services/utils').sendScript

module.exports = function file (req, res, next) {
  if (req.query.type === 'file') {
    next()
  } else {
    const relativePath = slash(path.relative(config._root, req.locals.filePath))
    sendScript(res, `export default "${relativePath}?type=file";`)
  }
}