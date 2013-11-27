var _ = require('underscore');
var _s = require('underscore.string');
var Path = require('path');

module.exports = exports = Node;
function Node(weave, parentNode, data) {
  var attrib = data.contents;
  if(!attrib.title) attrib.title = _s.humanize(Path.basename(data.id));
  if(!attrib.urlName) attrib.urlName = _s.dasherize(Path.basename(data.id));

  this.system = _.pick(data, 'id', 'parentId');
  this.parentNode = parentNode;
  this.fields = attrib || {};
  if(this.hidden || this.webRoot || this.parentNode.root) {
    this.urlName = '';
  }
  _.defaults(this, attrib);
  this.childNodes = weave.createNodes(this, data.childData);
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

