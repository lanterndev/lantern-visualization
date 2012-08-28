function drawP(svg, p1, p2) {

  var
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

function start() {

  var projection = d3.geo.mercator()
  .scale(500)
  .translate([240, 300]);

  var svg = d3.select("#canvas").append("svg");


  var filter = svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "blur2")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", .7);

  var filter = svg.append("svg:defs")
  .append("svg:filter")
  .attr("id", "blur")
  .append("svg:feGaussianBlur")
  .attr("stdDeviation", .9);

  var map = svg
  .append("g").attr("class", "map");

  d3.json('world-countries.json', function(json) {
    map
    .selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("d", d3.geo.path().projection(projection));

    d3.csv('centroids.csv', function(json) {

      map
      .append("g")
      .selectAll("glow")
      .data(json)
      .enter()
      .append("circle")
      .attr("class", "glow")
      .attr("filter", "url(#blur)")
      .attr("fill", function(d) {
        if (d.ISO3136 == 'BR') return "red";
        else return "#fff";
      })
      .attr('cx', function(d, i) { return projection([d.LONG, d.LAT])[0]; } )
      .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; } )
      .attr('r',  function(d, i) { return 5; })

      map
      .append("g")
      .selectAll("circle")
      .data(json)
      .enter()
      .append("circle")
      .attr("filter", "url(#blur2)")
      .attr("fill", function(d) {
        if (d.ISO3136 == 'BR') return "red";
        else return "#fff";
      })
      .attr('cx', function(d, i) { return projection([d.LONG, d.LAT])[0]; } )
      .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; } )
      .attr('r',  function(d, i) { return 1; } )
    });


  });

}
