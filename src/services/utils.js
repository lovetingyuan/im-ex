const fs = require('fs')
const path = require('path')
const join = path.join
const chalk = require('chalk')
const slash = require('slash')
const querystring = require('querystring')

function readFile(filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf8' })
}

function sendScript(res, body) {
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

function toAbsolutePath(pathStr) {
  if (pathStr[0] === '/' && pathStr[1] !== '.' && pathStr[1] !== '/') return pathStr
  if (pathStr.substr(0, 2) === './' && pathStr[2] !== '.' && pathStr[2] !== '/') {
    return pathStr.substr(1)
  }
  if (pathStr[0] !== '.' && pathStr !== '/') return '/' + pathStr
  if (path.isAbsolute(pathStr)) {
    pathStr = '/' + slash(path.relative(config._server.root, pathStr))
  }
  handleError(`
    Invalid path value: ${pathStr},
    which must be under your server root path
  `)
}

module.exports = {
  sendScript,
  readFile,
  handleError,
  toAbsolutePath,
}