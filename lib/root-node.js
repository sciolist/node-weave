var urlUtil = require('url');
var PropertyIndexer = require('./property-indexer');

module.exports = exports = RootNode;
function RootNode(data) {
  this.childNodes = data.childNodes || [];
  this.system = data.system;
  this.title = '';
  this.urlName = undefined;
  this.hidden = true;
  this.root = true;
}

RootNode.create = function create(weave, data, done) {
  try {
    var node = new RootNode(data);
    done(null, node);
  } catch(ex) {
    done(ex);
  }
}

RootNode.prototype.webRoot = function webRoot() {
  return this.find('webRoot', true) || this.childNodes[0];
}

RootNode.prototype.navigate = function navigate(path) {
  if(!path || path === '/') return this.webRoot();
  path = urlUtil.resolve('/', path);
  return this.find('url', path);
}

RootNode.prototype.findAll = function findAll(source, param, value) {
  if(arguments.length === 1) {
    value  = true;
    param  = source;
    source = this;
  } else if(arguments.length === 2) {
    value = param;
    param = source;
    source = this;
  }
  return this.index(source, param).find(value, false);
}

RootNode.prototype.find = function find(source, param, value) {
  if(arguments.length === 1) {
    value  = source;
    param  = 'id';
    source = this;
  } else if(arguments.length === 2) {
    value = param;
    param = source;
    source = this;
  }
  return this.index(source, param).find(value);
}

RootNode.prototype.index = function index(source, type) {
  if(arguments.length === 1) {
    type = source;
    source = this;
  }
  return { find: find };
  
  function find(value, uniqueResult) {
    var index = getIndex(source);
    var queryResult = queryIndex(index);
    return fetchValue(queryResult);

    function getIndex(node) {
      var list = node._indexes || (node._indexes = {});
      if(list[type]) { return list[type]; }
      var indexer = this.indexers && this.indexers[type];
      if(!indexer) indexer = PropertyIndexer;
      return list[type] = indexer(node, type);
    }

    function queryIndex(index) {
      return index(value);
    }

    function fetchValue(results) {
      if(uniqueResult === false) return results || [];
      if(!results || results.length <= 0) return null;
      if(results.length > 1) throw new Error(type + ' value was not unique');
      return results[0];
    }
  }
}

RootNode.prototype.url = function url() { return undefined; }
RootNode.prototype.ancestors = function ancestors() { return []; }
RootNode.prototype.breadcrumb = function breadcrumb() { return []; }

