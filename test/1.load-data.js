var assert = require('assert');
var weave = require('..');

var cms = weave('./cms', { watch: false });
cms.get(function (err, root) {
  if(err) throw err;

  assert.equal(42, root.testValue, 'root.testValue should be 42 (from ./cms/index.md)');
});

