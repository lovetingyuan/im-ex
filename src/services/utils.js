const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

exports.readFile = function (filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf8' })
}

exports.sendScript = function (res, body) {
  res.status(200)
    .type('application/javascript')
    .send(body)
}

exports.handleError = function (err, exit = true) {
  console.error(chalk.bold.red(err))
  if (exit) {
    process.exit(1)
  }
}
