var EventEmitter = require('events').EventEmitter;
var WeaveLoader = require('./loader');
var Node = require('./node');
var Path = require('path');
var _ = require('underscore');
var fm = require('front-matter');
var watch = require('watch');

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

Weave.prototype.middleware = function middleware() {
  var self = this;
  return function (req, res, next) {
    self.get(function (err, root) {
      req.cms = root;
      err ? next(err) : next();
    });
  }
}

Weave.prototype.get = function get(cb) {
  var self = this;
  if(this._root) return cb(null, this._root);
  this.options.loader(this.path, this.options.extension, function (err, roots) {
    if(err) return cb(err);
    var nodes = self.createNodes(null, roots);
    self._root = nodes[0];
    self._root.roots = nodes;
    cb(null, self._root);
  });
}

Weave.prototype.createNodes = function createNodes(parentNode, childData) {
  var self = this;
  return _.chain(childData||[])
    .map(function (n) { return self.createNode(parentNode, n); })
    .sortBy(function (n) { return n.ordinal; })
    .value();
}

Weave.prototype.createNode = function createFromData(parentNode, data) {
  var doc = fm(data.contents);
  data.contents = doc.attributes;
  doc.attributes.body = this.formatBody(doc.body, data);
  return new Node(this, parentNode, data);
}

Weave.prototype.formatBody = function formatBody(body, doc) {
  return require('marked')(body, { sanitize: false });
}

