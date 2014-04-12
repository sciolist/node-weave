var assert = require('assert');
var weave = require('..');

var cms = weave('./cms', { watch: false });
cms.get(function (err, root) {
  if(err) throw err;

  var foundNode = root.find('testValue', '42');
  var foundNodes = root.findAll('testValue', '42');
  assert.equal(foundNodes.length, 1, 'there should be a single node with property testValue == 42');
  assert.equal(foundNodes[0], foundNode, 'nodes found through find and findAll should be equal');
  assert.equal(foundNode.testValue, 42, 'result should have testValue == 42');
});

