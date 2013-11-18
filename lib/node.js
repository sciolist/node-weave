var tCase = require('t-case');
var _ = require('underscore');

module.exports = exports = Node;
function Node(data) {
  this.childNodes = _.sortBy(data.childNodes || [], function (n) { return n.ordinal; });
  _.defaults(this, data.fields);
  if(!this.title) this.title = tCase.titleCase(data.system.name || '');
  if(!this.urlName) this.urlName = tCase.separatorCase(this.title || '', '-');
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

Node.prototype.ancestors = function ancestors() {
  var node = this, result = [];
  while(node && (node = node.parentNode)) {
    if(node.hidden) continue;
    result.push(node);
  }
  return result;
}

Node.prototype.breadcrumb = function breadcrumb() {
  var result = this.ancestors().reverse();
  if(!this.hidden) result.push(this);
  return result;
}

