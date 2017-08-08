const fs = require('fs')
const path = require('path')
const middlewares = ['resolve']

module.exports = function applyMiddlewares(app) {
  middlewares.forEach(middleware => require('./' + middleware)(app))
}
