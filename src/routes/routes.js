const fs = require('fs')
const path = require('path')

const routes = fs.readdirSync(__dirname)
  .filter(v => v !== path.basename(__filename))

module.exports = function applyRoutes(app) {
  routes.forEach(route => {
    if (route === 'index.js') {
      app.use(['/', '/index.html'], require('./index'))
    } else {
      app.use('/' + route.split('.')[0], require('./' + route))
    }
  })
}
