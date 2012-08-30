function addPoints() {

  d3.csv('data/centroids.csv', function(json) {

    circles = map.append("g");

    circles
    .selectAll()
    .data(json)
    .enter()
    .append("circle")
    .attr("class", function(d) { return "glow"; })
    .attr('cx',   function(d)  { return projection([d.LONG, d.LAT])[0]; })
    .attr('cy',   function(d)  { return projection([d.LONG, d.LAT])[1]; })
    .attr('r', 5)


    circles
    .selectAll()
    .data(json)
    .enter()
    .append("circle")
    .attr('cx', function(d, i) { return projection([d.LONG, d.LAT])[0]; } )
    .attr('cy', function(d, i) { return projection([d.LONG, d.LAT])[1]; } )
    .attr('r',  1);
  });

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

function move() {
  projection.translate(d3.event.translate).scale(d3.event.scale);
  map.selectAll("path").attr("d", path);
}

function start() {

  var w = 500;

  projection = d3.geo.mercator()
  .scale(w)
  .translate([240, 300]);

  path = d3.geo.path().projection(projection);

  zoom = d3.behavior.zoom()
  .translate(projection.translate())
  .scale(projection.scale())
  .on("zoom", move);

  svg = d3
  .select("#canvas")
  .append("svg")

  map = svg.append("g")
  .attr("class", "map")
  .call(zoom);

  d3.json('data/countries.json', generateMap);
}

