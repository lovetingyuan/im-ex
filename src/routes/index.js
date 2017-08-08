const express = require('express');
const router = express.Router();
const path = require('path')

const response = require('../services/sendRes')
const readFile = require('../services/readFile')
const indexContent = require('../services/getIndex')

/* GET home page. */
router.get('/', function (_, res) {
  const indexHtmlContentParsed = indexContent()
  res.status(200)
    .type('html')
    .send(indexHtmlContentParsed)
})

// router.get(/node_modules/, function(req, res, next) {
//   res.setHeader('Cache-Control', 'public, max-age=' + 60 * 60 * 24 * 7) // cache a week
//   next()
// })

module.exports = router;
