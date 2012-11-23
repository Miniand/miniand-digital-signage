exports.register = function(app) {
  app.get('/programs/:id/play/cache.appcache', exports.playCacheManifest);
  app.get('/programs/:id/play', exports.play);
  app.get('/programs/:id', exports.read);
  app.get('/programs', exports.index);
};

exports.playCacheManifest = function(req, res) {
  res.setHeader('Content-Type', 'text/cache-manifest');
  res.render('programs/play/cache.appcache.mustache', {
    css: css('program_play'),
    js: js('program_play').join("\n")
  });
};

exports.play = function(req, res) {
  res.render('programs/play', {
    id: req.params.id
  });
};

exports.read = function(req, res) {
  res.render('programs/read', {
    id: req.params.id
  });
};

exports.index = function(req, res) {
  res.render('programs/index');
};
