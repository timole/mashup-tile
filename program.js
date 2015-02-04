var http = require('http');
var _ = require('lodash');

var port = 80;

var statusHtml = "<html><body>No data available</body></html>";

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(statusHtml);
}).listen(port, '127.0.0.1');
console.log('Server running in port ' + port);


var booksUrl = 'http://metadata.helmet-kirjasto.fi/search/author.json?query=Campbell';

console.log("Get list of books..");
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

        statusHtml = "<html><body>";
        _.map(bookList, function(d) {
            statusHtml += "<h1>" + d.displayName + "</h1>";
            statusHtml += "<p>" + d.year + "</p>";
        });

        statusHtml += "</body></html>";
    });

}).on("error", function(e) {
      console.log("Error: ", e);
});


if(typeof fi !== "undefined") {
    var fmiAPIKey = "34f130bd-6199-435f-a63b-1bc788c056fc";

    var SERVER_URL = "http://data.fmi.fi/fmi-apikey/ " + fmiAPIKey + "/wfs";
    var STORED_QUERY_OBSERVATION = "fmi::observations::weather::multipointcoverage";
    var connection = new fi.fmi.metoclient.metolib.WfsConnection();
    if (connection.connect(SERVER_URL, STORED_QUERY_OBSERVATION)) {
        // Connection was properly initialized. So, get the data.
        connection.getData({
            requestParameter : "td",
            begin : new Date(1368172800000),
            end : new Date(1368352800000),
            timestep : 60 * 60 * 1000,
            sites : "Helsinki",
            callback : function(data, errors) {
                // Handle the data and errors object in a way you choose.
                handleCallback(data, errors);
                // Disconnect because the flow has finished.
                connection.disconnect();
            }
        });
    }   
} else {
    console.log("Can not merge weather data.");
    console.log("Metolib not available, see http://en.ilmatieteenlaitos.fi/open-data-manual#article_10401_31422_667102_1.1 for details")
}
