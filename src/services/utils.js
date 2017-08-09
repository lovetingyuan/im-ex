const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const slash = require('slash')

exports.readFile = function (filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf8' })
}

exports.sendScript = function (res, body) {
  res.status(200)
    .type('application/javascript')
    .send(body)
}

function handleError(err, exit = true) {
  console.error(chalk.bold.red(err))
  if (exit) {
    process.exit(1)
  }
}
exports.handleError = handleError

exports.toAbsolutePath = function (pathStr) {
  if (pathStr[0] === '/' && pathStr[1] !== '.' && pathStr[1] !== '/') return pathStr
  if (pathStr.substr(0, 2) === './' && pathStr[2] !== '.' && pathStr[2] !== '/') {
    return pathStr.substr(1)
  }
  if (pathStr[0] !== '.' && pathStr !== '/') return '/' + pathStr
  handleError(`
    Invalid path value: ${pathStr},
    which must be under your server root path
  `)
}
