/* eslint-disable */

var pkg = require('./package.json');
var path = require('path');

var BASE_PATH = pkg.config ? (pkg.config.base || 'lib') : 'lib';
var start = require(path.resolve(__dirname, BASE_PATH, 'index'));

module.exports = start;
