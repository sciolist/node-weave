var Path = require('path');
var glob = require('glob');
var fs = require('fs');

module.exports = exports = WeaveLoader;
function WeaveLoader(path, extension, cb) {
  loadData(path, extension, nest);
  function nest(err, files) {
    if(err) return cb(err);
    var grouped = [];
    for(var i=0; i<files.length; ++i) {
      var group = grouped[files[i].parentId] || (grouped[files[i].parentId] = []);
      group.push(files[i]);
    }
    for(var i=0; i<files.length; ++i) {
      files[i].childData = grouped[files[i].id];
    }
    cb(null, grouped['.']);
  }
}

function loadData(root, extension, cb) {
  var data = [];
  glob(Path.join(root, '**/*' + extension), load);

  function add(path, bin) {
    data.push({
      id: path.slice(root.length + 1, -extension.length),
      parentId: Path.dirname(path.slice(root.length + 1, -extension.length)),
      contents: String(bin),
      path: path,
    });
  }

  function load(err, files) {
    if(err) return cb(err);
    (function next(i) {
      if(i >= files.length) return cb(null, data);
      var path = files[i];
      fs.readFile(path, function (err, bin) {
        if(err) return cb(err);
        add(path, bin);
        next(1 + i);
      });
    })(0)
  }
}

