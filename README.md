# Weave

Basic content handling with [front-matter](http://jekyllrb.com/docs/frontmatter/) inspired format for dynamic sites.

## Installation

    $ npm install weave

## Directory structure

Weave uses the file system as it's data source, using markdown files:

    $ find **/*.md
    cms/index/child-page.md
    cms/index.md

Loading this directory with weave will create a basic content structure.

The file contents are inspired by jekyll, and should look something like this:

    ----
    urlName: child-page # a name to display in the url (defaults to file name)
    ordinal: 1          # default sort order (default 0)
    hidden: true        # hide the node from the url, and from child lists (optional)

    view: index         # any values can be added to be used by your application
    mustache: furry
    ----
    # Content can be added here, as well as some {{mustache}} to show content.
    Passing the `formatBody` option allows you to replace markdown if wanted.

When loaded you'll get an object structure with your values:

    {
      "urlName": "child-page",
      "title": "Child page",
      "url": "/child-page",
      "ordinal": 1,
      "hidden": true,
      "view": "index",
      "mustache": "furry",
      "body": "<h1>Content can be added here [...]",
      "parentNode": {...},
      "children": [function],
      "find": [function]
    }

## Basic usage

In an express-application you can drop in the middleware to get going:

    ==> /index.js <==
    var express = require('express');
    var weave = require('weave');

    var cms = weave('./path/to/data');
    var app = express(cms.middleware());

    // handle all urls
    app.get('*', function (req, res, next) {
      // attempt to get a node matching the requested url
      var node = req.cms.navigate(req.params[0]);

      // continue if no node was found
      if(!node) { return next(); }

      // otherwise render a view
      res.render(node.view || 'index', { node: node });
    });

    app.listen(8080);
# 
    ==> /views/index.ejs <==
    <h1><%= node.title %></h1>
    <%- node.body %>

If you're not a fan, you can just as easily use weave on its own:

    var weave = require('weave');
    var app = weave('./path/to/data');
    app.get(function (err, cms) {
      if(err) throw err;
      var child = cms.navigate('/child-page');
      console.log(child.body);
    });

## [Look around you](https://www.youtube.com/watch?v=n2k9JwGpm1w)

Weave has support for looking up nodes [using JSONPath.](https://github.com/s3u/JSONPath)

You can use these lookups to find a node based on your own identifiers:

    var node = cms.find('isbn', '0977507076');

Or something as exciting as a list of footer links:

    <% cms.findAll('showInFooter', true).forEach(function (node) { %>
      <a href="<%= node.url() %>"><%= node.title %></a>
    <% }); %>

There are also a few helpful functions surrounding the lookups:

    // finds nodes by their url.
    var node = cms.navigate('/child/node');

    // list all the nodes children.
    node.children();

    // list of all the nodes parents.
    node.breadcrumb();

    // the nodes direct parent can be retrieved with parentNode
    var parent = node.parentNode;

    // you can also test to see if a node is anothers direct parent
    parent.isParentOf(node);

    // or if the node is in the ancestor list of another node
    parent.isAncestorOf(node);

And possibly one or two other things that I can't think of right now!

