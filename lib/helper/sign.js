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
      })
    };
  });
};

exports.newViewData = function() {
  return Q.fcall(function() {
    return {
    };
  });
};

exports.editViewData = function(signId) {
  return sign.find(signId)
  .then(function(s) {
    return [s, sign.programs(s)];
  })
  .spread(function(s, programs) {
    if (s === undefined) throw new Error('Unable to find sign');
    return {
      sign: {
        id: s.id,
        name: s.name,
        programs: programs
      }
    };
  });
};

exports.readViewData = function(signId) {
  return sign.find(signId)
  .then(function(s) {
    return [s, sign.programs(s)];
  })
  .spread(function(s, programs) {
    if (s === undefined) throw new Error('Unable to find sign');
    return {
      sign: {
        id: s.id,
        name: s.name,
        programs: programs
      }
    };
  });
};

exports.path = function() {
  return '/signs';
};

exports.newPath = function() {
  return exports.path() + '/new';
};

exports.readPath = function(signId) {
  return exports.path() + '/' + signId;
};

exports.editPath = function(signId) {
  return exports.readPath(signId) + '/edit';
};

exports.programsPath = function(signId) {
  return exports.readPath(signId) + '/programs';
};

exports.playPath = function(signId) {
  return exports.readPath(signId) + '/play';
};
