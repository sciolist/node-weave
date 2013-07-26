var tCase = require('t-case');
var _ = require('underscore');
var urlUtil = require('url');

module.exports = exports = Node;
function Node(data) {
  this.childNodes = data.childNodes || [];
  this.urlName = data.system.name || '';
  this.system = data.system;
  this.title = tCase.titleCase(data.system.name || '');
  _.extend(this, data.fields);
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
  if(this.hidden && !closest) return undefined;
  if(!this.parentNode || this.webRoot || this.parentNode.root) { return '/'; }
  return urlUtil.resolve(this.parentNode.url(true) || '', this.urlName);
}

Node.prototype.rootNode = function rootNode() {
  var node = this;
  while(node && node.parentNode) node = node.parentNode;
  return node;
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

