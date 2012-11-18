exports.register = function(app) {
  app.get('/users/:id', exports.read);
  app.get('/users', exports.index);
};

exports.index = function(req, res) {
  res.send("respond with a resource");
};

exports.read = function(req, res) {
  res.send(req.params.id);
};
