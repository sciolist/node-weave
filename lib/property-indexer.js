var Q = require('q');

module.exports = exports = PropertyIndexer;
function PropertyIndexer(root, property) {
  var parts = property.split('.'), data = null;

  function getProperty(item) {
    var prev = item;
    for(var i=0; item && i<parts.length; ++i) {
      prev = item;
      item = item[parts[i]];
      if(item && item instanceof Function) {
        item = item.call(prev);
      }
    }
    return item;
  }

  function build(item) {
    if(!data) data = {};
    if(item.childNodes && item.childNodes.length) {
      item.childNodes.map(build);
    }
    var key = getProperty(item);
    if(key === undefined) return;
    if(!data[key]) { data[key] = []; }
    data[key].push(item);
  }

  return function find(value) {
    if(!data) build(root);
    return data[value] || [];
  }
}

