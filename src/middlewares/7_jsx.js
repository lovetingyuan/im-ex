const babel = require('babel-core')
// const url = require('url')
module.exports = function () {
  return function (req, res, next) {
    if (req.locals.ext !== 'jsx') return next()
    babel.transformFile(req.locals.filePath, {
      plugins: [
        ['transform-react-jsx', { useBuiltIns: true }]
      ]
    }, function (err, result) {
      if (err) {
        next(err)
      } else {
        res.body = result.code
        next()
      }
    })
  }
}