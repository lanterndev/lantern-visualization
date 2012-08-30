
//.style("opacity", function(d) { return 0; })
//.transition()
//.duration(500)
//.delay(500)
//.style("opacity", function(d) {
//return .4;
//})
//
//
//
/*
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
    //.style("opacity", function(d) {
      //return 0;
    //})
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
    //.transition()
    //.duration(750)
    //.delay(function(d, i) { return i * (5 + Math.random()*10); })
    //.style("opacity", function(d) {
      //return .1;
    //})

var count = json.length;
var j = 0;

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
        .each("end", function(i) {
        j++;
          if (j >= count ){
          console.log("Finished")
          console.log(starts, ends);

    //drawParabola(origin, destiny);
          }

        });

  })

  //setTimeout(function() {
    //drawParabola(origin, destiny);
  //}, 2000);
}
*/
