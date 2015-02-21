// read the configuration. See config.js for details.
var config = require('./config');

// static content and routing
var express = require('express');
var app = require('express')();
var http = require('http');
var fs = require('fs');
var server = http.Server(app);
var _ = require('lodash');
var parse = require('csv-parse');

var initData = function(callback) {
  var jiraIssues;
  var errorCountByDay;

  var doCallbackIfLoaded = function() {
    if(jiraIssues && errorCountByDay) {
      callback(jiraIssues, errorCountByDay);
    }
  };

  fs.readFile('data/jira.csv', function (err, data) {
    parse(data, {delimiter: ';', columns: true, quote: false}, function(err, output) {
      jiraIssues = output;
      _.each(jiraIssues, function(d) { d.displayName = d.id + ' ' + d.title + ' (' + d.category + ')' });
      doCallbackIfLoaded();
    });
  });

  fs.readFile('data/error-count-by-day.csv', function (err, data) {
    parse(data, {delimiter: ';', columns: true, quote: false}, function(err, output) {
      errorCountByDay = output;
      _.each(errorCountByDay, function(d) { d.id = new Date(d.datetime).valueOf() } );
      doCallbackIfLoaded();
    });
  });

};

initData(function(jiraIssues, errorCountByDay) {
  app.use(express.static(__dirname + '/'));

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/api/config', function(req, res) {
    res.send('var config = ' + JSON.stringify(config));
  });

  // Web socket
  var io = require('socket.io')(server);
  var socket;

  console.log("Trying to start server with config:", config.serverip + ":" + config.serverport);
  server.listen(config.serverport, config.serverip, function() {
    console.log("Server running @ http://" + config.serverip + ":" + config.serverport);
  });

  // when the client connects, update data for the first time
  io.on('connection', function (sckt) {
    socket = sckt;
    updateData();
  });

  var updateData = function() {
    socket.emit('update-data', { data: { jiraIssues: jiraIssues, errorCountByDay: errorCountByDay }});
  };

});
