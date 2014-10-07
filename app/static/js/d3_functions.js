
var select_paragraph = function() {

    var margin = {top: 20, right: 30, bottom: 30, left: 0},
        width = 700 - margin.left - margin.right,
        height = 220 - margin.top - margin.bottom;

    var number_of_days = 14;
    var current_income = 30;
    var data = [];

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
            .orient("left");


    //actually begin loading data:
    d3.json('get_daily_metrics', function(error, json) {
        console.log('received: ', json);

        //quick reversal of our desc() ordered array:
        for (var i = json.summary.length - 1; i >= 0; i--) {
            var datum = {"value": Math.abs(+json.summary[i].balance),
                         "date": json.summary[i].date.substring(0,6)};

            data.push(datum);

            var final_value = datum.value;
        }
        //let's pad some extra days here:
        if (data.length < number_of_days) {
            datum = {"value": final_value+current_income,
                         "date": 'tomorrow'};
            data.push(datum);
        }

        var j = 0;
        while (data.length < number_of_days) {
            datum = {"value":.5,
                         "date": 'f'+j};
            data.push(datum);
            i++;
        }

        console.log('data loading is complete.');
        console.log(data);
        console.log(data.length);
        ////////////////////////////////////////////////////////////////////////////////

        var barwidth = width / data.length;

        //apply our data domain to our x scale:
        x.domain(data.map(function(d) {return d.date;}));

        //apply our data domain of values to the y range:
        y.domain([0, d3.max(data, function(d) {return d.value;})]);


        //with our original chart object, append a new group element.
        //call it x axis and transform to x=0, y=height (bottom)
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,"+height+")")
            .call(xAxis);

        //append another group element, called y axis, and call it:
        chart.append("g")
             .attr("class", "y axis");
//             .call(yAxis);


        //select all "bars" (even though they don't exist yet)
        chart.selectAll(".bar")
            .data(data)  //join our data on to our bars
          .enter()
            .append("g")
            .attr("class", "bar_group")
           .append("rect")//on enter, append a rect to them.
            .attr("class", "bar")  //give each rect the class "bar
            .attr("x", function(d) {return x(d.date);})  //set width to scale function of date
            .attr("y", function(d) {return y(d.value);})  //set y to scale of it's value
            .attr("height", function(d) {return height - y(d.value);})  //set height to scaled value
            .attr("width", x.rangeBand());  //set width to our x scale rangeband

        //select all bars and add a text element to them
        chart.selectAll(".bar_group")
            .append("text")
              .attr("x", function(d) {return x(d.date) + (x.rangeBand()/2)})
              .attr("y", function(d) {return y(d.value) + 3;})
              .attr("dy", "0.75em")
              .text(function (d) {return d.value;});


    }); //end of json loading.

        console.log('select_paragraph is finished.');

};