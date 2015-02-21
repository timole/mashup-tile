var utils = (function() {

  // function copied from http://stackoverflow.com/questions/10958869/jquery-get-css-properties-values-for-a-not-yet-applied-class
  var getCss = function (fromClass, prop) {
    var $inspector = $("<div>").css('display', 'none').addClass(fromClass);
    $("body").append($inspector); // add to DOM, in order to read the CSS property
    try {
        return $inspector.css(prop);
    } finally {
        $inspector.remove(); // and remove from DOM
    }
  };

  var dateToStr = function(date, short) {
    if(short) {
      return "" +date.getDate() + "." + (date.getMonth() + 1) + '.';
    }
    return "" +date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " " + (date.getHours()<10?"0":"")+date.getHours()+":"+(date.getMinutes()<10?"0":"")+date.getMinutes();
  }

  return {
    getCss: getCss,
    dateToStr: dateToStr
  };

}());


var courses = function() {
  var issues = [];
  var errorCountByDay = [];

  var socket;

  var tooltip;

  var init = function() {
    tooltip = d3.select("#viz-tooltip-container").append("div")
      .attr("class", "viz-tooltip")
      .style("opacity", 0)
      .style("padding", 10)
      .style("position", "absolute");

    initConnection();
  };

  var initConnection = function() {
    var connString = config.protocol + config.domain + ':' + config.clientport;
    console.log("Websocket connection string:", connString, config.wsclientopts);
    socket = io.connect(connString, config.wsclientopts);

    socket.on('connect', function () { 
      console.log("Websocket 'connected': ", socket);
      document.getElementById('top').innerHTML = "Connected.";
    });

    socket.on('error', function (err) {
      console.log("Websocket 'error' event:", err);
    });

    socket.on('disconnect', function () {
      console.log("Websocket 'disconnect' event");
      document.getElementById('top').innerHTML = "Disconnected.";
    });

    // Listen for server hello event
    socket.on('update-data', function (e) {
      console.log("Issued updated:", e.data);

      var updatedIssues = e.data.jiraIssues;
      _.forEach(updatedIssues, function(d) {
        d.datetime = new Date(d.datetime);
      });
      issues = updatedIssues;

      var updatedErrorCounts = e.data.errorCountByDay;
      _.forEach(updatedErrorCounts, function(d) {
        d.datetime = new Date(d.datetime);
      });

      errorCountByDay = updatedErrorCounts;

      update();
    });

  };

  var colorScale = d3.scale.category10();

  var margin = {
    top: 24,
    bottom: 24,
    left: 24,
    right: 24
  };

  var ds = 8;

  var update = function() {
    var g = d3.select(".chart");

    var width = +g.attr("width");
    var height = +g.attr("height");

    var barThickness = 1;
    var barSize = 10;

    var minDateTs = new Date('2014-08-01').valueOf(); //_.min(issues, function(d) { return d.datetime.valueOf()}).datetime;
    var maxDateTs = new Date('2014-12-06').valueOf();  //_.max(issues, function(d) { return d.datetime.valueOf()}).datetime;

    var fgColor = utils.getCss("primary", "color");

    var bgColor = function(d) {
      return colorScale(d.category);
    };

    var issueX = function(d, i) {
      return (d.datetime.valueOf() - minDateTs) / (maxDateTs - minDateTs) * (width - margin.left - margin.right) + margin.left;
    };

    var issueY = function(d, i) {
      return height - margin.bottom - barSize;
    }

    var issueBar = g.selectAll(".issue-bar")
      .data(issues, function(d) { return d.id; });

    // UPDATE existing
    issueBar
      .attr("x", issueX)
      .attr("y", issueY);

    // ENTER
    issueBar.enter()
      .append("rect")
        .attr("class", "issue-bar")
        .attr("x", issueX)
        .attr("y", issueY)
        .attr("width", barThickness)
        .attr("height", barSize)
        .style("fill", "#ff0000")
        .style("fill-opacity", 1e-6)
        .on("click", function(d) {
        })
        .on("mouseover", function(d) {
          d3.select(this).style("fill", "#0066ff");

          var txt = "<p>" +  d.datetime + "<br/>" + d.displayName + "</p>";

          tooltip.style("display", "inline-block");
          tooltip.style("opacity", "1");
          tooltip.style("background", "#eeeecc");
          tooltip.html(txt)
            .style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 80) + "px");
        })
        .on("mouseout", function(d) {
          d3.select(this).style("fill", "#ff0000");
          tooltip.style("display", "none");
        })
        .append("title")
          .text(function(d) { return d.displayName });

    issueBar.transition()
      .duration(750)
      .style("fill-opacity", 1);

    // Error count bar
    var errorCountBarX = function(d, i) {
      return (d.datetime.valueOf() - minDateTs) / (maxDateTs - minDateTs) * (width - margin.left - margin.right) + margin.left;
    };

    var errorCountBarY = function(d, i) {
      return height - margin.bottom - barSize - ds - d.count;
    }

    var errorCountBar = g.selectAll(".error-count-bar")
      .data(errorCountByDay, function(d) { return d.id; });

    errorCountBar
      .attr("x", errorCountBarX)
      .attr("y", errorCountBarY);

    // ENTER
    errorCountBar.enter()
      .append("rect")
        .attr("class", "error-count-bar")
        .attr("x", errorCountBarX)
        .attr("y", errorCountBarY)
        .attr("width", barThickness)
        .attr("height", function(d) { return d.count })
        .style("fill", "#ff0000")
        .style("fill-opacity", 1e-6)
        .on("click", function(d) {
        })
        .on("mouseover", function(d) {
          d3.select(this).style("fill", "#0066ff");
          var txt = "<p>" +  d.datetime + "<br/><b>" + d.count + " errors</b> in production environment log</p>";

          tooltip.style("display", "inline-block");
          tooltip.style("opacity", "1");
          tooltip.style("background", "#eeeecc");
          tooltip.html(txt)
            .style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 80) + "px");
        })
        .on("mouseout", function(d) {
          d3.select(this).style("fill", "#ff0000");
          tooltip.style("display", "none");
        })
        .append("title")
          .text(function(d) { return d.displayName });

    errorCountBar.transition()
      .duration(750)
      .style("fill-opacity", 1);

    var deliverDateStrings = ["2014-12-03", "2014-11-17", "2014-11-11", "2014-11-07", "2014-11-06", "2014-11-03", "2014-10-29", "2014-10-28", "2014-10-22", "2014-10-10", "2014-09-05", "2014-09-03", "2014-08-31", "2014-08-20"];
    var deliveryDates = _.map(deliverDateStrings, function(d) { return {datetime: new Date(d) } });

    // Delivery bar
    var deliveryBar = g.selectAll(".delivery-bar")
      .data(deliveryDates, function(d) { return d.datetime.valueOf(); });

    var deliveryBarX = function(d, i) {
      return (d.datetime.valueOf() - minDateTs) / (maxDateTs - minDateTs) * (width - margin.left - margin.right) + margin.left;
    };

    var deliveryBarY = function(d, i) {
      return 0;
    }

    deliveryBar
      .attr("x", deliveryBarX)
      .attr("y", deliveryBarY);

    // ENTER
    deliveryBar.enter()
      .append("rect")
        .attr("class", "delivery-bar")
        .attr("x", deliveryBarX)
        .attr("y", deliveryBarY)
        .attr("width", barThickness)
        .attr("height", 1000)
        .style("fill", "#000000")
        .style("fill-opacity", 1e-6)
        .on("click", function(d) {
        })
        .on("mouseover", function(d) {
          d3.select(this).style("fill", "#0066ff");
          var txt = "<p>" +  d.datetime + "<br/><b>Delivery</b></p>";

          tooltip.style("display", "inline-block");
          tooltip.style("opacity", "1");
          tooltip.style("background", "#eeeecc");
          tooltip.html(txt)
            .style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 80) + "px");
        })
        .on("mouseout", function(d) {
          d3.select(this).style("fill", "#000000");
          tooltip.style("display", "none");
        })
        .append("title")
          .text(function(d) { return d.displayName });

    deliveryBar.transition()
      .duration(750)
      .style("fill-opacity", 1);

    var dateTitles = [];
    var currentDateTs = minDateTs;
    while(currentDateTs < maxDateTs) {
      dateTitles.push({id: currentDateTs, datetime: new Date(currentDateTs), displayName: new Date(currentDateTs)})
      currentDateTs = currentDateTs + 86400*1000 * 7; // daylight savings errror..
    }

    var dateAxisTitle = g.selectAll("date-axis-title")
      .data(dateTitles, function(d) { return d.id });

    dateAxisTitle.enter().append("text")
      .attr("x", issueX)
      .attr("y", height - 4)
      .attr("fill", "#000000")
      .text(function(d) { return utils.dateToStr(d.datetime, true) });

  };

  return {
    init: init,
    update: update
  }

};
