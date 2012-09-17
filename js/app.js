var vis = {};
var svg = null;
// Slow down animations
d3.timer.frame_function(function(callback) {
    setTimeout(callback, 48); // FPS à la Peter Jackson
});

CONFIG = {
  scale: 500,
  translate: [240, 300],
  zoomContraints: [1, 3], // min & max zoom levels
  zoomChangeSpeed: 500,
  beamSpeed: 500,
  radialMenuFadeInSpeed: 200,
  radialMenuFadeOutSpeed: 200,
  layers: {},

  censoredCountries: [ "China", "Cuba", "Iran", "Myanmar", "Syria", "Turkmenistan", "Uzbekistan", "Vietnam", "Burma", "Bahrain", "Belarus", "Saudi Arabia", "N. Korea" ],

  radialMenu: {
    delay: 100,
    speed: 100,
    initialDeg: 120,
    armWidth: 54,
    armSpeed: 250
  },

  styles: {

    // opacity
    countriesOpacity: .3,
    censoredCountriesOpacity: .45,
    censoredCountriesStrokeOpacity: .10,

    // parabolas
    parabolaLightStrokeWidth: 1,
    parabolaStrokeWidth: 1,

    // radius
    userRadiusWidth: 3.7,
    userStrokeWidth: 1.5,
    beamRadiusWidth: 3,
    nodeRadiusWidth: 2.7,
    nodeGlowRadiusWidth: 8,
    citiesRadiusWidth: .6,
    citiesGlowRadiusWidth: 2.5

  },

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

  this.parabolas    = [];

  this.r            = 0;
  this.t            = .5;
  this.last         = 0;

  this.direction    = [];

  this.scale        = 1;
  this.currentScale = null;
  this.svg          = null;

}


VIS.prototype.getLevels = function(parabola, d, t_) {
  if (arguments.length < 2) t_ = t;
  var x = [parabola.points.slice(0, d)];
  for (var i = 1; i < d; i++) {
    x.push(this.interpolate(x[x.length - 1], t_));
  }
  return x;
}

VIS.prototype.getCurve2 = function getCurve(parabola, d) {

  var curve = parabola.bezier[d];

  if (!curve) {
    curve = parabola.bezier[d] = [];
    for (var t_ = 0; t_ <= 1; t_ += parabola.delta) {
      var x = this.getLevels(parabola, d, t_);
      curve.push(x[x.length - 1][0]);
    }
  }

  return [curve.slice(0, parabola.t / parabola.delta + 1)];
}

VIS.prototype.getCurve = function(parabola, d) {
  curve = [];

  for (var t_ = 0; t_ <= 1; t_ += parabola.delta) {
    var x = this.getLevels(parabola, d, t_);
    curve.push(x[x.length - 1][0]);
  }

  return [curve];
}

VIS.prototype.interpolate = function(d, p) {
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


/*
 * Starts timer
 */
VIS.prototype.startTimer = function() {

  var that = this;

  d3.timer(function(elapsed) {
     var d = elapsed - that.last;

     that.t = that.t + (elapsed - that.last) / CONFIG.beamSpeed;
     that.last = elapsed;
     that.loop();

  });
}

/*
* Map projection setup
*/
VIS.prototype.setupProjection = function() {

  this.projection = d3.geo.mercator()
  .scale(CONFIG.scale)
  .translate(CONFIG.translate);

};

/*
* Zoom setup
*/
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

  $("#canvas").on("click", this.closeMenu);

  this.setupProjection();
  this.setupZoom();

  svg = d3.select("#canvas");
  svg.paper = svg.raphael(480,600);
  svg.sets = {},
  svg.sets['root'] = svg.paper.append('set');

  // .append("svg")
  // .call(this.zoom)
  // .append("g");

  this.setupFilters(svg);
  this.setupLayers();

  this.loadCountries();
};

/**
* Generates unique ids
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

/*
* Returns a hash with the coordinates of a point
*/
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

/*
* Connects two points with a parabola and adds a green node
*/
VIS.prototype.connectNode = function(origin) {
  var end = this.getRandomCenter();

  this.drawParabola(origin, end, "parabola", true);
  this.addNode(end);
}

