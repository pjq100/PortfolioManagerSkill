/**
 * Created by Peter on 4/11/17.
 */

function getPortfolio(){
    let portfolio_id = $('#portfolio_id_get').val();
    if(portfolio_id!="") {
        window.location.assign('/portfolio/' + portfolio_id);
    }
    else{
        alert("Please enter a portfolio id to retrieve that portfolio")
    }
}

function createPortfolio(){
    let portfolio_id = $('#portfolio_id_create').val();
    if(portfolio_id!="") {
        $.ajax({
            url: '/portfolio/' + portfolio_id,
            type: 'POST',
            statusCode: {
                201: function (res) {
                    window.location.assign('/portfolio/' + portfolio_id);
                },
                500: function (res) {
                    alert(res.status + " " + res.statusText + ".  " + res.responseText);
                }
            }
        });
        $('#portfolio_id_create').val('');
    }
    else{
        alert("Please enter a portfolio id to create a portfolio with that id");
    }
}

function addStock(){
    let portfolio_id = $('#portfolio_id').text();
    let ticker = $('#add_stock').val();
    let quantity = $('#add_stock_number').val();
    if(ticker!="" && quantity!="") {
        $.ajax({
            url: '/portfolio/' + portfolio_id + '/stock/' + ticker,
            data: {quantity: quantity},
            type: 'POST',
            statusCode: {
                201: function (res) {
                        let temp = $(`#${ticker}`);
                        if(temp.length){
                            temp.text(`${res.ticker}   ${res.quantity}`);
                        }
                        else{
                            console.log("FUCK");
                            $('#stock_list').append(`<li id=${res.ticker}>${res.ticker}   ${res.quantity}</li>`)
                        }
                },
                400: function (res) {
                    alert(res.status + " " + res.statusText + ".  " + res.responseText);
                },
                500: function (res) {
                    alert(res.status + " " + res.statusText + ".  " + res.responseText);
                }
            }
        });
        $('#add_stock').val('');
        $('#add_stock_number').val('');
    }
    else{
        alert("Please enter a ticker and quantity to add.")
    }
}

function removeStock(){
    let portfolio_id = $('#portfolio_id').text();
    let ticker = $('#remove_stock').val();
    let quantity = $('#remove_stock_number').val();
    if(ticker!="" && quantity!="") {
        $.ajax({
            url: '/portfolio/' + portfolio_id + '/stock/' + ticker,
            type: 'DELETE',
            data: {quantity: quantity},
            statusCode: {
                201: function (res) {
                    let temp = $(`#${ticker}`);
                    if(res.deleted){
                        temp.remove();
                    }
                    else{
                        temp.text(`${res.ticker}   ${res.quantity}`);
                    }
                },
                400: function (res) {
                    alert(res.status + " " + res.statusText + ".  " + res.responseText);
                },
                500: function (res) {
                    alert(res.status + " " + res.statusText + ".  " + res.responseText);
                }
            }
        });
        $('#remove_stock').val('');
        $('#remove_stock_number').val('');
    }
    else{
        alert("Please enter a ticker and quantity to remove.")
    }
}

function lookupStockQuote(){
    let ticker = $('#stock_quote').val();
    if(ticker!=""){
        $.ajax({
            url: '/stock/'+ticker,
            type: 'GET',
            statusCode: {
                200: function(res){
                    $('#stock_name').text(ticker);
                    $('#stock_price').text(res.quote);

                },
                400: function(res){
                    alert(res.status + " " + res.statusText + ".  " + res.responseText);
                },
                500: function(res){
                    alert(res.status + " " + res.statusText + ".  " + res.responseText);
                }
            }
        });
        $('#stock_quote').val('');
    }
    else{
        alert("Please enter a ticker to lookup a quote")
    }
}