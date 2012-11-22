var r = require('rethinkdb'),
  Q = require('q');

/**
 * Returns a promise for a database connection, connecting if required.
 * @return {Q(rethinkdb)}
 */
module.exports = function() {
  if (module.promise) {
    // We're currently connecting
    return module.promise;
  } else if(!module.conn) {
    // We aren't connected yet
    var deferred = Q.defer();
    r.connect({
      host: module.exports.config.host,
      port: module.exports.config.port
    }, function(conn) {
      module.promise = null;
      module.conn = conn;
      conn.use(module.exports.config.database);
      deferred.resolve(r);
    }, function() {
      module.promise = null;
      deferred.reject(new Error('Unable to connect to database'));
    });
    module.promise = deferred.promise;
    return deferred.promise;
  }
  return Q.fcall(function() {
    return r;
  });
};

module.exports.config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 28015,
  database: process.env.DB_DATABASE || 'test'
};

module.exports.qcollect = function(query) {
  var deferred = Q.defer();
  query.collect(function(result) {
    deferred.resolve(result);
  });
  return deferred.promise;
};