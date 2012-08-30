

  var
  w       = 350,
  h       = 200,
  delta   = .003,
  points  = [{x:0, y:0}, {x:100, y: 200 }, { x: 200, y: 0}],
  line    = d3.svg.line().x(function(d) { return d.x; } ).y(function(d) { return d.y; } ),
  orders  = d3.range(3, 4);

  var
  vis = d3.select("#chart")
  .selectAll("svg")
  .data(orders)
  .enter()
  .append("svg")
  .attr("width",  w)
  .attr("height", h)
  .append("g")

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
