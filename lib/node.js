var _ = require('underscore');
var _s = require('underscore.string');
var JSONPath = require('JSONPath');
var Path = require('path');

module.exports = exports = Node;
function Node(weave, parentNode, data) {
  var attrib = data.contents;
  if(!attrib.title) attrib.title = _s.humanize(Path.basename(data.id));
  if(!attrib.urlName) attrib.urlName = _s.dasherize(Path.basename(data.id));

  this.system = _.pick(data, 'id', 'parentId');
  this.fields = attrib || {};
  _.defaults(this, attrib);
  this.parentNode = parentNode;
  if(!parentNode) this.urlName = '';
  this.url = createUrl(this, false);
  this.childNodes = weave.createNodes(this, data.childData);
}

function createUrl(node, closest) {
  if(!closest && node.hidden) return undefined;
  if(node.fields.url) return this.fields.url;
  if(!node.parentNode) { return '/'; }
  var parentUrl = createUrl(node.parentNode, true).replace(/\/+$/, '');
  return parentUrl + '/' + node.urlName;
}

Node.prototype._loaded = function _loaded(weave) {
  if(weave.formatBody) this.body = weave.formatBody(this.body, { node: this });
  for(var i=0; i<this.childNodes.length; ++i) {
    this.childNodes[i]._loaded(weave);
  }
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

Node.prototype.children = function children(hidden) {
  if(hidden) return this.childNodes;
  return this.childNodes.filter(function (node) { return !node.hidden; });
}

Node.prototype.navigate = function navigate(path) {
  var key = this.url.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  return this.find('url', key);
}

Node.prototype.root = function root() {
  var root = this;
  while(root.parentNode) root = root.parentNode;
  return root;
}

Node.prototype.find = function find(param, value) {
  if(arguments.length === 1) {
    value = param;
    param = 'id';
  }
  return this.findAll(param, value)[0];
}

Node.prototype.findAll = function findAll(param, value) {
  if(!this._index) this._index = {};

  if(!this._index[param]) {
    load(this, this._index[param] = {});
  }

  if(arguments.length === 1) return this._index[param];
  return this._index[param][value] || [];

  function load(node, data) {
    var value = JSONPath.eval(node, param);
    if(value !== undefined) {
      value = String(value);
      if(!data[value]) data[value] = [];
      data[value].push(node);
    }
    for(var i=0; i<node.childNodes.length; ++i) {
      load(node.childNodes[i], data);
    }
  }
}

