
function get_parse_data(chart, xAxis, yAxis, x, y, height) {

    var data = [];
    var number_of_days = 14;
    var current_income = 30;

    //actually begin loading data:
    d3.json('get_daily_metrics', function (error, json) {
        console.log('received: ', json);

        //quick reversal of our desc() ordered array:
        for (var i = json.summary.length - 1; i >= 0; i--) {
            var datum = {
//                "value": Math.abs(+json.summary[i].balance),
                "value": +json.summary[i].balance,
                "date": json.summary[i].date.substring(0, 6)};

            data.push(datum);

            var final_value = datum.value;
        }

        //let's pad tomorrow as an extra days here:
        if (data.length < number_of_days) {
            datum = {"value": final_value + current_income,
                "date": 'tomorrow'};
            data.push(datum);
        }
//
//        var j = 0;
//        while (data.length < number_of_days) {
//            datum = {"value":.5,
//                         "date": 'f'+j};
//            data.push(datum);
//            i++;
//        }

        console.log('data loading is complete.');
        console.log(data);
        console.log(data.length);
        ////////////////////////////////////////////////////////////////////////////////

//        var barwidth = width / data.length;

        //apply our data domain to our x scale:
        x.domain(data.map(function (d) {
            return d.date;
        }));

        var max_val = function () {
            return d3.max(data, function (d) {
                return Math.abs(d.value);
            });
        };

        //apply our data domain of values to the y range:
        y.domain([-max_val() - 5 , max_val() + 5]);


        //with our original chart object, append a new group element.
        //call it x axis and transform to x=0, y=height (bottom)
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        //append another group element, called y axis, and call it:
        chart.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        //select all "bars" (even though they don't exist yet)
        chart.selectAll(".bar")
            .data(data)  //join our data on to our bars
            .enter()
            .append("g")
            .attr("class", "bar_group")
            .append("rect")//on enter, append a rect to them.
            .attr("class", "bar")  //give each rect the class "bar
            .attr("x", function (d) {
                return x(d.date);
            })  //set width to scale function of date
            .attr("y", function (d) {
                if (d.value >= 0) {
                    return y(d.value);
                }
                else {
                    return y(0)
                }
            })  //set y to scale of it's value
            .attr("height", function (d) {

                if (d.value >= 0) {
                    return y(0) - y(d.value);
                }

                else {
                    return y(d.value) - y(0);
                }

            })  //set height to scaled value
            .attr("width", x.rangeBand())  //set width to our x scale rangeband
            .attr("class", function (d) { //is this really the only way D3 can do mult classes?

                if (d.value >= 0) {
                    if (d.date == 'tomorrow') {
                        return "positive_bar bar_future"
                    }
                    else {
                        return "positive_bar";
                    }
                }
                else {
                    if (d.date == 'tomorrow') {
                        return "negative_bar bar_future"
                    }
                    else {
                        return "negative_bar";
                    }
                }
            });

//            .transition.delay().duration(30).attr("height", 0);


        //select all bars and add a text element to them
        chart.selectAll(".bar_group")
            .append("text")
            .attr("x", function (d) {
                return x(d.date) + (x.rangeBand() / 2)
            })
            .attr("y", function (d) {

                if (d.value >= 0) {
                    return y(d.value) + 3;
                }
                else {
                    return y(d.value) - 12;
                }
            })
            .attr("dy", "0.75em")
            .text(function (d) {
                return d.value;
            });


    }); //end json call.

} //end function.




var create_chart_plot = function() {

    var init_vals = init_chart_area();

    get_parse_data(init_vals.chart, init_vals.xAxis, init_vals.yAxis,
        init_vals.x, init_vals.y, init_vals.height);

    console.log('create_chart_plot is finished.');
};


function init_chart_area() {
    var init_width = $("svg").parent().width();
    var init_height = 500;


    var margin = {top: 20, right: 0, bottom: 30, left: 30},
        width = init_width - margin.left - margin.right,
        height = init_height - margin.top - margin.bottom;


    //create our initial chart space, append a group to it, transform to size:
    var chart = d3.select(".chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    //set our x function as an ordinal scale using range
    var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1);

    //set our y function as a linear range between 0 and height.
    var y = d3.scale.linear()
            .range([height, 0]);

    //create xAxis object based on our x scale
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    //create yAxis based on our y scale:
    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(function(d) {return '$' + d;});

    return {"chart": chart, "xAxis": xAxis, "yAxis": yAxis, "x": x, "y": y, "height": height};


}