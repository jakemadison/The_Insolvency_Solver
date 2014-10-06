
var select_paragraph = function() {

    var chart = d3.select(".chart");
    var data = [4, 8, 15, 16, 23, 42];

    var width = 420;
    var barheight = 20;

    var data2 = [];

    chart.attr("width", width);


    d3.json('get_daily_metrics', function(error, json) {
        console.log('received: ', json);

        //quick reversal of our desc() ordered array:
        for (var i = json.summary.length - 1; i >= 0; i--) {
            data2.push(Math.abs(+json.summary[i].balance));
        }
        console.log('data loading is complete.', data2);

        var x = d3.scale.linear()
            .domain([0, d3.max(data2)])
            .range([0, width]);

        chart.attr("height", barheight * data2.length);

        var bar = chart.selectAll("g")
            .data(data2)
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(0," + i * barheight + ")";
            });

        bar.append("rect")
            .attr("width", function (d) {
                return x(d);
            })
            .attr("height", barheight - 1);

        bar.append("text")
            .attr("x", function (d) {
                return d - 3;
            })
            .attr("y", barheight / 2)
            .attr("dy", "0.35em")
            .text(function (d) {
                return d;
            });

    }); //end of json loading.

        console.log('select_paragraph is finished.');

};