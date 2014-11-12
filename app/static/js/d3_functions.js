
function get_filter_list() {

        var filter_list = [];
        $(".filter_options").each(function() {
            if ($(this).prop("checked")) {
                filter_list.push($(this).val());
            }
        });
        console.log("filter list: ", filter_list);

        return filter_list;
    }


var global_data;

function load_data(reload) {

    var filters = get_filter_list();
    console.log("loading data now");

    var url_full = 'get_spending_data' + '?' + 'filters=' + filters;

        //gets data and fires a "newData" event:
        d3.json(url_full, function (error, json) {

            console.log("retrieving data from server");

            console.log("i received: ", json);

            global_data = json;

            var event = new CustomEvent(
                "newData",
                {
                    detail: {
                        transition_chart: reload || false,
                        change_chart_type: false
                    },
                    bubbles: true,
                    cancelable: true
                }
            );
            document.dispatchEvent(event);
        }); //end of json request.



    //listeners:
}


function create_transaction_plot(t_indicator, plot_style) {

    var current_chart_type;

    function draw_calendar() {
        console.log("calendar is a go!");
    }
    console.log("transaction plot!");

    var json_data = [];  //what the server originally sent us
    var data = [];  //data that is parsed for
    // daily metrics calculations, includes daily amounts (-N -> N)
    var transaction_data = [];  //data that is parsed for transactions/day (0 -> N)

    //
    //init all of our starting vars:
    //////////////////////////////////////////////
    var init_height = 400;
    var init_width = $("svg").parent().width();

    var margin = {top: 10, right: 10, bottom: 30, left: 30},
        width = init_width - margin.left - margin.right,
        height = init_height - margin.top - margin.bottom;

    //create our initial chart space, append a group to it, transform to size:
    var chart = d3.select(".chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
//        .attr("width", width)
//        .attr("height", height)
        .append("g").attr("class", "chart_area")
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


    var number_of_days = 14;
    var current_income = 30;

    //get the list of currently active filters
    var ret_filters = get_filter_list();


    if (t_indicator) {
        d3.select(".y.axis").remove();
        d3.select(".x.axis").remove();
        clear_chart();
    }


    var max_val = function () {
            return d3.max(data, function (d) {
                return Math.abs(d.balance);
//
//                return d.balance;

            });
        };


    //starting to group common chart operations here....

    function draw_chart() {

        console.log('draw_chart is active');
        console.log('data', data);

        //apply our data domain to our x scale:
        x.domain(data.map(function (d) {
            return d.day;
        }));

        //apply our data domain of values to the y range:
        //in this case we want equal amts on both sides of the zero line, so
        //get our abs(max) and set each of them to that (with a but extra added on).
        y.domain([-max_val() - 5 , max_val() + 5]).nice();
//
//        y.domain([d3.min(data, function(d) {return d.balance;}) - 5 , d3.max(data, function(d){return d.balance;})+5]).nice();

        chart = d3.select(".chart_area");

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
            .attr("x", function (d) {return x(d.day);})  //set width to scale function of date
            .attr("y", y(0))
//            .style("opacity",.5)
            .attr("height", 0)//set height to 0, then transition later
            .attr("width", x.rangeBand())  //set width to our x scale rangeband
            .attr("class", function (d) { //is this really the only way D3 can do mult classes?
                if (d.balance >= 0) {
                    if (d.day == 'tomorrow') { //apparently there isn't a good way to add classes?
                        return "positive_bar bar_future"
                    }
                    else {
                        return "positive_bar";
                    }
                }
                else {
                    if (d.day == 'tomorrow') {
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
                return x(d.day) + (x.rangeBand() / 2)
            })
            .attr("y", function (d) {

                if (d.balance >= 0) {
                    return y(d.balance) + 3;
                }
                else {
                    return y(d.balance) - 12;
                }
            })
            .attr("dy", "0.75em")
            .text(function (d) {
                return d.balance;
            })
           .append("svg:title")
            .text(function(d) { return "total transactions."; });


        //Animation time!
        d3.selectAll("rect").transition()
            .attr("height", function(d) {
                return Math.abs(y(0) - y(d.balance))
            })
            .attr("y", function (d) {
                if (d.balance >= 0) {
                    return y(d.balance);
                }
                else {
                    return y(0);
                }
            })
//            .style("opacity", 1)
//            .duration(50) //duration 2000
            .delay(function (d, i) {
                return i*20;
            });
//            .ease("sin-in-out");
//        .ease("elastic");

    }







    //alternate chart drawing functions:
    //common:
    function draw_legend(svg, color) {

    var legend = svg.selectAll(".legend")
          .data(color.domain().slice().reverse())
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      legend.append("rect")
          .attr("x", width-4)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color);

      legend.append("text")
          .attr("x", width-6)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d; });

}

    //each:

    function draw_stacked_bar_chart() {

        console.log("stacked bar chart is a go!");

        console.log(data);

//        var color = d3.scale.category10();
        var color = d3.scale.category20c();

        var labelVar = 'day';
        var labelVar2 = 'total';
        var labelVar3 = 'balance';
        var labelVar4 = 'mapping';

        var varNames = d3.keys(data[0])
                    .filter(function (key) {
                return (key !== labelVar && key !== labelVar2
                    && key !== labelVar3 && key !== labelVar4);

            }); //B

        color.domain(varNames);

        data.forEach(function (d) { //D
        var y0 = 0;
        d.mapping = varNames.map(function (name) {
            var temp_val = +d[name] || 0;

          return {
            name: name,
            label: d[labelVar],
            y0: y0,
            y1: y0 += temp_val
          };
        });
        d.total = d.mapping[d.mapping.length - 1].y1;
      });

      console.log("prepped data", data);

      x.domain(data.map(function (d) { return d.day; })); //E
      y.domain([0, d3.max(data, function (d) { return d.total; })]).nice();


      var svg = d3.select(".chart_area").append("g")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

      var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

      var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

        var selection = svg.selectAll(".series")
            .data(data)
          .enter().append("g")
            .attr("class", "series")
            .attr("transform", function (d) {
              return "translate(" + x(d.day) + ",0)";
            });

        selection.selectAll("rect")
          .data(function (d) { return d.mapping; }) //A
        .enter().append("rect")
          .attr("width", x.rangeBand())
//          .attr("y", function (d) { return y(d.y1); })
//          .attr("height", function (d) { return y(d.y0) - y(d.y1); })
            .attr("y", y(0))
            .attr("height", 0)
          .style("fill", function (d) { return color(d.name); })
          .style("stroke", "grey");


        d3.selectAll("rect").transition()
          .attr("y", function (d) { return y(d.y1); })
          .attr("height", function (d) { return y(d.y0) - y(d.y1); })
          .delay(function (d, i) {
                return i*10;
            });




        draw_legend(svg, color);

    }

    function draw_line_chart() {
        console.log("line chart is a go!");

        console.log(data);

        var color = d3.scale.category10();

        var labelVar = 'day';
        var labelVar2 = 'mapping';
        var labelVar3 = 'balance';

        var varNames = d3.keys(data[0])
                    .filter(function (key) {
                return (key !== labelVar && key !== labelVar3 && key !== labelVar2);

            }); //B

        color.domain(varNames);

        var seriesData = varNames.map(function (name) { //D
            return {
              name: name,
              values: data.map(function (d) {
                return {name: name, label: d[labelVar], value: +d[name] || 0};
              })
            };
          });

        console.log("seriesData", seriesData);

        x.domain(data.map(function (d) { return d.day; })); //E

        y.domain([
            d3.min(seriesData, function (c) {
              return d3.min(c.values, function (d) { return d.value; });
            }),
            d3.max(seriesData, function (c) {
              return d3.max(c.values, function (d) { return d.value; });
            })
        ]).nice();


        var svg = d3.select(".chart_area").append("g");


        var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

      var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);


        var series = svg.selectAll(".series")
            .data(seriesData)
            .enter().append("g")
            .attr("class", "series");

        var line = d3.svg.line()
                    .interpolate("basis")
                    .x(function(d) { return x(d.label); })
                    .y(function(d) { return y(d.value); });

        series.append("path")
          .attr("class", "line")
          .attr("d", function (d) { return line(d.values); })
          .style("stroke", function (d) { return color(d.name); })
          .style("stroke-width", "4px")
          .style("fill", "none");


        draw_legend(svg, color);


    }

    function draw_stacked_chart() {
        console.log("stack chart is a go!");

        console.log(data);

        var color = d3.scale.category10();

        var labelVar = 'day';
        var labelVar2 = 'total';
        var labelVar3 = 'balance';

        var varNames = d3.keys(data[0])
                    .filter(function (key) {
                return (key !== labelVar && key !== labelVar2 && key !== labelVar3);

            }); //B

        color.domain(varNames);

        var seriesArr = [], series2 = {}; //C
          varNames.forEach(function (name) {
            series2[name] = {name: name, values:[]};
            seriesArr.push(series2[name]);
          });

          data.forEach(function (d) { //D
            varNames.map(function (name) {
              series2[name].values.push({label: d[labelVar], value: +d[name] || 0});
            });
          });

          x.domain(data.map(function (d) { return d.day; })); //E

        var stack = d3.layout.stack()
            .offset("wiggle")
            .values(function (d) { return d.values; })
            .x(function (d) { return x(d.label) + x.rangeBand() / 2; })
            .y(function (d) { return d.value; });

          stack(seriesArr); // F
          console.log("stacked seriesArr", seriesArr);

          y.domain([0, d3.max(seriesArr, function (c) {
              return d3.max(c.values, function (d) { return d.y0 + d.y; });
            })]);

        var area = d3.svg.area()
            .interpolate("cardinal")
            .x(function (d) { return x(d.label) + x.rangeBand() / 2; })
            .y0(function (d) { return y(d.y0); })
            .y1(function (d) { return y(d.y0 + d.y); });

        var svg = d3.select(".chart_area").append("g");

        var selection = svg.selectAll(".series")
              .data(seriesArr)
              .enter().append("g")
                .attr("class", "series");

            selection.append("path")
              .attr("class", "streamPath")
              .attr("d", function (d) { return area(d.values); })
              .style("fill", function (d) { return color(d.name); })
              .style("stroke", "grey");

        draw_legend(svg, color);




    }


    function draw_pie_chart() {
        console.log('draw pie chart is a go!!');

    }

    function draw_bal_v_spend() {
        console.log('draw bal v spend is a go!');

        draw_chart();
        var y2 = d3.scale.linear()
                .range([height, 0]);

        y2.domain = ([0, d3.max(data, function(d) { return d.total; })]);

        var line = d3.svg.line()
            .x(function(d, i) {
                return x(d.day);
            })
            .y(function(d, i) {
               return y(d.total);
            });

        var svg = d3.select(".chart_area").append("g");

        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line)
            .attr("stroke", "orange");

        console.log('done!');

    }


    function toggle_income_line() {
        console.log("toggling income line now...");

        //this needs to check if income line is currently on, and switch.
        var line_state = $("#income_toggle")[0].checked;
        console.log(line_state);

        if (line_state === false) {
            d3.select(".line").remove();  //this might end up being to broad of a remove()...
            return;
        }

        var line = d3.svg.line()
            .x(function (d, i) {
                return x(d.day);
            })
            .y(function (d, i) {
                return y(30);
            });

        var svg = d3.select(".chart_area").append("g");

        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .style("stroke-dasharray", ("3, 4"))
            .attr("d", line)
            .attr("stroke", "black");


    }


    //chart transition/clearing functions:
    function transition_chart() {

        x.domain(data.map(function (d) {return d.date;}));
        y.domain([-max_val() - 5 , max_val() + 5]);

        //remove/transition our old data:
        var y_old = chart.select(".y.axis");
        y_old.attr("class", "y axis old");

        var x_old = chart.select(".x.axis");
        x_old.attr("class", "x axis old");

        chart.select(".y.axis").transition().duration(1000).ease("sin-in-out").call(yAxis);
        chart.select(".x.axis").transition().duration(1000).ease("sin-in-out").call(xAxis);

        y_old.remove();
        x_old.remove();
    }

    function clear_chart() {

        function remove_chart_data() {
            var bars_sel = d3.selectAll(".bar_group");
            bars_sel.remove();
//
//            d3.selectAll(".chart").selectAll('g').remove();

        }

        d3.selectAll('rect')
            .transition()
            .attr("height", function(d)
            {
               return 0;
            })
            .delay(function(d, i) {
                return i*20;
            });

            setTimeout(remove_chart_data(), 500);


    }

    function transition_chart_type() {
        d3.selectAll(".chart_area").selectAll('g').remove();
    }




