
function retrieve_data(start_date, end_date) {

}



function create_chart_plot(start_date, end_date) {

    var init_height = 250;
    var init_width = $("svg").parent().width();
    //    var init_height = 200;

    var margin = {top: 10, right: 0, bottom: 20, left: 30},
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


    var data = [];
    var number_of_days = 14;
    var current_income = 30;

    var url_full = 'get_daily_metrics' + '?' + 'start_date=' + start_date + '&' + 'end_date=' + end_date;

    //actually begin loading data:
    d3.json(url_full, function (error, json) {

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

//If we want to pad lots of extra days, do it here:
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
        //in this case we want equal amts on both sides of the zero line, so
        //get our abs(max) and set each of them to that (with a but extra added on).
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
            .attr("class", "bar_rect")  //give each rect the class "bar"
            .attr("x", function (d) {return x(d.date);})  //set width to scale function of date
            .attr("y", y(0))
            .attr("height", 0)//set height to 0, then transition later
            .attr("width", x.rangeBand())  //set width to our x scale rangeband
            .attr("class", function (d) { //is this really the only way D3 can do mult classes?
                if (d.value >= 0) {
                    if (d.date == 'tomorrow') { //apparently there isn't a good way to add classes?
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


        //Animation time!
        d3.selectAll("rect").transition()
            .attr("height", function(d) {
                return Math.abs(y(0) - y(d.value))
            })
            .attr("y", function (d) {
                if (d.value >= 0) {
                    return y(d.value);
                }
                else {
                    return y(0);
                }
            })
            .duration(2000)
            .delay(200)
            .ease("elastic");

    });//end json call.

    console.log('create_chart_plot is finished.');

}


function redraw_chart(start_date, end_date) {

    console.log('redrawing chart', start_date, end_date);

    var chart = d3.select(".chart");
    var height = chart.attr("height");
    var width = chart.attr("width");

    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(function(d) {return '$' + d;});

    var xAxis_group = chart.select(".x.axis");
    var yAxis_group = chart.select(".y.axis");

    var url_full = 'get_daily_metrics' + '?' + 'start_date=' + start_date + '&' + 'end_date=' + end_date;

    var data = [];
    var number_of_days = 14;
    var current_income = 30;

    //actually begin loading data:
    d3.json(url_full, function (error, json) {
      console.log('received: ', json);

        //quick reversal of our desc() ordered array:
        for (var i = json.summary.length - 2; i >= 6; i--) {  //change to >=0 and -1
            var datum = {"value": +json.summary[i].balance, "date": json.summary[i].date.substring(0, 6)};
            data.push(datum);
            var final_value = datum.value;
            }

        //let's pad tomorrow as an extra days here:
        //commented out so that we can test change of days on front end.
//        if (new_data.length < number_of_days) {
//            datum = {"value": final_value + current_income, "date": 'tomorrow'};
//            new_data.push(datum);
//        }
        console.log('data loading is complete.');
        console.log('new data: ', data);

        x.domain(data.map(function (d) {return d.date;}));

        var max_val = function () {return d3.max(data, function (d) {return Math.abs(d.value);});};
        y.domain([-max_val() - 5 , max_val() + 5]);

        //remove/transition our old data:
//        d3.selectAll("rect").transition().duration(1000).ease("exp").attr("height", 0);
        yAxis_group.transition().duration(1000).ease("sin-in-out").call(yAxis);
        xAxis_group.transition().duration(1000).ease("sin-in-out").call(xAxis);

        //add data to chart again:
        var bars_data = chart.selectAll(".bar_group");
        var bar_data_sel = bars_data.data(data);

        bar_data_sel.enter()
            .append("g")
            .attr("class", "bar_group")
            .append("rect")//on enter, append a rect to them.
            .attr("class", "bar_rect");


        function redraw() {

        chart.selectAll(".bar_rect")
            .attr("x", function (d) {return x(d.date);})  //set width to scale function of date
            .attr("y", y(0))
            .attr("height", 0)//set height to 0, then transition later
            .attr("width", x.rangeBand())  //set width to our x scale rangeband
            .attr("class", function (d) { //is this really the only way D3 can do mult classes?
                if (d.value >= 0) {
                    if (d.date == 'tomorrow') { //apparently there isn't a good way to add classes?
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

        //Animation time!
        d3.selectAll("rect").transition()
            .attr("height", function(d) {
                return Math.abs(y(0) - y(d.value))
            })
            .attr("y", function (d) {
                if (d.value >= 0) {
                    return y(d.value);
                }
                else {
                    return y(0);
                }
            })
            .duration(2000)
            .delay(200)
            .ease("elastic");
        }


        var removal_selection_size = bar_data_sel.size();
        bar_data_sel.exit().selectAll("rect")
            .transition()
            .attr("height", 0)
            .duration(1000)
            .ease("exp")
            .each("end", function() {
                removal_selection_size --;
                if (removal_selection_size == 0){
                    bar_data_sel.exit().remove();
                    console.log("all done?");
                    redraw();
                    console.log(removal_selection_size = bar_data_sel.size());
                }
            });








    });  //end d3.json.




}
