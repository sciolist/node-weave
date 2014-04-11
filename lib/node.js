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
  this.setParent(parentNode);
  this.childNodes = weave.createNodes(this, data.childData);
}

Node.prototype.setParent = function setParnet(parentNode) {
  this.parentNode = parentNode;
  if(!parentNode) this.urlName = '';
  this.url = this._url();
}

Node.prototype._url = function _url(closest) {
  if(!closest && this.hidden) return undefined;
  if(this.fields.url) return this.fields.url;
  if(!this.parentNode) { return '/'; }
  var parentUrl = this.parentNode._url(true).replace(/\/+$/, '');
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

Node.prototype.children = function children(hidden) {
  if(hidden) return this.childNodes;
  return this.childNodes.filter(function (node) { return !node.hidden; });
}

Node.prototype.navigate = function navigate(path) {
  var key = this.url.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  return this.find('url', key);
}

Node.prototype.find = function find(param, value) {
  if(arguments.length === 1) {
    value = param;
    param = 'id';
  }
  return this.findAll(param, value)[0];
}

Node.prototype.findAll = function findAll(param, value) {
  if(arguments.length === 1) {
    value = param;
    param = 'id';
  }
  return this.createLookup(param)[value] || []
}

Node.prototype.createLookup = function createLookup(type) {
  if(!this._index) this._index = {};
  if(this._index && this._index[type]) return this._index[type];
  var data = this._index[type] = {};
  load(this);
  return data;

  function load(node) {
    var value = JSONPath.eval(node, type);
    if(value !== undefined) {
      value = String(value);
      if(!data[value]) data[value] = [];
      data[value].push(node);
    }
    for(var i=0; i<node.childNodes.length; ++i) {
      load(node.childNodes[i]);
    }
  }
}

