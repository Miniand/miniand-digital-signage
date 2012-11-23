var fs = require('fs'),
  program = require('../lib/program'),
  programHelper = require('../lib/helper/program'),
  errorHelper = require('../lib/helper/error');

exports.register = function(app) {
  app.post('/programs/:id/files', exports.filesUploadAction);
  app.get('/programs/:id/play/cache.appcache', exports.playAppCacheAction);
  app.get('/programs/:id/play', exports.playAction);
  app.get('/programs/:id/edit', exports.editAction);
  app.get('/programs/new', exports.newAction);
  app.get('/programs/:id', exports.readAction);
  app.post('/programs', exports.createAction);
  app.get('/programs', exports.indexAction);
};

exports.playAppCacheAction = function(req, res) {
  // var buildTime = program.buildTime
  res.setHeader('Content-Type', 'text/cache-manifest');
  res.render('programs/play/cache.appcache.mustache', {
    css: css('program_play'),
    js: js('program_play').join("\n")
  });
};

exports.playAction = function(req, res) {
  res.render('programs/play', {
    id: req.params.id
  });
};

exports.readAction = function(req, res) {
  programHelper.readViewData(req.params.id)
  .then(function(readViewData) {
    res.render('programs/read', readViewData);
  })
  .fail(errorHelper(req, res));
};

exports.indexAction = function(req, res) {
  programHelper.indexViewData()
  .then(function(indexViewData) {
    res.render('programs/index', indexViewData);
  })
  .fail(errorHelper(req, res));
};

exports.editAction = function(req, res) {
  programHelper.editViewData(req.params.id)
  .then(function(editViewData) {
    res.render('programs/edit', editViewData);
  })
  .fail(errorHelper(req, res));
};

exports.newAction = function(req, res) {
  res.render('programs/new');
};

exports.createAction = function(req, res) {
  program.insert(req.body.program)
  .then(function(p) {
    res.redirect(programHelper.readPath(p.id));
  })
  .fail(errorHelper(req, res));
};

exports.filesUploadAction = function(req, res) {
  program.saveFile(fs.createReadStream(req.files.file.path), req.body.name,
    req.params.id)
  .then(function() {
    res.redirect(programHelper.readPath(req.params.id));
  })
  .fail(errorHelper(req, res));
};
