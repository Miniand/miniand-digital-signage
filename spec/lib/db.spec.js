var db = require('../../lib/db'),
  Q = require('q');

describe('Database connection', function() {
  it('should connect', function(done) {
    db()
    .then(function(r) {
      expect(r).not.toBe(false);
      done();
    }, function(err) {
      expect(err).toBe(null);
      done();
    });
  });
});
