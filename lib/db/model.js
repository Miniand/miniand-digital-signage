var Q = require('q'),
  _ = require('underscore'),
  db = require('../db');

exports.validateManyHard = function(data, validator) {
  return Q.fcall(function() {
    return [data, Q.all(_.map(data, function(element) {
      return validator(element);
    }))];
  })
  .spread(function(data, validations) {
    // Check the validations
    var errors = _.map(_.filter(validations, function(validation) {
      return validation.length > 0;
    }), function(validation, index) {
      return "Validation errors for element at offset " + index + "\n" +
        validation.join("\n");
    });
    if (errors.length > 0) throw new Error(errors.join("\n"));
    return data;
  });  
};

exports.prepareMany = function(data, preparer) {
  return Q.all(_.map(data, function(element) {
    return preparer(element);
  }));
};

exports.insertMany = function(data, validator, preparer, tableName, idField) {
  return exports.validateManyHard(data, validator)
  .then(function(validatedData) {
    return Q.all([db(), exports.prepareMany(validatedData, preparer)]);
  })
  .spread(function(r, preparedElements) {
    return [preparedElements,
      db.qcollect(r.table(tableName).insert(preparedElements).run())];
  })
  .spread(function(preparedElements, result) {
    if (result[0].errors > 0) throw new Error(result[0].errors +
      ' errors inserting');
    _.each(result[0].generated_keys, function(generatedKey, index) {
      preparedElements[index][idField] = generatedKey;
    });
    return preparedElements;
  });
};

exports.updateMany = function(data, validator, preparer, tableName, idField) {
  return exports.validateManyHard(data, validator)
  .then(function(validatedData) {
    return Q.all([db(), exports.prepareMany(validatedData, preparer)]);
  })
  .spread(function(r, preparedElements) {
    return [preparedElements, Q.all(_.map(preparedElements, function(e) {
      return db.qcollect(r.table(tableName)
        .get(e[idField]).update(e).run());
    }))];
  })
  .spread(function(preparedElements, result) {
    if (result[0].errors > 0) throw new Error(result[0].errors +
      ' errors updating');
    return preparedElements;
  });
};
