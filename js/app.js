svg = null;

function zoomIn() {
  //svg.attr("transform", "scale(2)");
}

function zoomOut() {
  //svg.attr("transform", "scale(.5)");
}

function drawParabola(p1, p2) {

  var
  delta   = .003,
  points  = [{x:p1.x, y:p1.y}, {x:Math.abs(p1.x + p2.x)/2, y: Math.min(p2.y, p1.y)-50 }, { x: p2.x, y: p2.y}],
  line    = d3.svg.line().x(function(d) { return d.x; } ).y(function(d) { return d.y; } ),
  orders  = d3.range(3, 4);

  svg.select("#lines")
  .data(orders)
  .selectAll("path.curve")
  .data(getCurve)
  .enter()
  .append("path")
  .attr("class", "parabola")
  .attr("d", line)
  //.attr("filter", function(d) {
  //  return "url(#lightBlur)";
  //})

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

  // Strong blur
  svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "strongBlur")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", 2.5);

}

function start() {

  // The radius scale for the centroids.
  var r = d3.scale.sqrt()
  .domain([0, 1e6])
  .range([0, 10]);

  // Our projection.
  var projection = d3.geo.mercator()
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
      console.log(collection);
      svg.select("#my_points2")
      .selectAll("circle")
      .data(collection)
      .enter()
      .append("circle")
      .attr("class", "glow")
      .attr('cx', function(d, i) { return projection([d.LONG, d.LAT])[0]; })
      .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; })
      .attr("r", .2)
    });

    function getCoordinates(lat, lng) {
      var xy = projection([lat, lng]);
      return { x: xy[0], y: xy[1] };
    }

    drawParabola(getCoordinates(-73, 60), getCoordinates(3, 40));
    drawParabola(getCoordinates(-73, 40), getCoordinates(3, 40));
    drawParabola(getCoordinates(-73, 20), getCoordinates(3, 40));
    drawParabola(getCoordinates(-73, 0), getCoordinates(3, 40));
    drawParabola(getCoordinates(-73, -20), getCoordinates(3, 40));
    drawParabola(getCoordinates(-73, -40), getCoordinates(3, 40));
    drawParabola(getCoordinates(-73, -60), getCoordinates(3, 40));    


    drawParabola(getCoordinates(0, 0), getCoordinates(10,0));
    drawParabola(getCoordinates(0, 0), getCoordinates(50,0));
    drawParabola(getCoordinates(0, 0), getCoordinates(100,0));    
    drawParabola(getCoordinates(0, 0), getCoordinates(150,0));    



    //drawParabola(getCoordinates(12.5, 28.5), getCoordinates(10,45));

  });
}
