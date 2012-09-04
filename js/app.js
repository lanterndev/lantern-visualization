CONFIG = {
  beamSpeed: 500,
  scale: 500,
  translate: [240, 300],
  zoomContraints: [1, 3],
  layers: {},
  sources: {
    countries: "data/countries.json",
    centroids: "data/centroids.csv"
  }
};

function VIS() {

  this.projection   = null;
  this.zoom         = null;

  this.geoPath      = null;

  this.centroids    = [];
  this.starts       = [];
  this.ends         = [];

  this.r            = 0;
  this.t            = .5;
  this.last         = 0;

  this.direction    = [];

  this.scale        = 1;
  this.currentScale = null;
  this.svg          = null;

}

VIS.prototype.startTimer = function() {

  var that = this;

  d3.timer(function(elapsed) {
    that.t = that.t + (elapsed - that.last) / CONFIG.beamSpeed;
    that.last = elapsed;
    that.update();
  });

}

VIS.prototype.setupProjection = function() {

  this.projection = d3.geo.mercator()
  .scale(CONFIG.scale)
  .translate(CONFIG.translate);

};

VIS.prototype.setupZoom = function() {
  var that = this;

  this.zoom = d3.behavior.zoom()
  .scaleExtent(CONFIG.zoomContraints)
  .on("zoom", function() {
    that.redraw();
  });

}

VIS.prototype.init = function() {

  this.startTimer();

  $("#canvas").on("click", function() {
    $(".radial-menu").fadeOut(200);
  });

  this.setupProjection();
  this.setupZoom();

  svg = d3.select("#canvas")
  .append("svg")
  .call(this.zoom)
  .append("g");

  this.setupFilters(svg);
  this.setupLayers();

  this.loadCountries();
};

/**
* Generates unique id
*/
VIS.prototype.GUID = function()
{
  var S4 = function () {
    return Math.floor(
      Math.random() * 0x10000 /* 65536 */
    ).toString(16);
  };

  return (
    S4() + S4() + "-" +
      S4() + "-" +
      S4() + "-" +
      S4() + "-" +
      S4() + S4() + S4()
  );
}

VIS.prototype.getCoordinates = function(coordinates) {
  return { x: coordinates[0], y: coordinates[1] };
}

/**
* Returns a random coordinate
*/
VIS.prototype.getRandomCenter = function() {
  var i = Math.round(Math.random() * (this.centroids.length - 1));
  return this.getCoordinates(this.centroids[i]);
}

/**
* Connects two points with a parabola and adds a green node
*/
VIS.prototype.connectNode = function(origin) {
  var end = this.getRandomCenter();

  this.drawParabola(origin, end, "parabola", true);
  this.addNode(end);
}

/**
* Draws n random parabolas
*/
VIS.prototype.drawParabolas = function(n) {

  var
  j    = 0
  that = this;

  _.each(that.starts.slice(0, n), function(c) {
    j++;

    var
    origin = that.getCoordinates(c),
    end    = that.getRandomCenter();

    that.drawParabola(origin, end, "parabola_light", false);

    for (i = 0; i <= Math.round(Math.random()*5); i++) {
      var randomPoint = that.getRandomCenter();
      that.drawParabola(end, randomPoint, "parabola_light", false);
      end = randomPoint;
    }

  });
}

/**
* Shows the position of the user
*/
VIS.prototype.addUser = function(center) {

  var
  layer = CONFIG.layers.nodes,
  cx    = center.x,
  cy    = center.y;

  layer
  .append("circle")
  .attr("class", "hollow")
  .attr("r", 3.7)
  .attr('cx', cx)
  .attr('cy', cy)
}

VIS.prototype.addNode = function(coordinates) {

  var
  layer = CONFIG.layers.nodes,
  that  = this;

  var // coordinates
  cx = coordinates.x,
  cy = coordinates.y;

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
    t = that.zoom.translate(),
    x = (that.zoom.scale() * cx) + t[0],
    y = (that.zoom.scale() * cy) + t[1];

    that.openCircle(x, y);

  });
}

