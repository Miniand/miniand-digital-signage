var Q = require('q'),
  fs = require('fs'),
  _ = require('underscore'),
  moment = require('moment'),
  sign = require('../lib/sign'),
  program = require('../lib/program'),
  helper = require('../lib/helper');

exports.register = function(app) {
  app.locals.helper = helper;
  app.get('/signs/:id/play/cache.appcache', exports.playAppCacheAction);
  app.get('/signs/:id/play', exports.playAction);
  app.get('/signs/:id/edit', exports.editAction);
  app.post('/signs/:id/programs', exports.programsAddAction);
  app.get('/signs/new', exports.newAction);
  app.put('/signs/:id', exports.updateAction);
  app.get('/signs/:id', exports.readAction);
  app.post('/signs', exports.createAction);
  app.get('/signs', exports.indexAction);
};

exports.playAppCacheAction = function(req, res) {
  sign.find(req.params.id)
  .then(function(s) {
    return [s, sign.programs(s)];
  })
  .spread(function(s, programs) {
    return [s, programs, Q.all(_.map(programs, function(p) {
      return program.buildIfRequired(p);
    }))];
  })
  .spread(function(s, programs) {
    return [s, Q.all(_.map(programs, function(p) {
      return Q.all([p, helper.program.builtFilePaths(p.id),
        program.lastBuildTime(p.id)]);
    }))];
  })
  .spread(function(s, cacheFilesAndTimes) {
    var cacheFiles = [
      [css('sign-play'), css('program-play'), helper.sign.playPath(s.id)],
      js('sign-play'),
      js('program-play')
    ];
    var times = [moment(s.updatedAt)];
    _.each(cacheFilesAndTimes, function(pft) {
      cacheFiles.push(pft[1], [helper.program.playPath(pft[0].id)]);
      times.push(moment(pft[0].updatedAt), pft[2]);
    });
    var latestTime = _.max(times, function(time) {
      return time.valueOf();
    });
    cacheFiles = _.union.apply(_, cacheFiles);
    res.setHeader('Content-Type', 'text/cache-manifest');
    res.render('programs/play/cache.appcache.mustache', {
      lastBuildTime: latestTime.utc().format(),
      cacheFiles: cacheFiles.sort().join("\n")
    });
  })
  .fail(helper.error(req, res));
};

exports.playAction = function(req, res) {
  sign.find(req.params.id)
  .then(function(s) {
    return [s, sign.programs(s)];
  })
  .spread(function (s, programs) {
    res.render('signs/play', {
      sign: s,
      programs: _.map(programs, function(p) {
        return {
          src: helper.program.playPath(p.id)
        };
      })
    });
  })
  .fail(helper.error(req, res));
};

exports.readAction = function(req, res) {
  helper.sign.readViewData(req.params.id)
  .then(function(readViewData) {
    res.render('signs/read', readViewData);
  })
  .fail(helper.error(req, res));
};

exports.indexAction = function(req, res) {
  helper.sign.indexViewData()
  .then(function(indexViewData) {
    res.render('signs/index', indexViewData);
  })
  .fail(helper.error(req, res));
};

exports.editAction = function(req, res) {
  helper.sign.editViewData(req.params.id)
  .then(function(editViewData) {
    res.render('signs/edit', editViewData);
  })
  .fail(helper.error(req, res));
};

exports.newAction = function(req, res) {
  helper.sign.newViewData()
  .then(function(newViewData) {
    res.render('signs/new', newViewData);
  })
  .fail(helper.error(req, res));
};

exports.createAction = function(req, res) {
  sign.insert(req.body.sign)
  .then(function(s) {
    res.redirect(helper.sign.readPath(s.id));
  })
  .fail(helper.error(req, res));
};

exports.programsAddAction = function(req, res) {
  sign.find(req.params.id)
  .then(function(s) {
    s.programs.push(req.body.program.id);
    return sign.update(s);
  })
  .then(function() {
    res.redirect(helper.sign.readPath(req.params.id));
  })
  .fail(helper.error(req, res));
};

exports.updateAction = function(req, res) {
  s = req.body.sign;
  s[sign.idFieldName()] = req.params.id;
  sign.update(s)
  .then(function() {
    res.redirect(helper.sign.readPath(req.params.id));
  })
  .fail(helper.error(req, res));
};
