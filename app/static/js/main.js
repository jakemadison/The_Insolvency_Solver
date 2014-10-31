$(function(){
    //Array of images
    var imageArray = ["fry_sm.png", "poor_zoidberg.png", "rich_bender.jpg",
        "rich_zoidberg.jpg", "nixon_money.jpg", "fry_sm.png"];

    //the problem with this solution is that the final element of the array is almost never selected
    //so we add an extra doubled value there, just in case it does get picked, but keeping our
    //other elements in the mix.
    var randomNumber = Math.floor((imageArray.length-1)*Math.random());

    //display image:
    $('#pic').prop('src', '../static/assets/'+imageArray[randomNumber]);

    //eventually, let's have more pics and two arrays and if bal >= 0, richArray, else poorArray
//    for (var i = 0; i < 100; i++) {
//        console.log(Math.floor((imageArray.length-1)*Math.random()));
//    }



});




var submit_transaction = function() {

    var transaction_amount = $('#transaction_amount').val();
    var purchase_type = $('#purchase_type').val();
    var transaction_date = $('#transaction_date').val();

    console.log('submitting transaction. amount: ', transaction_amount, purchase_type, transaction_date);

    $.post( "/submit_transaction", { transaction: transaction_amount,
                                     purchase: purchase_type,
                                     transaction_date: transaction_date}
        ).success(function() {
        window.location.reload(true);
    });

};

function get_todays_date(delta_days) {

    var day = new Date();

    if (delta_days !== undefined) {
        day.setDate(day.getDate() + delta_days);
    }


  var dd = day.getDate();
  var mm = day.getMonth() + 1;
  var yyyy = day.getFullYear();

  var date_final = dd+'/'+mm+'/'+yyyy;

  return date_final;

}

//incorrect format... moment.js? or is that overkill?
//document.getElementById("transaction_date").value = get_todays_date();

$('.date').datepicker({
    format: "dd/mm/yyyy",
    startDate: "01/10/2014",  //make this not hardcoded...
    endDate: get_todays_date(),
    autoclose: true,
    todayHighlight: true
});

$('.input-daterange').datepicker({
//    format: "M dd yyyy",
    format: "dd/mm/yyyy",
    startDate: "01/10/2014",  //make this not hardcoded...
    endDate: get_todays_date(),
    autoclose: true,
    todayHighlight: true
})

    .on("changeDate", function(e) {
            console.log("the date was changed: ", e);

            //changes to the first date or last date should also affect the range of
            //available dates. --is that possible with datepicker?

            var start_date = document.getElementById("date_start").value;
            var end_date = document.getElementById("date_end").value;

            if (start_date !== '' && end_date !== '') {

//                redraw_chart(start_date, end_date);

                var end_date_current;

                if (end_date == get_todays_date()) {
                    console.log("end date true!!");
                    end_date_current = true;
                }
                else {
                    console.log("end date false!!");
                    end_date_current = false;
                }

                var event = new CustomEvent(
                    "newDates",
                    {
                        detail: {
                            start_date: start_date,
                            end_date: end_date,
                            end_date_current: end_date_current
                        },
                        bubbles: true,
                        cancelable: true
                    }
                );

                console.log("dispatching!");
                document.getElementById("datepicker").dispatchEvent(event);

            }
        });

console.log("setting start and end date");
//$('#date_start').attr("value", '05/10/2014');
$('#date_start').attr("value", get_todays_date(-14));
$('#date_end').attr("value", get_todays_date());

//$("#changeChartType")

function switchChartType(type) {

     var event = new CustomEvent(
                    "newChartType",
                    {
                        detail: {
                            chart_type: type
                        },
                        bubbles: true,
                        cancelable: true
                    }
                );

    document.getElementById("changeChartType").dispatchEvent(event);

}


//functions for hiding/showing the description:
window.onload = function(){

    document.getElementById('close').onclick = function(){
        this.parentNode.parentNode
        .style.display = "none";
        document.getElementById('about_link').style.display="";

        $.post( "/change_info_display", { hidden: 1});


        return false;
    };


    document.getElementById('about_link').onclick = function(){
        document.getElementById('close')
            .parentNode.parentNode
        .style.display = "";

        this.style.display="none";
        $.post( "/change_info_display", { hidden: 0});
        return true;
    };


};

$('#login_modal').modal('show');



function gmail_login(openid) {

    console.log('start gmail login');
    console.log(openid);

    var u = openid.search('<username>');

    console.log(u);

    if (u != -1) {
        // if openid requires username
        var user = prompt('Enter your Google username:');
        openid = openid.substr(0, u) + user;
        console.log(openid);
    }

    console.log(openid);


//    $.post('/f_login', {url:openid});

   var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "/login_user");

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("name", "url");
    hiddenField.setAttribute("value", openid);
    form.appendChild(hiddenField);

    document.body.appendChild(form);
    form.submit();

    console.log('done!!!!');
    return false;
}