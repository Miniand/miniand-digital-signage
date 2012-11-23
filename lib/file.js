var Q = require('q'),
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
