

var select_paragraph = function() {
    console.log('selecting paragraph');
    var chart = d3.select(".chart");
    var data = [4, 8, 15, 16, 23, 42];

    var x = d3.scale.linear()
        .domain([-43, d3.max(data)])
        .range([0, 420]);

    var data2 = [];

    d3.json('get_daily_metrics', function(error, json) {
        console.log('received: ', json);
        for (var i=0; i<json.summary.length; i++) {

            data2.push(+json.summary[i].balance);
        }

        console.log(data2);


    chart.selectAll("div")
        .data(data2)
        .enter().append("div")
        .style("width", function(d) {return x(d)+47 + "px"})
        .text(function(d) {return d});

    });









    console.log('select_paragraph is finished.');

};