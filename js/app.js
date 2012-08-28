function drawP(svg, p1, p2) {

  var
  map,
  svg,
  projection,
  p3      = { x: (p2.x - p1.x) / 2, y: 300 },
  w       = 350,
  h       = 200,
  delta   = .003,
  points  = [p1, p3, p2],
  line    = d3.svg.line().x(function(d) { return d.x; } ).y(function(d) { return d.y; } ),
  orders  = d3.range(3, 4);


  var
  vis = svg
  .data(orders)
  .enter()
  .append("svg")
  .attr("width",  w)
  .attr("height", h)
  .append("g");

  vis.selectAll("path.curve")
  .data(getCurve)
  .enter()
  .append("path")
  .attr("class", "curve")
  .attr("d", line);

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

    map
    .append("g")
    .selectAll("glow")
    .data(json)
    .enter()
    .append("circle")
    .attr("class", function(d) {
      //if (d.ISO3136 == selectedISO) return "hollow";
      //else return "glow";
      return "glow";
    })
    .style("opacity", function(d) {
      return 0;
    })
    .attr("filter", function(d) {

      if (d.ISO3136 == selectedISO) return "url(#lightBlur)"
      else return "url(#strongBlur)"

    })
    .attr("fill", function(d) {
      if (d.ISO3136 == selectedISO) return "#FF6666";
      else return "#fff";
    })
    .attr('cx', function(d, i) { return projection([d.LONG, d.LAT])[0]; } )
    .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; } )
    .attr('r',  function(d, i) {
      if (d.ISO3136 == selectedISO) return 6;
      else return 5;
    })
    .transition()
    .duration(750)
    .delay(function(d, i) { return i * (5 + Math.random()*10); })
    .style("opacity", function(d) {
      return .1;
    })

    map
    .append("g")
    .selectAll("circle")
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
    .style("opacity", function(d) { return 0; })
    .transition()
    .duration(750)
    .delay(function(d, i) { return i * (5 + Math.random()*10); })
    .style("opacity", function(d) {
      return .7;
    })
  });
}

function start() {

  selectedISO = 'BR';

  projection = d3.geo.mercator()
  .scale(500)
  .translate([240, 300]);

  svg = d3.select("#canvas").append("svg");


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

  map = svg
  .append("g").attr("class", "map");

  d3.json('data/countries.json', function(json) {
    map
    .selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .style("opacity", function(d) { return 0; })
    .attr("d", d3.geo.path().projection(projection))
    .transition()
    .duration(500)
    .delay(500)
    .style("opacity", function(d) {
      return .4;
    })

    addPoints();

  });

}
