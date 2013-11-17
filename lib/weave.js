var Loader = require('./loader');
var Node = require('./node');

module.exports = exports = Weave;
function Weave(opts) {
  if(!(this instanceof Weave)) return new Weave(opts);
  this.loader = (opts.loader || Loader.create)(this, opts);
  this.indexers = opts.indexers || {};
  this.create = opts.create;

  if(typeof this.create === 'function') return;
  this.create = function(data, cb) {
    var typeName = data && data.type;
    var type = (opts.types && opts.types[typeName]) || Node.create;
    type(this, data, cb);
  }
}

var weave = Weave.prototype;

weave.handle = function weave(req, res, next) {
  this.loader().then(function(result) {
    req.weave = result;
    next();
  }, next);
};

exports.page = weave.page = function(param) {
  var validators = Array.prototype.slice.call(arguments, 1);
  function valid(page) {
    for(var i=0; i<validators.length; ++i) {
      for(var key in validators[i]) {
        if(!validators[i].hasOwnProperty(key)) { continue; }
        if(validators[i][key] !== page[key]) { return false; }
      };
    };
    return true;
  }

  return function weaveResolvePage(req, res, next) {
    if(!req.weave) return next(new Error('Weave not loaded.'));
    var path = req.params[param];
    var result = req.weave.navigate(path);
    if(!result || !valid(result)) return next('route');
    req.page = result;
    next();
  };
};

