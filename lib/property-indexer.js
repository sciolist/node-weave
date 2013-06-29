var Q = require('q');

module.exports = exports = PropertyIndexer;
function PropertyIndexer(root, property) {
  var parts = property.split('.'), data = null;

  function getProperty(item) {
    for(var i=0; item && i<parts.length; ++i) item = item[parts[i]];
    return item;
  }

  function build(item) {
    if(!data) data = {};
    return Q.all((item.childNodes||[]).map(build))
     .then(function(v) { return getProperty(item); })
     .then(function(v) { (data[v] || (data[v] = [])).push(item); });
  }

  return function get(value, cb) {
    return Q.resolve(data)
     .then(function() { if(!data) return build(root); })
     .then(function() { return data[value] || []; })
     .nodeify(cb);
  }
}

