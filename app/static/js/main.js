
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

  var date_final = mm+'/'+dd+'/'+yyyy;

  console.log(date_final);

  return date_final;

};

//incorrect format... moment.js? or is that overkill?
//document.getElementById("transaction_date").value = get_todays_date();

$('.date').datepicker({
    format: "M dd yyyy",
    startDate: "10/01/2014",  //make this not hardcoded...
    endDate: get_todays_date(),
    autoclose: true,
    todayHighlight: true
});

$('.input-daterange').datepicker({
    format: "M dd yyyy",
    startDate: "10/01/2014",  //make this not hardcoded...
    endDate: get_todays_date(),
    autoclose: true,
    todayHighlight: true
});



//functions for hiding/showing the description:
window.onload = function(){
//    document.getElementById('close').onclick = function(){
//        this.parentNode.parentNode.parentNode
//        .removeChild(this.parentNode.parentNode);
//        return false;
//    };

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

