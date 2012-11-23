var Q = require('q'),
  glob = require('glob'),
  _ = require('underscore'),
  fs = require('fs');

/**
 * Wrapper of fs.exists using promises.
 * @param  {String} path
 * @return {Q(Boolean)}
 */
exports.exists = function(path) {
  var deferred = Q.defer();
  fs.exists(path, function(exists) {
    deferred.resolve(exists);
  });
  return deferred.promise;
};

/**
 * Lists all files (absolute paths) and directories underneath a directory.
 * @param  {String} path
 * @return {Q(Array)}
 */
exports.recursiveLs = function(path) {
  return exports.exists(path)
  .then(function(exists) {
    if (!exists) return [];
    return Q.ncall(glob, glob, path + '/**/*');
  });
};

/**
 * Return the recursive ls for the given path along with stats.
 * @param  {String} path
 * @return {Q(Array)} Files are returnes as objects, with file being the
 * absolute path to the file, and stats being the stats of the file
 */
exports.recursiveLsWithStats = function(path) {
  return exports.recursiveLs(path)
  .then(function(files) {
    return Q.all(_.map(files, function(file) {
      return Q.ncall(fs.stat, fs, file)
      .then(function(stats) {
        return {
          file: file,
          stats: stats
        };
      });
    }));
  });
};