


var submit_transaction = function() {

    var transaction_amount = $('#transaction_amount').val();
    var purchase_type = $('#purchase_type').val();

    console.log('submitting transaction. amount: ', transaction_amount, purchase_type);

    $.post( "/submit_transaction", { transaction: transaction_amount, purchase: purchase_type}
        ).success(function() {
        window.location.reload(true);
    });

};

$('.date').datepicker();