//    get_parse_data(0, 0, 0, t_indicator, true, ret_filters);


    function change_date_range_of_data(dates) {

        console.log("changing date range is active now", dates);

        if (dates === true) {
            var start_date = $('#date_start')[0].value.substr(0,5);
            var end_date = $('#date_end')[0].value.substr(0,5);

            console.log("received dates: ", start_date, end_date);

            while (data.length > 0) {
                data.pop();
            }

            for (var i=0; i<global_data.daily_summary.length; i++) {
                if (global_data.daily_summary[i].day === start_date) {
                    do {
                        data.push(global_data.daily_summary[i]);
                        console.log(global_data.daily_summary[i].day, i, global_data.daily_summary.length);
                        i ++;
                    } while (global_data.daily_summary[i].day === end_date);
                }

            }


        }
        else {
            //default behaviour should be to chop off most recent two-week period:
            data = global_data.daily_summary.slice(-15);
            console.log("sliced data: ", data);
        }
    }


    //Custom event listeners for changing dates/chart types
    document.addEventListener("newDates", function(e) {

        clear_chart();
        transition_chart();

        //this should be done on the client side...
//get_parse_data(e.detail.start_date, e.detail.end_date, 0,
// true, e.detail.end_date_current, ret_filters);

        change_date_range_of_data(true);
//        draw_chart();

        switch (current_chart_type) {
            case 'chart':
                draw_chart();
                break;
            case 'stacked_bar':
                transition_chart_type();
                draw_stacked_bar_chart();
                break;
            case 'line_chart':
                transition_chart_type();
                draw_line_chart();
                break;
            case 'stacked':
                transition_chart_type();
                draw_stacked_chart();
                break;
            case 'pie':
                transition_chart_type();
                draw_pie_chart();
                break;
            case 'balvspend':
                transition_chart_type();
                draw_bal_v_spend();
                break;


            default:
                draw_chart();
            }


    }, false);

    document.addEventListener("newChartType", function(e) {

        if (e.detail.chart_type == 'toggle_income') {
            toggle_income_line();
            return;
        }



        transition_chart_type();

        console.log("switching to chart type: ", e.detail.chart_type);

        current_chart_type = e.detail.chart_type;
        switch (current_chart_type) {
            case 'chart':
                draw_chart();
                break;
            case 'stacked_bar':
                draw_stacked_bar_chart();
                break;
            case 'line_chart':
                draw_line_chart();
                break;
            case 'stacked':
                draw_stacked_chart();
                break;
            case 'pie':
                draw_pie_chart();
                break;
            case 'balvspend':
                draw_bal_v_spend();
                break;


            default:
                draw_chart();
            }

    }, false);


    document.addEventListener("newData", function(e) {

        console.log("here's global data: ", global_data);
        console.log("some details of event: ", e);

        var new_start_date = new Date(2014, parseInt(global_data.daily_summary[0].day.substring(3,5))-1,
                                            parseInt(global_data.daily_summary[0].day.substring(0,2)));

        console.log("---> attempting to set datepicker start dates", new_start_date);
        $('.input_daterange').datepicker('setStartDate', new_start_date);
        $('.date').datepicker('setStartDate', new_start_date);

//        $('.date').datepicker.setStartDate(global_data.daily_summary[0].day+"/2014");
//        $('.input-daterange').setStartDate(global_data.daily_summary[0].day+"/2014");


        if (e.detail.transition_chart) {

//            while (data.length>0) {data.pop();}

            d3.select(".y.axis").remove();
            d3.select(".x.axis").remove();
            clear_chart();
        }

        data = global_data.daily_summary;
        change_date_range_of_data();


        switch (current_chart_type) {
            case 'chart':
                draw_chart();
                break;
            case 'stacked_bar':
                transition_chart_type();
                draw_stacked_bar_chart();
                break;
            case 'line_chart':
                transition_chart_type();
                draw_line_chart();
                break;
            case 'stacked':
                transition_chart_type();
                draw_stacked_chart();
                break;
            case 'pie':
                transition_chart_type();
                draw_pie_chart();
                break;
            case 'balvspend':
                transition_chart_type();
                draw_bal_v_spend();
                break;


            default:
                draw_chart();
            }

//        draw_chart();

    }, false);

}




