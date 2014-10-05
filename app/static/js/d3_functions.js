

var select_paragraph = function() {
    console.log('selecting paragraph');
    var chart = d3.select("#chart");
    var data = [4, 8, 15, 16, 23, 42];

    chart.selectAll("div")
        .data(data)
        .enter().append("div")
        .style("width", function(d) {return d*10 + "px"})
        .text(function(d) {return d});




    console.log('select_paragraph is finished.');

};