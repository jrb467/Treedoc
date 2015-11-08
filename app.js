'use strict';

var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    config = require('./config'),
    deleteFolder = require('./delete-directory');

var app = express();

if(config.documentFormat === 'zip'){
    var DecompressZip = require('decompress-zip');
    var unzipper = new DecompressZip('./doc.zip');

    deleteFolder('./doc');

    unzipper.extract({
        path: './doc/',
    });
}

if(fs.existsSync('./doc/favicon.ico')){
    app.use(favicon(path.join(__dirname, 'doc', 'favicon.ico')));
}
app.use(logger('dev'));
app.use('/doc', express.static(path.join(__dirname, 'doc')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('*', function(req, res, next){
    res.sendFile(path.join(__dirname, 'public/template.html'));
});

// catch 404 and forward to error handler
app.use(function(err, req, res, next) {
    return res.status(404).end();
});

module.exports = app;
