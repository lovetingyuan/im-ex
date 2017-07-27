module.exports = function(res, result) {
  res.status(200)
    .type('application/javascript')
    .send(result)
}