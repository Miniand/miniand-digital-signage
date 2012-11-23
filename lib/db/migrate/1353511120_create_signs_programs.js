var db = require('../../db'),
  config = require('../../config');

exports.up = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.db(config.db.database).tableCreate('signs').run())
    .then(function() {
      db.qcollect(r.db(config.db.database).tableCreate('programs').run());
    });
  });
};