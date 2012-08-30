var
starts = [],
ends   = [],
zoom,
circles,
path;

function drawParabola(p1, p2) {

  var
  delta   = .003,
  points  = [{x:p1.x, y:p1.y}, {x:Math.abs(p1.x - p2.x)/2, y: Math.abs(p2.y - p1.y)/2 }, { x: p2.x, y: p2.y}],
  line    = d3.svg.line().x(function(d) { return d.x; } ).y(function(d) { return d.y; } ),
  orders  = d3.range(3, 4);

  var
  vis = d3.select("#lines")
  .selectAll("svg")
  .data(orders)
  .enter()
  .append("svg")
  .append("g");

  vis.selectAll("path.curve")
  .data(getCurve)
  .enter()
  .append("path")
  .attr("class", "curve")
  .attr("d", line)
    .attr("filter", function(d) {
      return "url(#lightBlur)";
    })

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

function addPoints() {

  d3.csv('data/centroids.csv', function(json) {

    circles = map.append("g");

    circles
    .selectAll("glow")
    .data(json)
    .enter()
    .append("circle")
    .attr("class", function(d) { return "glow"; })
    .attr("filter", function(d) {

      if (d.ISO3136 == selectedISO) return "url(#lightBlur)"
      else return "url(#strongBlur)"

    })
    .attr("fill", function(d) {
      if (d.ISO3136 == selectedISO) return "#FF6666";
      else return "#fff";
    })
    .attr('cx', function(d, i) {
      var cx = projection([d.LONG, d.LAT])[0];

      var p = Math.round(Math.random()*1);
      console.log(p);

      if (p == 0) {
        starts[d.ISO3136] = {};
        starts[d.ISO3136].x = Math.round(cx);
      } else {
        ends[d.ISO3136] = {};
        ends[d.ISO3136].x = Math.round(cx);
      }

      return cx;

    } )
    .attr('cy', function(d, i) {
      var cy = projection([d.LONG, d.LAT])[1];

      if (starts[d.ISO3136]) {
        starts[d.ISO3136].y = Math.round(cy);
      } else {
        ends[d.ISO3136].y = Math.round(cy);
      }

      return cy;

    } )
    .attr('r',  function(d, i) {
      if (d.ISO3136 == selectedISO) return 6;
      else return 5;
    })


    circles
    .selectAll("points")
    .data(json)
    .enter()
    .append("circle")
    .attr("filter", "url(#lightBlur)")
    .attr("stroke", function(d) {
      if (d.ISO3136 == selectedISO) return "#FF6666";
    })
    .attr("fill", function(d) {
      if (d.ISO3136 == selectedISO) return "none";
      else return "#FFF";
    })
    .attr('cx', function(d, i) { return projection([d.LONG, d.LAT])[0]; } )
    .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; } )
    .attr('r',  function(d, i) {
      if (d.ISO3136 == selectedISO) return 2;
      else return .5;
    })

  })

}

function generateMap(json) {

  map
  .selectAll("path")
  .data(json.features)
  .enter()
  .append("path")
  .attr("d", path)

  addPoints();
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

function move() {
  projection.translate(d3.event.translate).scale(d3.event.scale);
  map.selectAll("path").attr("d", path);
}

function start() {

  selectedISO = 'BR';

  projection = d3.geo.mercator()
  .scale(500)
  .translate([240, 300]);

  path = d3.geo.path().projection(projection);

  zoom = d3.behavior.zoom()
  .translate(projection.translate())
  .scale(projection.scale())
  //.scaleExtent([100, 8 * 100])
  .on("zoom", move);

  svg = d3.select("#canvas").append("svg")

  setupFilters(svg);

  map = svg.append("g")
  .attr("class", "map")
  .call(zoom);

  d3.json('data/countries.json', generateMap);
}

