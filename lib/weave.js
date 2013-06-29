var Q = require('q');
var _ = require('underscore');
var pathUtil = require('path');
var Loader = require('./loader');
var Node = require('./node');
var PropertyIndexer = require('./property-indexer');

module.exports = exports = Weave;
function Weave(opts) {
  if(!(this instanceof Weave)) return new Weave(opts);
  this.loader = (opts.loader || Loader.create)(this, opts);
  this.indexers = opts.indexers || {};
  this.create = opts.create;

  if(typeof this.create === 'function') return;
  this.create = function(data) {
    var typeName = data && data.type;
    var type = (opts.types && opts.types[typeName]) || Node;
    return type(this, data);
  }
}

var weave = Weave.prototype;

weave.handle = function weave(req, res, next) {
  req.weave = this;
  this.navigate('/', function(err, result) {
    req.page = result;
    next();
  })
};

weave.navigate = function navigate(path, cb) {
  var self = this;

  return Q.fcall(fetchRoot)
    .then(fetchNode)
    .nodeify(cb);
  
  function fetchRoot() {
    return self.loader();
  }

  function fetchNode(root) {
    var def = Q.defer();
    root.navigate(path, function(err, result) {
      if(err) def.reject(err);
      else def.resolve(result);
    });
    return def.promise;
  }
};

weave.index = function index(type) {
  var self = this;
  return { find: find };
  
  function find(value, uniqueResult, cb) {
    if(arguments.length === 2) {
      cb = uniqueResult;
      uniqueResult = true;
    }

    return Q.resolve('')
      .then(function(root) { return self.navigate(root); })
      .then(getIndex)
      .then(queryIndex)
      .then(fetchValue)
      .nodeify(cb);

    function getIndex(node) {
      var list = node._indexes || (node._indexes = {});
      if(list[type]) return list[type];
      var indexer = this.indexers && this.indexers[type];
      if(!indexer) indexer = PropertyIndexer;
      return list[type] = indexer(node, type);
    }

    function queryIndex(index) {
      return Q.ninvoke(index, index.get, value);
    }

    function fetchValue(results) {
      if(uniqueResult === false) return results;
      if(results.length > 1) return Q.reject(new Error(type + ' value was not unique'));
      return results[0];
    }
  }
};

exports.page = weave.page = function(param) {
  var validators = Array.prototype.slice.call(arguments, 1);
  function valid(page) {
    for(var i=0; i<validators.length; ++i) {
      if(_.all(validators[i], function(value, name) { return value === page[name] })) {
        return true;
      }
    };
    return validators.length === 0;
  }

  return function weaveResolvePage(req, res, next) {
    if(!req.weave) return next(new Error('Weave not loaded.'));
    var path = req.params[param];
    req.weave.navigate(path, function(err, result) {
      if(err || !valid(result)) return next('route');
      req.page = result;
      next();
    });
  };
};

