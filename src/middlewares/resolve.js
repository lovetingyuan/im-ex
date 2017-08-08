const path = require('path')

const fs = require('fs')
const slash = require('slash')
const { join, resolve, extname, relative } = require('path').posix

const response = require('../services/sendRes')
const readFile = require('../services/readFile')
const css = require('../services/css')
const json = require('../services/json')
const script = require('../services/script')

module.exports = function (app) {
  app.use(function (req, res, next) {
    if (!req.query.type) return next()
    const ext = req.locals.ext
    let ret
    if (['js', 'jsx'].includes(ext)) {
      ret = script(req)
    } else if (['css', 'scss', 'sass', 'less', 'styl'].includes(ext)) {
      ret = css(req)
    } else if (ext === 'json') {
      ret = json(req)
    } else if (['jpg', 'jpeg', 'webp', 'png', 'gif', 'bmp', 'svg', 'mp3', 'ogg', 'mp4'].includes(ext)) {
      if (req.query.type === 'file') {
        next()
      } else {
        const relativePath = relative(config.server.root, req.path)
        res.status(200)
          .type('application/javascript')
          .send(`export default "${relativePath}?type=file";`)
      }
    } else {
      next()
    }
    if (ret) {
      ret.then(code => {
        res.status(200)
          .type('application/javascript')
          .send(code)
      }).catch(next)
    }
  })
}
