const babel = require('babel-core')
const readFile = require('../services/utils').readFile
const coffee = require('coffeescript')

module.exports = function script(req, res, next) {
  if (!req.query.__imex__) return next()
  const ext = req.locals.ext
  if (ext === 'jsx') {
    babel.transformFile(req.locals.filePath, {
      plugins: [['transform-react-jsx', { useBuiltIns: true }]],
      sourceMaps: 'inline'
    }, (err, result) => {
      if (err) return next(err)
      else {
        res.body = result.code
        next()
      }
    })
  } else if (ext === 'coffee') {
    res.body = coffee.compile(readFile(req.locals.filePath), {
      inlineMap: true, bare: true, filename: req.locals.reqPath
    })
    next()
  } else {
    res.body = readFile(req.locals.filePath)
    next()
  }

}