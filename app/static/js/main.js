


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

$('.date').datepicker({
    format: "M dd yyyy",
    startDate: "10/01/2014",  //make this not hardcoded...
    endDate: "10/04/2014",  //make this today()
    autoclose: true,
    todayHighlight: true

});