//function create_bar_plot() {
//
//    console.log("create bar plot is on!");
//
//    var max_val = function () {
//            return d3.max(data, function (d) {
//                return Math.abs(d.value);
//            });
//        };
//
//    function get_parse_data(start_date, end_date, offset, transition, pad, filters) {
//
//        filters = ['Groceries', 'Dinning Out', 'Coffee'];
//
//        var url_full = 'get_daily_metrics' + '?' +
//                       'start_date=' + start_date + '&' +
//                       'end_date=' + end_date + '&' +
//                       'filters=' + filters;
//
//        d3.json(url_full, function (error, json) {
//
//            console.log('received: ', json, 'offset:', offset);
//            while (data.length > 0) {
//                data.pop();
//            }
//
//            //quick reversal of our desc() ordered array:
//            for (var i = json.summary.length - 1; i >= offset; i--) {
//                var datum = {
//                    "value": +json.summary[i].balance,
//                    "date": json.summary[i].date.substring(0, 6)};
//
//                data.push(datum);
//
//                var final_value = datum.value;
//            }
//
//            //let's pad tomorrow as an extra days here:
//            //this should actually check if last day == today for padding a "tomorrow"
//            if (data.length < number_of_days && pad) {
//                datum = {"value": final_value + current_income,
//                    "date": 'tomorrow'};
//                data.push(datum);
//            }
//
//
//            console.log('data loading is complete.');
//            console.log(data);
//            console.log(data.length);
//
//            if (transition === true) {
//                transition_chart();
//            }
//
//            draw_chart();
//
//        }); //end json call.
//
//
//    }
//
//    function draw_chart() {
//
//        //apply our data domain to our x scale:
//        x.domain(data.map(function (d) {
//            return d.date;
//        }));
//
//        //apply our data domain of values to the y range:
//        //in this case we want equal amts on both sides of the zero line, so
//        //get our abs(max) and set each of them to that (with a but extra added on).
//        y.domain([-max_val() - 5 , max_val() + 5]);
//
//
//        //with our original chart object, append a new group element.
//        //call it x axis and transform to x=0, y=height (bottom)
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis);
//
//        //append another group element, called y axis, and call it:
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis);
//
//        //select all "bars" (even though they don't exist yet)
//        chart.selectAll(".bar")
//            .data(data)  //join our data on to our bars
//            .enter()
//            .append("g")
//            .attr("class", "bar_group")
//            .append("rect")//on enter, append a rect to them.
//            .attr("class", "bar_rect")  //give each rect the class "bar"
//            .attr("x", function (d) {return x(d.date);})  //set width to scale function of date
//            .attr("y", y(0))
//            .style("opacity",.5)
//            .attr("height", 0)//set height to 0, then transition later
//            .attr("width", x.rangeBand())  //set width to our x scale rangeband
//            .attr("class", function (d) { //is this really the only way D3 can do mult classes?
//                if (d.value >= 0) {
//                    if (d.date == 'tomorrow') { //apparently there isn't a good way to add classes?
//                        return "positive_bar bar_future"
//                    }
//                    else {
//                        return "positive_bar";
//                    }
//                }
//                else {
//                    if (d.date == 'tomorrow') {
//                        return "negative_bar bar_future"
//                    }
//                    else {
//                        return "negative_bar";
//                    }
//                }
//            });
//
//        //select all bars and add a text element to them
//        chart.selectAll(".bar_group")
//            .append("text")
//            .attr("x", function (d) {
//                return x(d.date) + (x.rangeBand() / 2)
//            })
//            .attr("y", function (d) {
//
//                if (d.value >= 0) {
//                    return y(d.value) + 3;
//                }
//                else {
//                    return y(d.value) - 12;
//                }
//            })
//            .attr("dy", "0.75em")
//            .text(function (d) {
//                return d.value;
//            });
//
//
//        //Animation time!
//        d3.selectAll("rect").transition()
//            .attr("height", function(d) {
//                return Math.abs(y(0) - y(d.value))
//            })
//            .attr("y", function (d) {
//                if (d.value >= 0) {
//                    return y(d.value);
//                }
//                else {
//                    return y(0);
//                }
//            })
//            .style("opacity", 1)
//            .duration(1); //duration 2000
////            .delay(200);
////            .ease("sin-in-out");
////        .ease("elastic");
//
//    }
//
//    function transition_chart() {
//
//        x.domain(data.map(function (d) {return d.date;}));
//        y.domain([-max_val() - 5 , max_val() + 5]);
//
//        //remove/transition our old data:
//        var y_old = chart.select(".y.axis");
//        y_old.attr("class", "y axis old");
//
//        var x_old = chart.select(".x.axis");
//        x_old.attr("class", "x axis old");
//
//        chart.select(".y.axis").transition().duration(1000).ease("sin-in-out").call(yAxis);
//        chart.select(".x.axis").transition().duration(1000).ease("sin-in-out").call(xAxis);
//
//        y_old.remove();
//        x_old.remove();
//    }
//
//    function clear_chart() {
//
//        var bars_sel = d3.selectAll(".bar_group");
//        bars_sel.remove();
//
//    }
//
//    var init_height = 250;
//    var init_width = $("svg").parent().width();
//    //    var init_height = 200;
//
//    var margin = {top: 10, right: 0, bottom: 30, left: 30},
//        width = init_width - margin.left - margin.right,
//        height = init_height - margin.top - margin.bottom;
//
//    //create our initial chart space, append a group to it, transform to size:
//    var chart = d3.select(".chart")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//    //set our x function as an ordinal scale using range
//    var x = d3.scale.ordinal()
//                .rangeRoundBands([0, width], .1);
//
//    //set our y function as a linear range between 0 and height.
//    var y = d3.scale.linear()
//            .range([height, 0]);
//
//    //create xAxis object based on our x scale
//    var xAxis = d3.svg.axis()
//        .scale(x)
//        .orient("bottom");
//
//    //create yAxis based on our y scale:
//    var yAxis = d3.svg.axis()
//            .scale(y)
//            .orient("left")
//            .tickFormat(function(d) {return '$' + d;});
//
//    var data = [];
//    var number_of_days = 14;
//    var current_income = 30;
//
//    //this won't work because main.js is loaded after d3_functions:
//    var init_date = document.getElementById("date_start").value;
//
//    console.log("init date: ", init_date);
//
//    get_parse_data('05/10/2014', '19/10/2014', 0, false, true);
//
//    document.addEventListener("newDates", function(e) {
//        clear_chart();
//        get_parse_data(e.detail.start_date, e.detail.end_date, 0, true, e.detail.end_date_current);
//
//    }, false);
//
//
//
//}