VIS.prototype.openCircle = function(cx, cy) {

  var that = this;

  var $circle = $(".radial-menu");

  $circle.fadeOut(200, function() {

    $(this).removeClass("zoom");

    $(".arm").css("width", 0);
    $(this).find("i").css("opacity", 0);
    $(this).css({ top: cy + 20, left: cx - 40 });

    $(this).fadeIn(200, "easeInQuad", function() {
      $(this).addClass("zoom");
      that.showThumbs();
    });

  });
}

VIS.prototype.showThumbs = function() {
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

VIS.prototype.updateLines = function(scale) {

  //svg.select("#nodes")
  //.selectAll(".red_glow")
  //.attr("r", 5/scale)

  svg.select("#nodes")
  .selectAll(".hollow")
  .attr("r", 3.7/scale)
  .style("stroke-width", 1.5/scale)

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
  .selectAll(".parabola_light")
  .attr("stroke-width", 1 / scale)

  svg.select("#lines")
  .selectAll(".parabola")
  .attr("stroke-width", 1 / scale)

}

VIS.prototype.zoomIn = function(that) {

  var
  scale = that.zoom.scale(),
  t     = that.zoom.translate();

  if (scale > 2) return;

  that.zoom.scale(scale + 1);

  var
  x = -250 * (that.zoom.scale() - 1),
  y = -250 * (that.zoom.scale() - 1);

  that.zoom.translate([x, y]);

  svg
  .transition()
  .duration(500)
  .attr("transform", "translate(" + x + "," + y + ") scale(" + that.zoom.scale() + ")");

  that.updateLines(that.zoom.scale() + .2);
}

VIS.prototype.zoomOut = function(that) {
  var
  scale = that.zoom.scale(),
  t     = that.zoom.translate();

  if (scale < 1.5) return;

  that.zoom.scale(scale - 1);

  var
  x = -250 * (that.zoom.scale() - 1),
  y = -250 * (that.zoom.scale() - 1);

  that.zoom.translate([x, y]);

  svg
  .transition()
  .duration(500)
  .attr("transform", "translate(" + x + "," + y + ") scale(" + that.zoom.scale() + ")");

  that.updateLines(that.zoom.scale() + .2);
}

VIS.prototype.translateAlong = function(id, path) {
  var that = this;

  var l = path.getTotalLength();
  return function(d, i, a) {
    return function(t) {

      var p = null;

      if (that.direction[id] == 1) p = path.getPointAtLength((1 - t) * l);
      else p = path.getPointAtLength(t * l);

      return "translate(" + p.x + "," + p.y + ")";
    };
  };
}

VIS.prototype.transition = function(circle, path) {

  var that = this;

  var id = path.attr("id");

  if (!this.direction[id]) this.direction[id] = 1;

  circle
  .transition()
  .duration(800)
  .style("opacity", .25)
  .transition()
  //.duration(Math.round(Math.random(50) * 1200))
  .duration(1500)
  .delay(Math.round(Math.random(100) * 2500))
  .style("opacity", .25)
  .attrTween("transform", this.translateAlong(id, path.node()))
  .each("end", function(t) {

    circle
    .transition()
    .duration(500)
    .style("opacity", 0)
    .each("end", function() {

      that.direction[id] = -1*that.direction[id]; // changes the direction
      that.transition(circle, path);

    });

  });
}

VIS.prototype.drawParabola = function(p1, p2, c, animated) {

  var // middle point coordinates
  x = Math.abs(p1.x + p2.x) / 2;
  y = Math.min(p2.y, p1.y) - Math.abs(p2.x - p1.x) * .3;

  var
  that   = this,
  delta  = .03,
  points = [ { x: p1.x, y: p1.y}, { x: x, y: y }, { x: p2.x, y: p2.y} ],
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
  .attr("class", c)
  .attr("id", this.GUID())
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

  if (animated) {
    var circle = svg
    .select("#beams")
    .append("circle")
    .attr("class", "beam")
    .attr("filter", "url(#blur.beam)")
    .attr("r", 3);

    that.transition(circle, path);
  }

}

VIS.prototype.redraw = function() {

  $(".radial-menu").fadeOut(200, "easeOutQuad");

  scale     = d3.event.scale,
  translate = d3.event.translate;

  var t     = this.zoom.translate();

  svg
  //.transition()
  //.duration(500)
  .attr("transform", "translate(" + translate + ") scale(" + scale + ")");

  this.updateLines(scale);
}


VIS.prototype.addBlur = function(name, deviation) {
  svg
  .append("svg:defs")
  .append("svg:filter")
  .attr("id", "blur." + name)
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", deviation);
}

VIS.prototype.setupFilters = function(svg) {
  this.addBlur("light",   .7);
  this.addBlur("medium",  .7);
  this.addBlur("strong", 2.5);
  this.addBlur("beam",    .9);
  this.addBlur("node",    .35);
  this.addBlur("green",   1.9);
  this.addBlur("red",     0.5);
}

VIS.prototype.update = function() {

  this.r = this.r + .1;

  var
  p       = Math.abs(Math.sin(this.t)),
  radius  = 6 + p*4/this.scale;

  svg.select("#nodes")
  .selectAll(".green_glow")
  .attr("r", radius)
  .attr("opacity", p);
}

VIS.prototype.setupLayers = function() {

  CONFIG.layers.states  = svg.append("g").attr("id", "states");
  CONFIG.layers.points  = svg.append("g").attr("id", "my_points");
  CONFIG.layers.points2 = svg.append("g").attr("id", "my_points2");
  CONFIG.layers.lines   = svg.append("g").attr("id", "lines");
  CONFIG.layers.beams   = svg.append("g").attr("id", "beams");
  CONFIG.layers.nodes   = svg.append("g").attr("id", "nodes");

}

VIS.prototype.loadCountries = function() {
  var that = this;

  d3.json(CONFIG.sources.countries, function(collection) {

    that.geoPath = d3.geo.path().projection(that.projection)

    svg.select("#states")
    .selectAll("path")
    .data(collection.features)
    .enter().append("path")
    .attr("d", that.geoPath)
    .transition()
    .duration(700)
    .style("opacity", .3)

    that.loadCentroids();

  });
}


VIS.prototype.loadCentroids = function() {

  var that = this;

  d3.csv(CONFIG.sources.centroids, function(collection) {

    svg.select("#my_points")
    .selectAll("circle")
    .data(collection)
    .enter()
    .append("circle")
    .attr("filter", "url(#blur.light)")
    .attr("class", "glow")
    .attr('cx', function(d) { return that.projection([d.LONG, d.LAT])[0]; } )
    .attr('cy', function(d) { return that.projection([d.LONG, d.LAT])[1]; } )
    .attr("r", 3)

    svg.select("#my_points2")
    .selectAll("circle")
    .data(collection)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr('cx', function(d, i) {

      var p = Math.round(Math.random()*10);
      var coordinates = that.projection([d.LONG, d.LAT]);

      that.centroids.push(coordinates);

      if (p == 1) {
        that.starts.push(coordinates);
      } else if (p == 0) {
        that.ends.push(coordinates);
      }

      return coordinates[0];

    })
    .attr('cy', function(d, i) { return that.projection([d.LONG, d.LAT])[1]; })
    .attr("r", .6);

    // Draw some random parabolas
    that.drawParabolas(3);

    // Draw the user's circle and connect it
    var center = that.getRandomCenter();

    that.addUser(center);

    that.connectNode(center);
    that.connectNode(center);
    that.connectNode(center);

  });
}

function start() {

  var vis = new VIS();

  $(".zoom_in").on("click",  function() { vis.zoomIn(vis); });
  $(".zoom_out").on("click", function() { vis.zoomOut(vis); });

  vis.init();
}

