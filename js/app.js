svg        = null;
projection = null;
centroids  = [];
nodes      = [];

starts = [], ends = [];

function getCoordinates(coordinates) {
  return { x: coordinates[0], y: coordinates[1] };
}

function getCoordinates_(lat, lng) {
  var xy = projection([lat, lng]);
  return { x: xy[0], y: xy[1] };
}

function zoomIn() {
  //svg.attr("transform", "scale(2)");
}

function zoomOut() {
  //svg.attr("transform", "scale(.5)");
}

function drawParabola(p1, p2) {

  var
  delta   = .05,
  points  = [{x:p1.x, y:p1.y}, {x:Math.abs(p1.x + p2.x)/2, y: Math.min(p2.y, p1.y)-Math.abs(p2.x - p1.x)*0.5 }, { x: p2.x, y: p2.y}],

  line    = d3.svg.line()
  .x(function(d) { return d.x; } )
  .y(function(d) { return d.y; } ),

  orders  = d3.range(3, 4);

  var path = svg.select("#lines")
  .data(orders)
  .selectAll("path.curve")
  .data(getCurve)
  .enter()
  .append("path")
  .attr("class", "parabola")
  .attr("d", line)

  function interpolate(d, p) {
    if (arguments.length < 2) p = t;
    var r = [];

    for (var i = 1; i < d.length; i++) {
      var d0 = d[i - 1],

      d1 = d[i];
      r.push({
        x: d0.x + (d1.x - d0.x) * p,
        y: d0.y + (d1.y - d0.y) * p
      });
    }
    return r;
  }

  function getLevels(d, t_) {
    if (arguments.length < 2) t_ = t;
    var x = [points.slice(0, d)];
    for (var i = 1; i < d; i++) {
      x.push(interpolate(x[x.length - 1], t_));
    }
    return x;
  }

  function getCurve(d) {
    curve = [];

    for (var t_ = 0; t_ <= 1; t_ += delta) {
      var x = getLevels(d, t_);
      curve.push(x[x.length - 1][0]);
    }

    return [curve];
  }

  var circle =
  svg.append("g")
  .attr("id", "my_points3")
  .append("circle")
  .attr("r", 3)
  .attr("fill", "white")
  .style("opacity", .3)
  .attr("filter", "url(#mediumBlur)");

  transition();

  function transition() {
    circle
    .transition()
    .duration(800)
    .style("opacity", .33)
    .transition()
    .duration(function(d, i)    {
      var duration = Math.round(Math.random(50) * 2500);
      return duration;
    })
    .delay(function(d, i)    {
      var delay = Math.round(Math.random(100) * 2500);
      return delay;
    })
    .style("opacity", 1)
    .attrTween("transform", translateAlong(path.node()))
    .each("end", function(t) {

      circle
      .transition()
      .duration(500)
      .style("opacity", 0)
      .each("end", transition);

    });
  }

  function translateAlong(path) {
    var l = path.getTotalLength();
    return function(d, i, a) {
      return function(t) {
        var p = path.getPointAtLength(t * l);
        return "translate(" + p.x + "," + p.y + ")";
      };
    };
  }
}

function redraw() {
  svg.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
}

function setupFilters(svg) {
  // Light blur
  svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "lightBlur")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", .7);

  // Medium blur
  svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "mediumBlur")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", 0.7);

  // Strong blur
  svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "strongBlur")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", 2.5);

  svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "nodeBlur")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", 0.35);

  // Green blur
  svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "greenBlur")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", 1.9);
}

function start() {

  // The radius scale for the centroids.
  var r = d3.scale.sqrt()
  .domain([0, 1e6])
  .range([0, 10]);

  // Our projection.
  projection = d3.geo.mercator()
  .scale(500)
  .translate([240, 300]);

  svg = d3.select("#canvas")
  .append("svg")
  .call(d3.behavior.zoom()
  .on("zoom", redraw))
  .append("g");

  setupFilters(svg);

  svg.append("g").attr("id", "states");
  svg.append("g").attr("id", "my_points");
  svg.append("g").attr("id", "my_points2");
  svg.append("g").attr("id", "lines");

  d3.json("data/countries.json", function(collection) {
    svg.select("#states")
    .selectAll("path")
    .data(collection.features)
    .enter().append("path")
    .attr("d", d3.geo.path().projection(projection));

    d3.csv("data/centroids.csv", function(collection) {
      svg.select("#my_points")
      .selectAll("circle")
      .data(collection)
      .enter()
      .append("circle")
      .attr("filter", "url(#lightBlur)")
      .attr("class", "glow")
      .attr('cx', function(d, i) {
        return projection([d.LONG, d.LAT])[0];
      })
      .attr('cy', function(d, i) {

        return projection([d.LONG, d.LAT])[1];
      })
      .attr("r", 2)
    });

    d3.csv("data/centroids.csv", function(collection) {

      centroids = collection;

      svg.select("#my_points2")
      .selectAll("circle")
      .data(collection)
      .enter()
      .append("circle")
      .attr("class", "glow")
      .attr('cx', function(d, i) {

        var p = Math.round(Math.random()*10);
        var coordinates = projection([d.LONG, d.LAT]);
        //console.log(coordinates);

        if (p == 1) {
          starts.push(coordinates);
        } else if (p == 3) {


        } else if (p == 0) {
          ends.push(coordinates);
        }

        return coordinates[0];

      })
      .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; })
      .attr("r", .2);

      _.each(starts, function(c) {
        i = Math.round(Math.random(10) * (ends.length - 1));
        drawParabola(getCoordinates(c), getCoordinates(ends[i]));
      });

      function addNode(c, j) {

        console.log(i, starts[j][0], starts[j][1]);

        c.append("circle").attr("r", 2.7)
        .attr("class", "prueba")
        .attr('cx', function(d, i) { return starts[j][0]; })
        .attr('cy', function(d, i) { return starts[j][1]; })
        .attr("filter", "url(#nodeBlur)");

        c.append("circle")
        .attr("class", "prueba_glow")
        .attr("r", 9)
        .attr('cx', function(d, i) { return starts[j][0]; })
        .attr('cy', function(d, i) { return starts[j][1]; })
        .attr("filter", "url(#greenBlur)");

      }

      var c = svg
      .append("g")
      .attr("id", "my_points4");

      addNode(c, 2);
      addNode(c, 3);
      addNode(c, 5);
      addNode(c, 13);

    });




  });
}
