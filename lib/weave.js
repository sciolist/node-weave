var EventEmitter = require('events').EventEmitter;
var WeaveLoader = require('./loader');
var Node = require('./node');
var Path = require('path');
var _ = require('underscore');
var fm = require('front-matter');
var watch = require('watch');
var marked = require('marked');
var handlebars = require('handlebars');

module.exports = exports = Weave;
function Weave(path, options, cb) {
  if(!(this instanceof Weave)) return new Weave(path, options, cb);
  if(!path) throw new Error('missing required value "path"');
  EventEmitter.call(this);

  var self = this;
  this.root = null;
  this.path = Path.resolve(path);
  this.options = _.defaults(options || {}, {
    loader: WeaveLoader,
    extension : '.md',
    watch : true,
  });

  _.extend(this, _.pick(this.options, 'formatBody', 'createNodes', 'createNode'));

  if(this.options.watch) {
    watch.watchTree(this.path, this.unload.bind(this));
  }
  if(cb) this.load(cb);
}

Weave.prototype = Object.create(EventEmitter.prototype);

Weave.prototype.unload = function unload() {
  if(this._root) {
    var root = this._root;
    delete this._root;
    this.emit('unload', { root: root });
  }
}

Weave.prototype.get = function get(cb) {
  var self = this;
  if(this._root) return cb(null, this._root);
  this.options.loader(this.path, this.options.extension, function (err, roots) {
    if(err) return cb(err);
    var nodes = self.createNodes(null, roots);
    var node = self._root = nodes[0];
    if(!nodes.length) return cb(new Error('no root node found'));
    node.roots = nodes;
    node._loaded(self);
    cb(null, node);
  });
}

Weave.prototype.createNodes = function createNodes(parentNode, childData) {
  var self = this;
  var children = childData || [];
  var mapped = children.map(function (n) { return self.createNode(parentNode, n) });
  var sorted = mapped.sort(function (n) { return n.ordinal });
  return sorted;
}

Weave.prototype.createNode = function createNode(parentNode, data) {
  var doc = fm(data.contents);
  data.contents = doc.attributes;
  doc.attributes.body = doc.body;
  return new Node(this, parentNode, data);
}

Weave.prototype.formatBody = function formatBody(text, opts) {
  text = marked(text, { sanitize: false });
  text = handlebars.compile(text)(opts.node);
  return text;
}

Weave.prototype.middleware = function middleware() {
  var self = this;
  return function (req, res, next) {
    self.get(function (err, root) {
      req.cms = root;
      err ? next(err) : next();
    });
  }
}

Weave.node = Weave.prototype.node = function page(param) {
  if(!param) param = 'page';
  return function (req, res, next) {
    if(!req.cms) return next(new Error('page middleware requires weave middleware'));
    var node = req.cms.navigate(req.params[param] || '');
    if(!node) return next('route');
    req.node = node;
    next();
  }
}

