

var select_paragraph = function() {
    console.log('selecting paragraph');
    d3.select("#plot_area").append("p").text("hello!!");


    var data = [4, 8, 15, 16, 23, 42];

    // Set up the plot window.
    var margin = 80;
    var w = 700 - 2 * margin, h = 500 - 2 * margin;
    var svg = d3.select("#plot_area").append("svg")
                    .attr("width", w + 2 * margin)
                    .attr("height", h + 2 * margin)
                .append("svg:g")
                    .attr("transform", "translate(" + margin + ", " + margin + ")");


    console.log(svg);
    console.log('select_paragraph is finished.');

};