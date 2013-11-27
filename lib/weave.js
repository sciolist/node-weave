var WeaveLoader = require('./loader');
var RootNode = require('./root-node');
var Node = require('./node');
var Path = require('path');
var _ = require('underscore');
var fm = require('front-matter');
var watch = require('watch');

module.exports = exports = Weave;
function Weave(path, options) {
  if(!(this instanceof Weave)) return new Weave(path, options);
  if(!path) throw new Error('missing required value "path"');
  var self = this;

  this.root = null;
  this.path = Path.resolve(path);
  this.options = _.defaults(options || {}, {
    extension : '.md',
    watch : true,
  });

  _.extend(this, _.pick(this.options, 'formatBody', 'createNodes', 'createNodeFromData', 'createNode'));

  if(!this.options.extension[0] === '.') {
    this.options.extension = '.' + this.options.extension;
  }

  if(this.options.watch) {
    watch.watchTree(this.path, function() { delete self._root; });
  }
}

Weave.prototype.getRoot = function getRoot(cb) {
  var self = this;
  if(this._root) return cb(null, this._root);
  WeaveLoader(this.path, this.options.extension, function (err, roots) {
    if(err) return cb(err);
    self._root = new RootNode(self, roots);
    cb(null, self._root);
  });
}

Weave.page = function page(key) {
  return function (req, res, next) {
    if(!req.weave || !req.weave.find) return next(new Error("must set req.weave to use page middleware"));
    var found = req.weave.navigate(req.params[key]);
    if(!found) return next('route');
    req.page = found;
    next();
  }
}

Weave.prototype.createNodes = function createNodes(parentNode, childData) {
  var self = this;
  return _.chain(childData||[])
    .map(function (n) { return self.createNodeFromData(parentNode, n); })
    .sortBy(function (n) { return n.ordinal; })
    .value();
}

Weave.prototype.createNodeFromData = function createFromData(parentNode, data) {
  var doc = fm(data.contents);
  data.contents = doc.attributes;
  doc.attributes.body = this.formatBody(doc.body, data);
  return this.createNode(parentNode, data);
}

Weave.prototype.formatBody = function formatBody(body, doc) {
  return require('marked')(body, { sanitize: false });
}

Weave.prototype.createNode = function create(parentNode, data) {
  return new Node(this, parentNode, data);
}

Weave.create = function create(path, options) {
  return new Weave(path, options);
}

