


var submit_transaction = function() {

    var transaction_amount = $('#transaction_amount').val();

    console.log('submitting transaction. amount: ', transaction_amount);

    $.post( "/submit_transaction", { transaction: transaction_amount}
        ).success(function() {
        window.location.reload(true);
    });



};