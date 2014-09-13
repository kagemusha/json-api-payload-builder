module.exports = process.env.JSCOV
  ? require('./lib-cov')
  : require('./lib/json-api-payload-builder.js');
