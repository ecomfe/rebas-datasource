/**
 * @file basic example
 */

var express = require('express');
var app = express();
var datasource = require('../index');

var HOT_FEED_URL = 'http://startupnews.duapp.com/feed/hotest';
var NEW_FEED_URL = 'http://startupnews.duapp.com/feed/newest';

// index
app.get('/', function(req, res) {

    var html = ['http', 'http/pipe', 'merge'].map(
            function(api) {
                return '<a href="/{api}">{api}</a>'.replace(/{api}/g, api);
            })
            .join('<br />');

    res.send(html);

});

// http
app.get(
    '/http',
    datasource.http(HOT_FEED_URL),
    function(req, res) {
        res.send(res.data);
    }
);

// http/pipe
app.get(
    '/http/pipe',
    datasource.http(HOT_FEED_URL, {
        pipe: true
    })
);

// http/pipeType
// app.get(
//     '/http/pipeType',
//     function() {
//         return function(req, res, next) {
//             res.type('pipe');
//             next();
//         };
//     },
//     datasource.http(HOT_FEED_URL)
// );

// merge
app.get(
    '/merge',
    datasource.merge(
        {
            hot: datasource.http(HOT_FEED_URL),
            new: datasource.http(NEW_FEED_URL)
        }
    ),
    function(req, res) {
        res.send(res.data);
    }
);

// start

var PORT = 8082;

app.listen(PORT);

// open
require('open')('http://localhost:' + PORT);
