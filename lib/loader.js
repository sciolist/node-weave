var path = require('path');
var fs = require('fs');
var glob = require('glob');
var watch = require('watch');
var _ = require('underscore');
var Q = require('q');
var fm = require('front-matter');
var md = require('markdown').markdown;

module.exports = exports = Loader;
function Loader(weave, opts) {
  if(!(this instanceof Loader)) return new Loader(weave, opts);
  if(!weave) throw new Error("loader requires access to weave.");
  if(!opts || !opts.path) throw new Error("path argument must be supplied.");

  var self = this;
  this.weave = weave;
  this.path = path.normalize(opts.path);
  this.typeMap = opts.typeMap;
};

Loader.create = function(weave, opts) {
  var loader = new Loader(weave, opts);
  return loader.load.bind(loader);
}

var strat = Loader.prototype;

strat.startWatching = function() {
  watch.watchTree(this.path, function(f, curr, prev) {
    self._cached = null;
  });
}

strat.load = function load() {
  if(this._cached) {
    return Q.resolve(this._cached);
  }
  return this.reload();
};

strat.reload = function reload() {
  var self = this;
  delete this._cached;
  return Q.resolve(this.path)
   .then(findFiles)
   .then(loadFiles.bind(this, this.path))
   .then(initNodes.bind(this, this.weave))
   .then(function(v) { return self._cached = v; });
};

function findFiles(basePath) {
  var def = Q.defer();
  glob(path.join(basePath, '**/*.md'), function(err, files) {
    if(err) def.reject(err);
    else def.resolve(files);
  });
  return def.promise;
}


function loadFiles(dir, files) {
  return Q.all(files.map(function(filePath) {
    return readFile()
      .then(parseData)
      .then(createNode);

    function readFile() {
      var def = Q.defer();
      fs.readFile(filePath, function(err, data) {
        if(err) def.reject(err);
        else def.resolve(data.toString());
      });
      return def.promise;
    }

    function parseData(data) {
      var data = fm(data);
      data.attributes.body = md.toHTML(data.body);
      return data.attributes;
    }

    function createNode(data) {
      var system = {};
      system.path = filePath.substr(dir.length + 1).replace(/\.md$/i, '');
      system.name = path.basename(filePath, '.md');
      return { system: system, fields: data, childData: {} };
    }
  }));
}


function initNodes(weave, nodes) {
  var sorted = _.sortBy(nodes, function(n) { return n.system.path; });
  var root = emptyNode();
  return Q.all(sorted.map(addChild)).then(init);
  
  function emptyNode() {
    return { childData: {}, placeholder: true };
  }

  function addChild(node) {
    return Q.fcall(function() {
      var parts = node.system.path.split('/'), at = root;
      parts.forEach(function(name, i) {
        var isLast = parts.length - 1 === i;
        var exists = !!at.childData[name];
        if (exists) at = at.childData[name];
        else if(isLast) at = at.childData[name] = node;
        else at.childData[name] = emptyNode();
      });
      return true;
    });
  }

  function init() {
    return initNode(_.toArray(root.childData)[0]);
  }

  function initNode(node) {
    if(node === null) return null;
    var children = Q.all(_.map(node.childData, initNode));
    return children.then(function(nodes) {
      node.childNodes = nodes;
      var item = weave.create(node);
      nodes.forEach(function(n) { n.parentNode = item; });
      return item;
    });
  }
}

