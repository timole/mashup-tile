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

  fs.readFile('data/jira.csv', function (err, data) {
    parse(data, {delimiter: ';', columns: true, quote: false}, function(err, output){
      jiraIssues = output;
      callback(jiraIssues);
    });
  });
};

initData(function(jiraIssues) {
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
        debugger;
    socket = sckt;
    updateData();
  });

  var genereateCourseName = function() {
    var first = ['JavaScript', 'Python', 'Java', 'Business Intelligence', 'Ruby', 'User Experience', '.NET', 'Software Architecture'];
    var second = ['for Dummies', 'for Beginners', 'Advanced'];
    return first[Math.floor(Math.random() * first.length)] + ' ' + second[Math.floor(Math.random() * second.length)];
  }

  var updateData = function() {
    var id = Math.round(Math.random() * 1000000);
    var displayName = genereateCourseName();

    var course = {
      id: id,
      category: displayName.split(' ')[0],
      displayName: displayName,
      participants: Math.round(Math.random() * 150)
    };

    var booksUrl = 'http://metadata.helmet-kirjasto.fi/search/title.json?query=' + course.category;
    console.log(booksUrl);
    
    http.get(booksUrl, function(res) {
        var body = "";
        res.on("data", function(chunk) {
            body += chunk;
        });

        res.on("end", function() {
            var bookList = _.map(JSON.parse(body).records, function(d) {
                return {
                    displayName: d.title,
                    year: d.year
                };
            });
            console.log("Got list of books:", bookList);

            course.books = bookList;

            socket.emit('course-update', { data: course });

        });
    }).on("error", function(e) {
          console.log("Error: ", e);
    });

    // Wait for 3 seconds. And then update the data again.
    setTimeout(updateData, 3000);

  }

});
