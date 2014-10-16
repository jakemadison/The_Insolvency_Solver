
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

var get_todays_date = function() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();

  var date_final = dd+'/'+mm+'/'+yyyy;

  console.log(date_final);

  return date_final;

};

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


$('#date_start').attr("value", '01/10/2014');
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


        return false;
    };


    document.getElementById('about_link').onclick = function(){
        document.getElementById('close')
            .parentNode.parentNode
        .style.display = "";

        this.style.display="none";
        return true;
    };


};

