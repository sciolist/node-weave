var path = require('path');
var _ = require('underscore');
var Q = require('q');

module.exports = exports = Node;
function Node(weave, data) {
  if(!(this instanceof Node)) return new Node(weave, data);
  this.childNodes = data.childNodes || [];
  _.extend(this, {
    urlName: data.system.name || '',
    system: data.system
  }, data.fields);
}

Node.prototype.navigate = function navigate(path, cb) {
  var self = this;
  if(!Array.isArray(path)) {
    path = path.replace(/^[\s\/]+|[\s\/]+$/g, '');
    path = path.length ? path.split('/') : [];
  }
  if(path.length == 0) {
    return Q.resolve(this).nodeify(cb);
  }

  return Q.resolve(path[0])
   .then(findNode)
   .then(next)
   .nodeify(cb);

  function findNode(value) {
    for(var i=0; i<self.childNodes.length; ++i) {
      if (self.childNodes[i].urlName !== value) continue;
      return self.childNodes[i];
    }
  }

  function next(node) {
    if(!node) return null;
    var def = Q.defer();
    node.navigate(path.slice(1), function(err, result) {
      if(err) def.reject(err);
      else def.resolve(result);
    });
    return def.promise;
  }
}

Node.prototype.fullUrl = function fullUrl() {
  if(!this.parentNode) return "/";
  return path.join(this.parentNode.url(), this.urlName);
}

Node.prototype.rootNode = function rootNode() {
  var node = this;
  while(node && node.parentNode) node = node.parentNode;
  return node;
}


