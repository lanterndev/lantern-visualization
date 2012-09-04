CONFIG = {
  scale: 500,

  //translate: [0, 0],
  translate: [240, 300],
  zoomContraints: [1, 3],
  layers: {},
  sources: {
    countries: "data/countries.json",
    centroids: "data/centroids.csv"
  }
};

direction = [];

tx = 0;
ty = 0;

zoom = null,
scale = 1,
r = 0,
t = .5,
last = 0,
geoPath      = null,
zoom         = 1,
currentScale = null,
svg          = null,
projection   = null,
nodes        = [];

starts = [],
ends   = [];

// Draw some random parabolas
function drawParabolas(n) {

var j = 0;
  _.each(starts.slice(0, n), function(c) {
  j++;
    i = Math.round(Math.random() * (ends.length - 1));
    drawParabola(j, getCoordinates(c), getCoordinates(ends[i]));
  });

}

function addNode(j) {

  var layer = CONFIG.layers.nodes;

  var // coordinates
  cx = starts[j][0],
  cy = starts[j][1];


  // Green glow
  layer.append("circle")
  .attr("class", "green_glow")
  .attr("r", 9)
  .attr('cx', cx)
  .attr('cy', cy)
  .attr("filter", "url(#blur.green)")

  // Green dot
  layer.append("circle")
  .attr("r", 2.7)
  .attr("class", "dot_green")
  .attr('cx', cx)
  .attr('cy', cy)
  .attr("filter", "url(#blur.node)")
  .on("click", function() {
    d3.event.stopPropagation();

    // Coordinates of the click adjusted to the zoom
    // level & translation vector
    var
    t = zoom.translate(),
    x = (zoom.scale() * cx) + t[0],
    y = (zoom.scale() * cy) + t[1];

    openCircle(x, y);

  });
}

function openCircle(cx, cy) {
  var $circle = $(".radial-menu");

  $circle.fadeOut(200, function() {

    $(this).removeClass("zoom");

    $(".arm").css("width", 0);
    $(this).find("i").css("opacity", 0);
    $(this).css({ top: cy + 20, left: cx - 40 });

    $(this).fadeIn(200, "easeInQuad", function() {
      $(this).addClass("zoom");
      showThumbs();
    });

  });
}

function showThumbs() {
  var
  $circle    = $(".radial-menu"),
  i          = 0,
  delay      = 100,
  speed      = 100,
  initialDeg = 120,
  n = $circle.find(".arm").length;

  $circle.find(".arm").each(function(i, c) {
    i++;

    var deg = (i * 360 / n) - initialDeg;

    $(c).css("-webkit-transform", "rotate(" + deg + "deg)");
    $(c).find("i").css("-webkit-transform", "rotate(" + -1 * deg + "deg)");
    $(c).delay(i * delay).animate({ width: 54 }, { duration: 250, easing: "easeOutQuad" });

    $(c).find("i").delay(i * delay).animate({
      opacity: 1
    },
    { duration: speed, easing: "easeOutQuad" });

  });
}

function getCoordinates(coordinates) {
  return { x: coordinates[0], y: coordinates[1] };
}

function getCoordinates_(lat, lng) {
  var xy = projection([lat, lng]);
  return { x: xy[0], y: xy[1] };
}

function zoomIn() {

  var
  scale = zoom.scale(),
  t     = zoom.translate();

  zoom.scale(scale + .5);

  var
  x = -250 * (zoom.scale() - 1),
  y = -250 * (zoom.scale() - 1);

  console.log(x, tx);

  zoom.translate([x, y]);

  svg
  .transition()
  .duration(500)
  .attr("transform", "translate(" + x + "," + y + ") scale(" + zoom.scale() + ")");

  updateLines(zoom.scale() + .2);

}

function zoomOut() {
  zoom.scale(zoom.scale() - .1);
  svg.attr("transform", "scale(" + zoom.scale() + ")");
}

function translateAlong(id, path) {
  var l = path.getTotalLength();
  return function(d, i, a) {
    return function(t) {

      var p = null;

      if (direction[id] == 1) p = path.getPointAtLength((1 - t) * l);
      else p = path.getPointAtLength(( t) * l);

      return "translate(" + p.x + "," + p.y + ")";
    };
  };
}

function transition(id, circle, path) {

  if (!direction[id]) direction[id] = 1;

  circle
  .transition()
  .duration(800)
  .style("opacity", .25)
  .transition()
  //.duration(Math.round(Math.random(50) * 1200))
  .duration(1500)
  .delay(Math.round(Math.random(100) * 2500))
  .style("opacity", .25)
  .attrTween("transform", translateAlong(id, path.node()))
  .each("end", function(t) {

    circle
    .transition()
    .duration(500)
    .style("opacity", 0)
    .each("end", function() {

      direction[id] = -1*direction[id]; // changes the direction
      transition(id, circle, path);

    });

  });
}

