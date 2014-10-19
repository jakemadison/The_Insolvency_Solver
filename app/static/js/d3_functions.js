//function daysBetween( date1, date2 ) {
//  //Get 1 day in milliseconds
//  var one_day=1000*60*60*24;
//
//  // Convert both dates to milliseconds
//  var date1_ms = date1.getTime();
//  var date2_ms = date2.getTime();
//
//  // Calculate the difference in milliseconds
//  var difference_ms = date2_ms - date1_ms;
//
//  // Convert back to days and return
//  return Math.round(difference_ms/one_day);
//}


function create_bar_plot() {

    console.log("create bar plot is on!");

    var max_val = function () {
            return d3.max(data, function (d) {
                return Math.abs(d.value);
            });
        };

    function get_parse_data(start_date, end_date, offset, transition, pad, filters) {

        filters = ['Groceries', 'Dinning Out', 'Coffee'];

        var url_full = 'get_daily_metrics' + '?' +
                       'start_date=' + start_date + '&' +
                       'end_date=' + end_date + '&' +
                       'filters=' + filters;

        d3.json(url_full, function (error, json) {

            console.log('received: ', json, 'offset:', offset);
            while (data.length > 0) {
                data.pop();
            }

            //quick reversal of our desc() ordered array:
            for (var i = json.summary.length - 1; i >= offset; i--) {
                var datum = {
                    "value": +json.summary[i].balance,
                    "date": json.summary[i].date.substring(0, 6)};

                data.push(datum);

                var final_value = datum.value;
            }

            //let's pad tomorrow as an extra days here:
            //this should actually check if last day == today for padding a "tomorrow"
            if (data.length < number_of_days && pad) {
                datum = {"value": final_value + current_income,
                    "date": 'tomorrow'};
                data.push(datum);
            }


            console.log('data loading is complete.');
            console.log(data);
            console.log(data.length);

            if (transition === true) {
                transition_chart();
            }

            draw_chart();

        }); //end json call.


    }

    function draw_chart() {

        //apply our data domain to our x scale:
        x.domain(data.map(function (d) {
            return d.date;
        }));

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
            .style("opacity",.5)
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
            .style("opacity", 1)
            .duration(1); //duration 2000
//            .delay(200);
//            .ease("sin-in-out");
//        .ease("elastic");

    }

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

        var bars_sel = d3.selectAll(".bar_group");
        bars_sel.remove();

    }

    var init_height = 250;
    var init_width = $("svg").parent().width();
    //    var init_height = 200;

    var margin = {top: 10, right: 0, bottom: 30, left: 30},
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

    //this won't work because main.js is loaded after d3_functions:
    var init_date = document.getElementById("date_start").value;

    console.log("init date: ", init_date);

    get_parse_data('05/10/2014', '19/10/2014', 0, false, true);

    document.addEventListener("newDates", function(e) {
        clear_chart();
        get_parse_data(e.detail.start_date, e.detail.end_date, 0, true, e.detail.end_date_current);

    }, false);



}


