var test = require('tap').test;
var weave = require('../lib/weave');
var Node = require('../lib/node');

test('can change construction method', function(t) {
  function create(data) {
    data.fields.custom = true;
    return new Node(this, data);
  }

  var inst = weave({ create: create, loader: dummyLoader });
  inst.navigate('/', function(err, value) {
    if(err) throw err;
    t.ok(value.custom, 'custom field should be set.');
    t.end();
  });
})

test('can create an index', function(t) {
  var inst = weave({ loader: dummyLoader });

  inst.index('testing').find('a', function (err, value) {
    if(err) throw err;
    t.equal(value && value.urlName, 'child', 'could find correct node.');
    t.end();
  });
});

test('can find child nodes', function(t) {
  var inst = weave({ loader: dummyLoader });
  inst.navigate('/child', function(err, value) { 
    if(err) throw err;
    t.ok(!!value, 'should find child nodes.');
    t.end();
  });
});

function dummyLoader(weave, opts) {
  return function() {
    return weave.create({
      system: { name: 'root' },
      fields: { body: 'Hello' },
      childNodes: [
        weave.create({ system: { name: 'child' }, fields: { testing: 'a' } })
      ]
    });
  };
}