function drawParabola(id, p1, p2) {

  var
  delta  = .05,
  points = [{x:p1.x, y:p1.y}, {x:Math.abs(p1.x + p2.x)/2, y: Math.min(p2.y, p1.y)-Math.abs(p2.x - p1.x)*0.5 }, { x: p2.x, y: p2.y}],

  line = d3.svg.line()
  .x(function(d) { return d.x; } )
  .y(function(d) { return d.y; } ),

  orders  = d3.range(3, 4);

  var path = svg
  .select("#lines")
  .data(orders)
  .selectAll("path.curve")
  .data(getCurve)
  .enter()
  .append("path")
  .attr("class", "parabola")
  .attr("d", line)
  .attr("stroke-width", 1)

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

  var circle = svg
  .select("#beams")
  .append("circle")
  .attr("class", "beam")
  .attr("filter", "url(#blur.beam)")
  .attr("r", 3);

  transition(id, circle, path);
}

function redraw() {

  $(".radial-menu").fadeOut(200, "easeOutQuad");

  scale     = d3.event.scale,
  translate = d3.event.translate;
  t         = zoom.translate();

  tx = t[0];
  ty = t[1];
  console.log(tx, ty);

  var r = 0;

  svg.attr("transform", "translate(" + translate + ") scale(" + scale + ")");

  updateLines(scale);
}

function updateLines(scale) {

  svg.select("#beams")
  .selectAll("circle")
  .attr("r", 3/scale)

  svg.select("#my_points2")
  .selectAll(".dot")
  .attr("r", .6/scale)

  svg.select("#my_points")
  .selectAll(".glow")
  .attr("r", 3/scale)

  svg.select("#nodes")
  .selectAll(".green_glow")
  .attr("r", 9/scale)

  svg.select("#nodes")
  .selectAll(".dot_green")
  .attr("r", 2.7/scale)

  svg.select("#lines")
  .selectAll(".parabola")
  .attr("stroke-width", 1 / scale)

}

function addBlur(name, deviation) {
  svg
  .append("svg:defs")
  .append("svg:filter")
  .attr("id", "blur." + name)
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", deviation);
}

function setupFilters(svg) {
  addBlur("light",   .7);
  addBlur("medium",  .7);
  addBlur("strong", 2.5);
  addBlur("beam",    .9);
  addBlur("node",    .35);
  addBlur("green",   1.9);
}

function update() {

  r = r + .1;

  var
  p       = Math.abs(Math.sin(t)),
  radius  = 6 + p*4/scale,
  opacity = p;

  svg.select("#nodes")
  .selectAll(".green_glow")
  .attr("r", radius)
  .attr("opacity", opacity);
}

function start() {

  //d3.timer(function(elapsed) {
    //t = (t + (elapsed - last) / 500) ;
    //last = elapsed;
    //update();
  //});

  $("#canvas").on("click", function() {
    $(".radial-menu").fadeOut(200);
  });

  // The radius scale for the centroids.
  var r = d3.scale.sqrt()
  .domain([0, 1e6])
  .range([0, 10]);

  // Our projection
  projection = d3.geo.mercator()
  .scale(CONFIG.scale)
  .translate(CONFIG.translate);

  zoom = d3.behavior.zoom().scaleExtent(CONFIG.zoomContraints).on("zoom", redraw);

  svg = d3.select("#canvas")
  .append("svg")
  .call(zoom)
  .append("g");

  setupFilters(svg);

  // Layers
  CONFIG.layers.states  = svg.append("g").attr("id", "states");
  CONFIG.layers.points  = svg.append("g").attr("id", "my_points");
  CONFIG.layers.points2 = svg.append("g").attr("id", "my_points2");
  CONFIG.layers.lines   = svg.append("g").attr("id", "lines");
  CONFIG.layers.beams   = svg.append("g").attr("id", "beams");
  CONFIG.layers.nodes   = svg.append("g").attr("id", "nodes");

  d3.json(CONFIG.sources.countries, function(collection) {

    geoPath = d3.geo.path().projection(projection)

    svg.select("#states")
    .selectAll("path")
    .data(collection.features)
    .enter().append("path")
    .attr("d", geoPath);

    d3.csv(CONFIG.sources.centroids, function(collection) {

      svg.select("#my_points")
      .selectAll("circle")
      .data(collection)
      .enter()
      .append("circle")
      .attr("filter", "url(#blur.light)")
      .attr("class", "glow")
      .attr('cx', function(d) { return projection([d.LONG, d.LAT])[0]; } )
      .attr('cy', function(d) { return projection([d.LONG, d.LAT])[1]; } )
      .attr("r", 3)

      svg.select("#my_points2")
      .selectAll("circle")
      .data(collection)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr('cx', function(d, i) {

        var p = Math.round(Math.random()*10);
        var coordinates = projection([d.LONG, d.LAT]);

        if (p == 1) {
          starts.push(coordinates);
        } else if (p == 0) {
          ends.push(coordinates);
        }

        return coordinates[0];

      })
      .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; })
      .attr("r", .6);

      drawParabolas(10);

      addNode(2);
      addNode(3);
      addNode(5);
      addNode(13);

    });
  });
}
