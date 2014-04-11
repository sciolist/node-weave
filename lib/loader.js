var Path = require('path');
var glob = require('glob');
var fs = require('fs');

module.exports = exports = WeaveLoader;
function WeaveLoader(path, extension, cb) {
  loadData(path, extension, nest);
  function nest(err, files) {
    if(err) return cb(err);
    var grouped = {}, keys = Object.keys(files);
    for(var i=0; i<keys.length; ++i) {
      var file = files[keys[i]];
      var group = grouped[file.parentId] || (grouped[file.parentId] = []);
      group.push(file);
    }
    for(var i=0; i<keys.length; ++i) {
      var file = files[keys[i]];
      file.childData = grouped[file.id];
    }
    cb(null, grouped['.']);
  }
}

function loadData(root, extension, cb) {
  var data = {};
  glob(Path.join(root, '**/*' + extension), load);

  function add(path, bin) {
    if(path === '.' || !path) return;
    var obj = { id: path, parentId: Path.dirname(path), contents: String(bin) };
    data[obj.id] = obj;
    if(!data[obj.parentId]) {
      add(obj.parentId, '');
    }
  }

  function load(err, files) {
    if(err) return cb(err);
    (function next(i) {
      if(i >= files.length) return cb(null, data);
      var path = files[i];
      fs.readFile(path, function (err, bin) {
        if(err) return cb(err);
        add(path.slice(root.length + 1, -extension.length), bin);
        next(1 + i);
      });
    })(0)
  }
}

