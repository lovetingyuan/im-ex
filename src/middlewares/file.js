const path = require('path')
const slash = require('slash')

module.exports = function file (req, res, next) {
  if (req.query.type === 'file') {
    next()
  } else {
    const relativePath = slash(path.relative(config._root, req.locals.filePath))
    res.status(200)
      .type('application/javascript')
      .send(`export default "${relativePath}?type=file";`)
  }
}