/*
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

/*
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
  .attr("r", CONFIG.styles.userRadiusWidth)
  .attr('cx', cx)
  .attr('cy', cy)
  .attr('stroke', '#FF6666')
  .attr('stroke-width', 1.5);
}

/*
* Creates a node in the point define by *coordinates*
*/
VIS.prototype.addNode = function(coordinates) {

  var
  layer = CONFIG.layers.nodes,
  that  = this;

  var
  cx = coordinates.x,
  cy = coordinates.y;
  // Green glow
  layer.append("circle")
  .attr("class", "green_glow")
  .attr("fill", "#AAD092")
  .attr("fill-opacity", '.25')
  .attr("r", CONFIG.styles.nodeGlowRadiusWidth)
  .attr('cx', cx)
  .attr('cy', cy)
  .attr("filter", "url(#blur.green)")

  // Green dot
  layer.append("circle")
  .attr("r", CONFIG.styles.nodeRadiusWidth)
  .attr("class", "dot_green")
  .attr("fill", "#AAD092")
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

    that.openMenu(x, y);

  });
}

/*
* Closes radial menu
*/
VIS.prototype.closeMenu = function() {
  $(".radial-menu").fadeOut(CONFIG.radialMenuFadeOutSpeed, "easeOutQuad");
}

/*
* Opens radial menu
*/
VIS.prototype.openMenu = function(cx, cy) {

  var that = this;

  var $circle = $(".radial-menu");

  $circle.fadeOut(CONFIG.radialMenuFadeOutSpeed, function() {

    $(this).removeClass("zoom");

    $(this).find(".arm").remove();

    // Generates several random thumbnails
    var thumbCount = 3 + Math.round(Math.random() * 7);

    for (var i = 0; i <= thumbCount; i++) {
      var $arm = $("<div class='arm'><i></i></div>");
      $(this).append($arm);
    };

    $(".arm").css("width", 0);
    $(this).find("i").css("opacity", 0);
    $(this).css({ top: cy + 20, left: cx - 40 });

    $(this).fadeIn(CONFIG.radialMenuFadeInSpeed, "easeInQuad", function() {
      $(this).addClass("zoom");
      that.showThumbs();
    });

  });
}


$.fn.rotate = function(x,y) {
  // $(this).css("transform", "rotate(" + deg + "deg)");
  // $(this).find("i").css("transform", "rotate(" + -1 * deg + "deg)");
  // $(this).css("-webkit-transform", "rotate(" + deg + "deg)");
  // $(this).find("i").css("-webkit-transform", "rotate(" + -1 * deg + "deg)");
  // $(this).css("-moz-transform", "rotate(" + deg + "deg)");
  // $(this).find("i").css("-moz-transform", "rotate(" + -1 * deg + "deg)");
  // $(this).css("-o-transform", "rotate(" + deg + "deg)");
  // $(this).find("i").css("-o-transform", "rotate(" + -1 * deg + "deg)");
}

/*
* Shows the radial menu thumbs
*/
VIS.prototype.showThumbs = function() {
  var
  $circle    = $(".radial-menu"),
  i          = 0,
  delay      = CONFIG.radialMenu.delay,
  speed      = CONFIG.radialMenu.speed,
  initialDeg = CONFIG.radialMenu.initialDeg,
  n = $circle.find(".arm").length;

  var increase = Math.PI * 2 / $circle.find(".arm").length;
  var angle = 0;

  $circle.find(".arm").each(function(i, c) {
    i++;

      var // angle
      x = 40 * Math.cos( angle ) + 20,
      y = 40 * Math.sin( angle ) + 45;

      angle += increase;

      $(this).css({ width: CONFIG.radialMenu.armWidth + 'px', top: y + 'px', left: x + 'px'});
      $(c).find("i").delay(i * delay).animate({ opacity: 1 });

  });
}

/*
* Keeps the aspect of the lines & points consisten in every zoom level
*/
VIS.prototype.updateLines = function(scale) {

  svg.sets["nodes"]
  .selectAll(".hollow")
  .attr("r", CONFIG.styles.userRadiusWidth/scale)
  .style("stroke-width", CONFIG.styles.userStrokeWidth/scale)

  svg.sets["beams"]
  .selectAll("circle")
  .attr("r", CONFIG.styles.beamRadiusWidth/scale)

  svg.sets["cities"]
  .selectAll(".dot")
  .attr("r", CONFIG.styles.citiesRadiusWidth/scale)

  svg.sets["cities_glow"]
  .selectAll(".glow")
  .attr("r", CONFIG.styles.citiesGlowRadiusWidth/scale)

  svg.sets["nodes"]
  .selectAll(".green_glow")
  .attr("r", CONFIG.styles.nodeGlowRadiusWidth/scale)

  svg.sets["nodes"]
  .selectAll(".dot_green")
  .attr("r", CONFIG.styles.nodeRadiusWidth/scale)

  svg.sets["lines"]
  .selectAll(".parabola_light")
  .attr("stroke-width", CONFIG.styles.parabolaLightStrokeWidth  / scale)

  svg.sets["lines"]
  .selectAll(".parabola")
  .attr("stroke-width", CONFIG.styles.parabolaStrokeWidth / scale)
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

  // svg.paper
  // .transition()
  // .duration(CONFIG.zoomChangeSpeed)
  // .attr("transform", "translate(" + x + "," + y + ") scale(" + that.zoom.scale() + ")");

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

  svg.paper
  .transition()
  .duration(CONFIG.zoomChangeSpeed)
  .attr("transform", "translate(" + x + "," + y + ") scale(" + that.zoom.scale() + ")");

  that.updateLines(that.zoom.scale() + .2);
}

