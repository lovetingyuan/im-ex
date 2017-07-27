const fs = require('fs')
const path = require('path')

const routes = fs.readdirSync(__dirname)
  .filter(v => v !== path.basename(__filename))

module.exports = function applyRoutes(app) {
  routes.forEach(route => {
    if (route === 'index.js') route = ''
    else route = route.split('.')[0]
    app.use('/' + route, require('./' + route))
  })
}
