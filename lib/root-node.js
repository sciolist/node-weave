module.exports = exports = RootNode;
function RootNode(weave, childData) {
  this.system = 'ROOT';
  this.title = '';
  this.urlName = undefined;
  this.hidden = true;
  this.root = true;
  this.childNodes = weave.createNodes(this, childData);
}

RootNode.prototype.navigate = function navigate(path) {
  if (!path || path === '/') return this.find('webRoot', true);
  if (path[0] !== '/') path = '/' + path;
  return this.find('url()', path);
}

RootNode.prototype.findAll = function findAll(param, value) {
  if(arguments.length === 1) {
    value = param;
    param = 'id';
  }
  return this.index(param)[value] || []
}

RootNode.prototype.find = function find(source, param, value) {
  return this.findAll(source, param, value)[0];
}

RootNode.prototype.index = function index(type) {
  if(!this._index) this._index = {};
  if(this._index && this._index[type]) return this._index[type];
  var data = this._index[type] = {};
  var fn = Function('try { return this.' + type + '; } catch(ex) { return; }');
  load(this);
  return data;

  function load(node) {
    var value = fn.call(node);
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

RootNode.prototype.url = function url() { return undefined; }
RootNode.prototype.ancestors = function ancestors() { return []; }
RootNode.prototype.breadcrumb = function breadcrumb() { return []; }

