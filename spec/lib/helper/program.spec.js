var programHelper = require('../../../lib/helper/program');

describe('A program helper', function() {
  it('should get a list of built files', function(done) {
    programHelper.filePaths('test')
    .then(function(paths) {
      done();
    }, function(error) {
      console.log(error.stack);
      expect(false).toBe(true);
      done();
    });
  });
});