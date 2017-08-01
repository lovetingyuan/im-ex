const express = require('express');
const router = express.Router();
const path = require('path')

const response = require('../services/sendRes')
const readFile = require('../services/readFile')

/* GET home page. */
router.get('/*', function (req, res, next) {
  const reqPath = req.path[0] === '/' ? req.path.substr(1) : req.path
  req.locals = req.locals || {}
  req.locals.filePath = path.resolve(config.root, reqPath)
  req.locals.ext = path.extname(reqPath).substr(1).toLowerCase()
  req.locals.isThirdModule = /node_modules\//.test(reqPath)
  next()
});

module.exports = router;
