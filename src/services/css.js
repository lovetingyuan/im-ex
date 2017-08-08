const sass = require('sass.js/dist/sass.node')
const less = require('less')
const readFile = require('./readFile')
const stylus = require('stylus');

module.exports = function css(req) {
  const ext = req.locals.ext
  const resolveCss = code => `${config._browserNameSpace}.setStyle(\`${code}\`);`
  return new Promise((resolve, reject) => {
    if (ext === 'scss' || ext === 'sass') {
      sass(req.locals.filePath, ({ status, text }) => {
        if (status) reject(new Error(`sass compile error: ${req.path} with status: ${status}`))
        else resolve(resolveCss(text))
      });
    } else if (ext === 'less') {
      less.render(readFile(req.locals.filePath), (e, output) => {
        e ? reject(e) : resolve(resolveCss(output.css))
      });
    } else if (ext === 'styl') {
      stylus.render(readFile(req.locals.filePath), (err, css) => {
        err ? reject(err) : resolve(resolveCss(css))
      });
    } else {
      resolve(resolveCss(readFile(req.locals.filePath)))
    }
  })
}