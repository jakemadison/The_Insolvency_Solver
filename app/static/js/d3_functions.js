function daysBetween( date1, date2 ) {
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;

  // Convert back to days and return
  return Math.round(difference_ms/one_day);
}



function create_bar_plot() {

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
            if (data.length < number_of_days+14 && pad) {
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

    get_parse_data(0, 0, 0, false, true);

    document.addEventListener("newDates", function(e) {
        clear_chart();
        get_parse_data(e.detail.start_date, e.detail.end_date, 0, true, e.detail.end_date_current);

    }, false);



}


function create_transaction_plot(t_indicator) {
    console.log("transaction plot!");

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
            }

            //quick reversal of our desc() ordered array:

            var transactions = json.transactions;

            var running_balance = current_income;
            console.log(start_date);
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
            console.log("balance is at: ", datum);

            function parse_data(f){
                for (var i = transactions.length - 1; i >= offset; i--) {

//                  console.log('===current date record: ', datum, 'current transaction: ', transactions[i].amount);
                // - dd/mm/yyyy

                var mdy = transactions[i].timestamp.split('/');
                var transaction_date = new Date(mdy[2], mdy[1]-1, mdy[0]);

//                console.log('testing date counter ', date_counter.toDateString(), 'against date transaction',
//                    transaction_date, transaction_date.toDateString()===date_counter.toDateString());

                if (transaction_date.toDateString() === date_counter.toDateString()) { //apply this transaction to our date record.

                    if (f.length === 0 || f.indexOf(transactions[i].purchase_type) > - 1) {
                        var num_amount = +transactions[i].amount;

                        datum.balance -= num_amount;
                        datum.total_transactions += 1;
//                        console.log("same day, subtracting amount.  new balance: ", datum, num_amount);

                    }
                }

                else {

                    console.log("----> finished date, pushing to stack: ", datum);

                    do  {
                        running_balance = datum.balance;
                        data.push(datum);  //push day record on to our stack.
                        date_counter.setDate(date_counter.getDate() + 1); //increase date counter by one
                        datum = {'day': date_counter.toDateString().substring(4, 10),
                                 'balance': current_income + running_balance}; //create a new day record

                        if (transaction_date.toDateString() === date_counter.toDateString() &&
                            (f.length === 0 || f.indexOf(transactions[i].purchase_type) > - 1)) {

                            datum.balance -= +transactions[i].amount;
                            datum.total_transactions += 1;

                        }

//                        break;
                    } while (date_counter.toDateString() !== transaction_date.toDateString());
                }
            }

            data.push(datum);

            console.log('data loading is complete.');
            console.log(data);
            console.log(data.length);

            }


            parse_data(filters);
//              parse_data(['Smokes', 'Booze','Groceries', 'Cab', 'Coffee']);


            if (transition === true) {
                transition_chart();
            }

            draw_chart();

        }); //end json call.


    }

    function draw_chart() {

        //apply our data domain to our x scale:
        x.domain(data.map(function (d) {
            return d.day;
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


    var ret_filters = get_filter_list();

    console.log("t indicator: ", t_indicator);

    if (t_indicator) {
        d3.select(".y.axis").remove();
        d3.select(".x.axis").remove();
        clear_chart();
    }

    get_parse_data(0, 0, 0, t_indicator, true, ret_filters);

    document.addEventListener("newDates", function(e) {
        clear_chart();
        get_parse_data(e.detail.start_date, e.detail.end_date, 0, true, e.detail.end_date_current, ret_filters);

    }, false);


}