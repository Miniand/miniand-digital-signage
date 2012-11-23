module.exports = function(req, res) {
  return function(error) {
    res.set('Content-Type', 'text/plain');
    res.send(500, error.stack);
  };
};
