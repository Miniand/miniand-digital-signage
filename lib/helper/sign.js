var sign = require('../sign'),
  _ = require('underscore'),
  Q = require('q'),
  db = require('../db');

exports.files = function(signId) {
  var filesPath = sign.filesPath(signId);
  return sign.filesWithStats(signId)
  .then(function(filesWithStats) {
    return _.map(_.filter(filesWithStats, function(fileWithStats) {
      return !fileWithStats.stats.isDirectory();
    }), function(fileWithStats) {
      return fileWithStats.file.replace(filesPath + '/', '');
    });
  });
};

exports.builtFilePaths = function(signId) {
  var buildPath = sign.buildPath(signId);
  return sign.builtFilesWithStats(signId)
  .then(function(filesWithStats) {
    return _.map(_.filter(filesWithStats, function(fileWithStats) {
      return !fileWithStats.stats.isDirectory();
    }), function(fileWithStats) {
      return '/signs/' + signId + '/play/' +
        fileWithStats.file.replace(buildPath + '/', '');
    });
  });
};

exports.indexViewData = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.table(sign.tableName()).run());
  })
  .then(function(result) {
    return {
      signs: _.map(result, function(row) {
        return {
          id: row.id,
          name: row.name,
          type: row.type,
          entry: row.entry
        };
      }),
      helper: exports
    };
  });
};

exports.newViewData = function() {
  return Q.fcall(function() {
    return {
      helper: exports
    };
  });
};

exports.editViewData = function(signId) {
  return Q.all([
    db()
    .then(function(r) {
      return db.qcollect(r.table(sign.tableName()).get(signId).run());
    }),
    exports.files(signId)
  ])
  .spread(function(result, files) {
    var row = result[0];
    if (row === undefined) throw new Error('Unable to find sign');
    return {
      sign: {
        id: row.id,
        name: row.name,
        type: row.type,
        entry: row.entry,
        files: files
      },
      helper: exports
    };
  });
};

exports.readViewData = function(signId) {
  return Q.all([
    db()
    .then(function(r) {
      return db.qcollect(r.table(sign.tableName()).get(signId).run());
    }),
    exports.files(signId)
  ])
  .spread(function(result, files) {
    var row = result[0];
    if (row === undefined) throw new Error('Unable to find sign');
    return {
      sign: {
        id: row.id,
        name: row.name,
        type: row.type,
        entry: row.entry,
        files: files
      },
      helper: exports
    };
  });
};

exports.path = function() {
  return '/signs';
};

exports.newPath = function() {
  return exports.path() + '/new';
};

exports.readPath = function(productId) {
  return exports.path() + '/' + productId;
};

exports.editPath = function(productId) {
  return exports.readPath(productId) + '/edit';
};

exports.filesPath = function(productId) {
  return exports.readPath(productId) + '/files';
};