function create_transaction_plot(t_indicator, plot_style) {

    console.log("transaction plot!");

    var json_data = [];  //what the server originally sent us
    var data = [];  //data that is parsed for daily metrics calculations, includes daily amounts (-N -> N)
    var transaction_data = [];  //data that is parsed for transactions/day (0 -> N)

    //
    //init all of our starting vars:
    //

    var init_height = 400;
    var init_width = $("svg").parent().width();
    //    var init_height = 200;

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
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


    var number_of_days = 14;
    var current_income = 30;

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
            });
        };

    function get_parse_data(start_date, end_date, offset, transition, pad, filters) {

        var url_full = 'get_transaction_metrics' + '?' +
                       'start_date=' + start_date + '&' +
                       'end_date=' + end_date;


        d3.json(url_full, function (error, json) {

            console.log('received: ', json, 'offset:', offset);
            while (data.length > 0) {
                data.pop();
                transaction_data.pop();
            }

            //quick reversal of our desc() ordered array:
            json_data = json.transactions;

            var running_balance = current_income;

            var date_counter;
            if (start_date !== 0) {
                var date_vals = start_date.split('/');
                date_counter = new Date(date_vals[2], date_vals[1]-1, date_vals[0]);
            }
            else {
                date_counter = new Date(2014, 9, 1); //this needs to change.
            }
//            date_counter = new Date(date_vals[2], date_vals[1], date_vals[0]); //this needs to be the first date in the record...
            var datum = {'day': date_counter.toDateString().substring(4, 10),
                         'balance': running_balance,
                          'total_transactions': 0};

            //day, category, sum_of_amounts

            var transaction_datum = {'day': date_counter.toDateString().substring(4, 10)};

//            console.log("balance is at: ", datum);

            function parse_data(f){

                var category_list = [];
                $(".filter_options").each(function() {
                    category_list.push($(this).val());
                });

                for (var i = json_data.length - 1; i >= offset; i--) {

                var mdy = json_data[i].timestamp.split('/');
                var transaction_date = new Date(mdy[2], mdy[1]-1, mdy[0]);


//                console.log("attempting to add: ", json_data[i].timestamp, json_data[i].purchase_type, json_data[i].amount);

                //ready for spaghetti??
                if (transaction_date.toDateString() === date_counter.toDateString()) { //apply this transaction to our date record.

                    if (f.length === 0 || f.indexOf(json_data[i].purchase_type) > - 1) {  //filters?

                        var num_amount = +json_data[i].amount;

                        datum.balance -= num_amount;
                        datum.total_transactions += 1;
//                        console.log("same day, subtracting amount.  new balance: ", datum, num_amount);

                        for (var j =0; j < category_list.length; j++) {

                            if (transaction_datum[category_list[j]]) {

                                if (category_list[j] === json_data[i].purchase_type) {

//                                    console.log("hit");
                                    transaction_datum[category_list[j]] += num_amount;
                                }

                            }

                            else {
                                if (category_list[j] === json_data[i].purchase_type) {
                                    transaction_datum[category_list[j]] = num_amount;
                                }
                                else {
                                    transaction_datum[category_list[j]] = 0;
                                }
                            }
                        }

//                        console.log("current datum: ", transaction_datum);
                    }
                }

                else { //our current transaction is a new day.  push our old record on to the stack and make a new one.

                    do  {
                        running_balance = datum.balance;
                        data.push(datum);  //push day record on to our stack.

                        transaction_data.push(transaction_datum);

                        date_counter.setDate(date_counter.getDate() + 1); //increase date counter by one
                        datum = {'day': date_counter.toDateString().substring(4, 10),
                                 'balance': current_income + running_balance}; //create a new day record

                        transaction_datum = {'day': date_counter.toDateString().substring(4, 10)};

                        if (transaction_date.toDateString() === date_counter.toDateString() &&
                            (f.length === 0 || f.indexOf(json_data[i].purchase_type) > - 1)) {

//                            console.log("creating a new date record now.");

                            var num_amount_new = +json_data[i].amount;

                            datum.balance -= +json_data[i].amount;
                            datum.total_transactions += 1;

                            for (j = 0; j < category_list.length; j++) {

                                if (transaction_datum[category_list[j]]) {
                                    if (category_list[j] === json_data[i].purchase_type) {
                                        transaction_datum[category_list[j]] += num_amount_new;
                                    }
                                }

                                else {
                                    if (category_list[j] === json_data[i].purchase_type) {
                                        transaction_datum[category_list[j]] = num_amount_new;
                                    }
                                    else {
                                        transaction_datum[category_list[j]] = 0;
                                    }
                                }
                            }

//                            console.log("current datum for the new day: ", transaction_datum);

                        }

//                        break;
                    } while (date_counter.toDateString() !== transaction_date.toDateString());
                }
            }

            data.push(datum);
            transaction_data.push(transaction_datum);

            console.log('data loading is complete.');
            console.log(data);
            console.log(data.length);

            }


            parse_data(filters);

            //this should get moved to a separate function on level up the call stack.
            //all transitions should happen on the client side.  Always retrieve all data once and draw a chart
            //then just alter the contents of the chart later
            if (transition === true) {
                transition_chart();
            }


            switch (plot_style) {
                case 'chart':
                    draw_chart();
                    break;
                case 'calendar':
                    draw_calendar();
                    break;
                default:
                    draw_chart();
            }

        }); //end json call.


    }

    function draw_calendar() {
        console.log("calendar is a go!");
    }


    //starting to group common chart operations here....
    function draw_legend(svg, color) {

        var legend = svg.selectAll(".legend")
              .data(color.domain().slice().reverse())
            .enter().append("g")
              .attr("class", "legend")
              .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

          legend.append("rect")
              .attr("x", width + 30)
              .attr("width", 18)
              .attr("height", 18)
              .style("fill", color);

          legend.append("text")
              .attr("x", width + 24)
              .attr("y", 9)
              .attr("dy", ".35em")
              .style("text-anchor", "end")
              .text(function(d) { return d; });

    }


    //chart drawing functions:
    function draw_stacked_chart() {
        console.log("stack chart is a go!");

        console.log(transaction_data);

        var color = d3.scale.category10();
//        var parseDate = d3.time.format("%b %d").parse;
//        transaction_data.forEach(function(d) { d.day = parseDate(d.day); });


        var labelVar = 'day'; //A
        var varNames = d3.keys(transaction_data[0])
                    .filter(function (key) { return key !== labelVar;}); //B

        color.domain(varNames);

        var seriesArr = [], series2 = {}; //C
          varNames.forEach(function (name) {
            series2[name] = {name: name, values:[]};
            seriesArr.push(series2[name]);
          });

          transaction_data.forEach(function (d) { //D
            varNames.map(function (name) {
              series2[name].values.push({label: d[labelVar], value: +d[name] || 0});
            });
          });

          x.domain(transaction_data.map(function (d) { return d.day; })); //E

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

        var svg = d3.select(".chart").append("g");

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

    function draw_stacked_bar_chart() {

        console.log("stacked bar chart is a go!");

        console.log(transaction_data);

        var color = d3.scale.category10();

        var labelVar = 'day'; //A
        var varNames = d3.keys(transaction_data[0])
                    .filter(function (key) { return key !== labelVar;}); //B

        color.domain(varNames);

        transaction_data.forEach(function (d) { //D
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

      console.log("prepped data", transaction_data);

      x.domain(transaction_data.map(function (d) { return d.day; })); //E
      y.domain([0, d3.max(transaction_data, function (d) { return d.total; })]).nice();


      var svg = d3.select(".chart").append("g")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

      var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

      var yAxis = d3.svg.axis()
            .scale(y)
            .orient("right");

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

        var selection = svg.selectAll(".series")
            .data(transaction_data)
          .enter().append("g")
            .attr("class", "series")
            .attr("transform", function (d) {
              return "translate(" + x(d.day) + ",0)";
            });

        selection.selectAll("rect")
          .data(function (d) { return d.mapping; }) //A
        .enter().append("rect")
          .attr("width", x.rangeBand())
          .attr("y", function (d) { return y(d.y1); })
          .attr("height", function (d) { return y(d.y0) - y(d.y1); })
          .style("fill", function (d) { return color(d.name); })
          .style("stroke", "grey");


        draw_legend(svg, color);

    }

    function draw_line_chart() {
        console.log("line chart is a go!");

        console.log(transaction_data);

        var color = d3.scale.category10();

        var labelVar = 'day'; //A
        var varNames = d3.keys(transaction_data[0])
                    .filter(function (key) { return key !== labelVar;}); //B

        color.domain(varNames);

        var seriesData = varNames.map(function (name) { //D
            return {
              name: name,
              values: transaction_data.map(function (d) {
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


        var svg = d3.select(".chart").append("g");


        var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

      var yAxis = d3.svg.axis()
            .scale(y)
            .orient("right");

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


    //draw our basic chart:
    function draw_chart() {

        //apply our data domain to our x scale:
        x.domain(data.map(function (d) {
            return d.day;
        }));

        //apply our data domain of values to the y range:
        //in this case we want equal amts on both sides of the zero line, so
        //get our abs(max) and set each of them to that (with a but extra added on).
        y.domain([-max_val() - 5 , max_val() + 5]).nice();


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
            .text(function(d) { return d.total_transactions + " total transactions."; });


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
        d3.selectAll(".chart").selectAll('g').remove();
    }




    //get our init data:
    get_parse_data(0, 0, 0, t_indicator, true, ret_filters);



    //Custom event listeners for changing dates/chart types
    document.addEventListener("newDates", function(e) {
        clear_chart();

        //this should be done on the client side...
        get_parse_data(e.detail.start_date, e.detail.end_date, 0, true, e.detail.end_date_current, ret_filters);

    }, false);

    document.addEventListener("newChartType", function(e) {

        transition_chart_type();

        console.log("switching to chart type: ", e.detail.chart_type);

        switch (e.detail.chart_type) {
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

            default:
                draw_chart();
            }

    }, false);


    document.addEventListener("newData", function(e) {

        console.log("i have received our new test event.");
        console.log("here's global data: ", global_data);
        console.log("some details of event: ", e);

    }, false);

}

var global_data;

function load_data(filters) {
    console.log("loading data now");

    var url_full = 'get_spending_data'
               + '?' + 'filters=' + filters;


        d3.json(url_full, function (error, json) {

            console.log("retrieving data from server");

            console.log("i received: ", json);

            global_data = json;

            var event = new CustomEvent(
                "newData",
                {
                    detail: {
                        transition_chart: false,
                        change_chart_type: false
                    },
                    bubbles: true,
                    cancelable: true
                }
            );

            document.dispatchEvent(event);

        });

}


