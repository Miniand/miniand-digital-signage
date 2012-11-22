var db = require('../../db');

exports.up = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.db(db.config.database).tableCreate('signs').run())
    .then(function() {
      db.qcollect(r.db(db.config.database).tableCreate('programs').run());
    });
  });
};