VIS.prototype.translateAlong = function(id, path) {

  var
  that    = this,
  l       = path.getTotalLength(),
  precalc = [];

   if (precalc.length == 0) {

    var N = 512;

    for(var i = 0; i < N; ++i) {

      var p = path.getPointAtLength((i/(N-1)) * l);
      precalc.push("translate(" + p.x + "," + p.y + ")");

    }
  }

  return function(d, i, a) {
    return function(t) {

      var p = null;

      if (that.direction[id] == 1) p = precalc[N - ((t*(N-1))>>0) - 1]; //path.getPointAtLength((1 - t) * l);
      else p = precalc[(t*(N-1))>>0];

      return p;
    };
  };
}

VIS.prototype.transition = function(circle, path) {

  var that = this;

  var id = path.attr("id");

  if (!this.direction[id]) this.direction[id] = 1;

  // circle
  // .transition()
  // .duration(800)
  // .style("opacity", .25)
  // // .transition()
  // .duration(1500)
  // .delay(Math.round(Math.random(100) * 2500))
  // .style("opacity", .25)
  // .attrTween("transform", this.translateAlong(id, path.node()))
  // .each("end", function(t) {

  //   // Fade out the circle after it has stopped

  //   circle
  //   .transition()
  //   .duration(500)
  //   .style("opacity", 0)
  //   .each("end", function() {

  //     that.direction[id] = -1*that.direction[id]; // changes the direction
  //     that.transition(circle, path);

  //   });

  // });
}

VIS.prototype.drawParabola = function(p1, p2, c, animated) {

  var parabola = {};

  var // middle point coordinates
  x = Math.abs(p1.x + p2.x) / 2;
  y = Math.min(p2.y, p1.y) - Math.abs(p2.x - p1.x) * .3;

  var that   = this;

  parabola.animated = animated;
  parabola.t        = .03;
  parabola.delta    = .03;
  parabola.points   = [ { x: p1.x, y: p1.y}, { x: x, y: y }, { x: p2.x, y: p2.y} ];
  parabola.line     = d3.svg.line().x(function(d) { return d.x; } ).y(function(d) { return d.y; } );
  parabola.orders   = d3.range(3, 4);
  parabola.id       = this.GUID();
  parabola.bezier   = [];
  parabola["class"]    = c;
  if (c === 'parabola_light') {
    parabola.stroke = '#FFF'
    parabola.opacity = 0.15
  } else {
    parabola.stroke = '#FFF'
    parabola.opacity = 0.7

  }

  parabola.path = svg
  .sets["lines"]
  .data(parabola.orders)
  .selectAll("path.curve")
  .data(function(d) {

    if (animated) {
      return that.getCurve2(parabola, d);
    } else {
      return that.getCurve(parabola, d);
    }

  })
  .enter()
  .append("path")
  .attr("class", parabola["class"])
  .attr("stroke", parabola["stroke"])
  .attr("opacity", parabola["opacity"])
  .attr("id", parabola.id)
  .attr("d", parabola.line)
  .attr("stroke-width", 1)

  // Store the parabola
  this.parabolas.push(parabola);

  if (animated) {
    var circle = svg
    .sets["beams"]
    .append("circle")
  //   .attr("class", "beam")
  //   .attr("filter", "url(#blur.beam)")
    .attr("r", CONFIG.styles.beamRadiusWidth);

    that.transition(circle, parabola.path);
  }
}

/*
* This method is called every time the user
* zooms or pans.
*/
VIS.prototype.redraw = function() {

  this.closeMenu();

  scale     = d3.event.scale,
  translate = d3.event.translate;

  var t     = this.zoom.translate();

  svg
  .attr("transform", "translate(" + translate + ") scale(" + scale + ")");

  this.updateLines(scale);
}

