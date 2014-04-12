var assert = require('assert');
var weave = require('..');

var cms = weave('./cms', { watch: false });
cms.get(function (err, root) {
  if(err) throw err;

  var page = root.navigate('/level2/level3');
  assert(page, 'could not find page with url /level2/level3');
});


