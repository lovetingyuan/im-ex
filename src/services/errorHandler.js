const chalk = require('chalk')
module.exports = function(err) {
  console.error(chalk.bold.red(err))
  process.exit(1)
}