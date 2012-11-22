var migrate = require('../../lib/db/migrate');

migrate.migrate()
.then(function() {
  console.log('Migrations run successfully');
  process.exit(0);
}, function(error) {
  console.log(error.stack);
  process.exit(1);
});
