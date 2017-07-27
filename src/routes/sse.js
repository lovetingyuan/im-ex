var SSE = require('express-sse');
var sse = new SSE();

var express = require('express');
var router = express.Router();
const watch = require('../services/watch')
let watchList = config.server.watch.concat(config.server.index)
watch(watchList, changeList => {
  console.log('changelist', changeList)
  sse.send({
    type: 'reload:script',
    list: changeList
  })
})

/* GET home page. */
router.get('/', sse.init);

module.exports = router;
