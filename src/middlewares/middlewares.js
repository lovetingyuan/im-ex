const fs = require('fs')
const path = require('path')
const middlewares = fs.readdirSync(__dirname)
  .filter(v => v !== path.basename(__filename))
  .sort((a, b) => a.split('_')[0] > b.split('_')[0])

module.exports = function applyMiddlewares(app) {
  middlewares.forEach(middleware => {
    app.use(require('./' + middleware)())
  })
}
