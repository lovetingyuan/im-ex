const isFile = ext => {
  return [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'
  ].includes(ext)
}
const response = require('../services/sendRes')
const path = require('path')

module.exports = function () {
  return function (req, res, next) {
    if (!isFile(req.locals.ext)) return next()
    if (req.query.action === 'file') {
      next()
    } else {
      const relativePath = path.posix.relative(config.server.root, req.path)
      response(res, `export default "${relativePath}?action=file"`)
    }
  }
}
