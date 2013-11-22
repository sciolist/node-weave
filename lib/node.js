var _ = require('underscore');
var _s = require('underscore.string');

module.exports = exports = Node;
function Node(data) {
  if(!data.fields) data.fields = {};

  this.childNodes = _.sortBy(data.childNodes || [], function (n) { return n.ordinal; });
  if(!data.fields.title) data.fields.title = _s.humanize(data.system.name);
  if(!data.fields.urlName) data.fields.urlName = _s.dasherize(data.system.name);

  _.defaults(this, data.fields);
  this.system = data.system;
  this.fields = data.fields || {};
  if(this.hidden || this.webRoot) {
    this.urlName = '';
  }
}

Node.create = function create(weave, data, done) {
  try {
    var node = new Node(data);
    done(null, node);
  } catch(ex) {
    done(ex);
  }
}

Node.prototype.url = function url(closest) {
  if(this.hidden && !closest) return '/';
  if(!this.parentNode || this.webRoot || this.parentNode.root) { return '/'; }
  if(this.fields.url) return this.fields.url;
  var parentUrl = this.parentNode.url(true).replace(/\/+$/, '');
  return parentUrl + '/' + this.urlName;
}

Node.prototype.isParentOf = function isParentOf(other) {
  return other.parentNode === this;
}

Node.prototype.isAncestorOf = function isAncestorOf(other, orSelf) {
  if(!orSelf && other) other = other.parentNode;
  while(other) {
    if(other === this) return true;
    other = other.parentNode;
  }
  return false;
}

Node.prototype.ancestors = function ancestors(andSelf) {
  var node = this, result = [];
  if(andSelf && !node.hidden) result.push(node);
  while(node && (node = node.parentNode)) {
    if(node.hidden) continue;
    result.push(node);
  }
  return result;
}

Node.prototype.breadcrumb = function breadcrumb() {
  return this.ancestors(true).reverse();
}

