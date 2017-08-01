// TODO check config format, provide a default config
const path = require('path')
const fs = require('fs')
const errorHandler = require('./services/errorHandler')
const configPath = path.resolve(process.cwd(), './config.js')

let _config = require(configPath)

function checkConfig(userConfig) {
  return true // TODO
}

function getFinalConfig(userConfig) {
  // 1 server的根路径
  // 2 config的路径
  // 3 进程跑起的路径 首先知道config的绝对路径（根据process的路径得出），
  // 然后根据server.root可以知道server的绝对根路径， 也可以知道其余的
  // 
  userConfig._root = path.resolve(process.cwd(), userConfig.server.root)

  return Object.assign({}, userConfig) // TODO
}

if (typeof _config === 'function') {
  _config = config()
}

if (!checkConfig(_config)) errorHandler('the config is not valid')

config = getFinalConfig(_config) // export config to global scope
