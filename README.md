# Weave

Basic content handling with [front-matter](http://jekyllrb.com/docs/frontmatter/) inspired format for dynamic sites.

## Installation

```
$ npm install weave
```

## A quick example

So let's say we have a file structure like this:

```md
$ head weave/index.md weave/index/child.md 
==> weave/index.md <==
---
title: Home page
---
# Hello!

==> weave/index/child.md <==
---
title: I am a child
urlName: test
---
# Hello!
```

### To use this as a content store we can whip up some code..

```js
var weave = require('weave')({ path: './weave', watch: false });

weave.navigate('/test', function(err, page) { // skip callback to use promises
  if(err) throw err;
  console.log(page);
  /* logs:
  {
    title: 'I am a child',
    urlName: 'test',
    body: '<h1>Hello!</h1>',
    system: { path: 'index/child', name: 'child' }
    parentNode: { system: { path: 'index', name: 'index' }, ... },
    childNodes: []
  }
  */
});
```

### Weave also works well with express.

```js
var weave = require('weave');
var app = require('express')();

app.use(weave({ path: './weave' }));

app.get('/:path(?:*)?', weave.page('path'), function(req, res, next) {
  // populates req.weave and req.page
  
  res.render(req.page.template || 'index.ejs', req.page);
});
```



