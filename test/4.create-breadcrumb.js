var assert = require('assert');
var weave = require('..');
var _ = require('underscore');

var cms = weave('./cms', { watch: false });
cms.get(function (err, root) {
  if(err) throw err;

  var deep = root.find('level', 3);
  var str = deep.breadcrumb(true).map(function (n) { return n.title }).join('|');
  assert.equal(str, 'Index|Level2|Level3');
});

