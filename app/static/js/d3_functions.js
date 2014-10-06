
var select_paragraph = function() {

    var chart = d3.select(".chart");

    var height = 200;
    var width = 600;


    var data = [];

    chart.attr("height", height)
        .attr("width", width);


    d3.json('get_daily_metrics', function(error, json) {
        console.log('received: ', json);

        //quick reversal of our desc() ordered array:
        for (var i = json.summary.length - 1; i >= 0; i--) {
            var datum = {"value": Math.abs(+json.summary[i].balance),
                         "date": json.summary[i].date};

            data.push(datum);
        }
        console.log('data loading is complete.', data);
        ////////////////////////////////////////////////////////////////////////////////

        var barwidth = width / data.length;

        var y = d3.scale.linear()
            .domain([0, d3.max(data.value)])
            .range([height, 0]);


        var bar = chart.selectAll("g")
            .data(data.value)
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + i * barwidth + ",0)";
            });

        bar.append("rect")
            .attr("y", function(d) {return y(d.value);})
            .attr("height", function (d) {
                return height - y(d.value);
            })
            .attr("width", barwidth - 1);

        bar.append("text")
            .attr("x", barwidth / 2)
            .attr("y", function(d) {return y(d.value) + 3;})
            .attr("dy", "0.75em")
            .text(function (d) {
                return d.value;
            });

    }); //end of json loading.

        console.log('select_paragraph is finished.');

};