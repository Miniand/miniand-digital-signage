var fs = require('fs'),
  Q = require('q');

exports.db = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 28015,
  database: process.env.DB_DATABASE || 'test'
};

exports.uploads = {
  dir: fs.realpathSync(process.env.UPLOAD_DIR || __dirname + '/../uploads')
};