/*
* Defines a blur effect
*/
VIS.prototype.addBlur = function(name, deviation) {
  svg
  .append("svg:defs")
  .append("svg:filter")
  .attr("id", "blur." + name)
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", deviation);
}

/*
* Defines several filters
*/
VIS.prototype.setupFilters = function(svg) {
  //this.addBlur("light",   .7);
  this.addBlur("medium",  .7);
  this.addBlur("strong", 2.5);
  this.addBlur("beam",    .9);
  this.addBlur("node",    .35);
  this.addBlur("green",   1.9);
  this.addBlur("red",     0.5);
}

/*
* Main loop
*/
VIS.prototype.loop = function() {
  var that = this;

  this.r = this.r + .1;

  // Beam animation

  var
  p       = Math.abs(Math.sin(this.t)),
  radius  = 6 + p*4/this.scale;

  _.each(this.parabolas, function(parabola) {

    if (parabola.animated && parabola.t < 1) {

      parabola.t += .03;

      var curve = parabola.path
      .data(function(d) {
        return that.getCurve2(parabola, d);
      })

      curve.enter()
      .append("path")
      .attr("class", "curve");
      curve.attr("d", parabola.line);
    }

  });

  svg.sets["nodes"]
  .selectAll(".green_glow")
  .attr("r", radius)
  .attr("opacity", p);
}

VIS.prototype.setupLayers = function() {

  CONFIG.layers.states     = svg.sets['states'] = svg.paper.append('set').attr("id", "states");
  CONFIG.layers.cities     = svg.sets['cities'] = svg.paper.append('set').attr("id", "cities");
  CONFIG.layers.citiesGlow = svg.sets['cities_glow'] = svg.paper.append('set').attr("id", "cities_glow");
  CONFIG.layers.lines      = svg.sets['lines'] = svg.paper.append('set').attr("id", "lines");
  CONFIG.layers.beams      = svg.sets['beams'] = svg.paper.append('set').attr("id", "beams");
  CONFIG.layers.nodes      = svg.sets['nodes'] = svg.paper.append('set').attr("id", "nodes");

}

VIS.prototype.loadCountries = function() {
  var that = this;

  d3.json(CONFIG.sources.countries, function(collection) {

    that.geoPath = d3.geo.path().projection(that.projection)

    var st = svg.sets["states"]
    .selectAll("path")
    .data(collection.features)
    .enter().append("path");

    st
    .attr("stroke", "none")
    .attr("fill", "black")
    .attr("opacity", .3)
    .attr("d", that.geoPath)
    .transition()
    .duration(700);

    setTimeout(function() {
      st.attr("stroke", function(d) {

        if (_.include(CONFIG.censoredCountries, d.properties.name)) return "#fff";
        else return "none";

      })
      .attr("stroke-opacity", function(d) {

        if (_.include(CONFIG.censoredCountries, d.properties.name)) return CONFIG.styles.censoredCountriesStrokeOpacity;
        else return 0;

      })
      .attr("opacity", function(d) {

        if (_.include(CONFIG.censoredCountries, d.properties.name)) return CONFIG.styles.censoredCountriesOpacity;
        else return CONFIG.styles.countriesOpacity;

      })

      that.loadCentroids();

    }, 700)


  });
}

VIS.prototype.loadCentroids = function() {

  var that = this;

  d3.csv(CONFIG.sources.centroids, function(collection) {

    var a = svg.sets["cities_glow"]
    .selectAll("circle")
    .data(collection)
    .enter()
    .append("circle")
    //.attr("filter", "url(#blur.light)")
    .attr("class", "glow")
    .attr('cx', function(d) { return that.projection([d.LONG, d.LAT])[0]; } )
    .attr('cy', function(d) { return that.projection([d.LONG, d.LAT])[1]; } )
    .attr("r", CONFIG.styles.citiesGlowRadiusWidth);
    svg.sets["cities"]
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
    .attr("r", CONFIG.styles.citiesRadiusWidth);

    // Draw some random parabolas
    that.drawParabolas(3);

    // // Draw the user's circle and connect it
    var center = that.getRandomCenter();

    that.addUser(center);

     for (var i = 0; i<= 2 + Math.round(Math.random() * 3); i++) {
       that.connectNode(center);
     }

  });
}

function start() {

  vis = new VIS();

  // zoom bindings
  $(".zoom_in").on("click",  function() { vis.zoomIn(vis); });
  $(".zoom_out").on("click", function() { vis.zoomOut(vis); });

  vis.init();
}
