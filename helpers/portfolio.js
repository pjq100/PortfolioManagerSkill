/**
 * Created by Peter on 4/11/17.
 */

let tradier_key = require('../config/tradier_key');
let parseString = require('xml2js').parseString;
let request = require('request');

function calculatePortfolioPerformance(portfolio, time, cb){
    let d = new Date();
    d.setDate(d.getDate() - (time-1));
    let day= d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();
    let date = year + "-" + month + "-" + day;

    let count = 0;
    let original_prices = new Array(portfolio.stock_list.length);
    let original_value = 0;
    let err = false;

    for(let i = 0; i < portfolio.stock_list.length; i++){
        let stock = portfolio.stock_list[i];
        let date_used = date;
        if(year < stock.purchase_year || (year > stock.purchase_year && month < stock.purchase_month) || (year > stock.purchase_year && month > stock.purchase_month && day < stock.purchase_day)){
            date_used = stock.purchase_year + "-" + stock.purchase_month + "-" + stock.purchase_day;
        }

        let options = {
            url: `https://sandbox.tradier.com/v1/markets/history?symbol=${stock.ticker}&start=${date_used}&end=${date_used}`,
            headers: {
                Authorization: tradier_key
            }
        };

        function tradierCallback(error, response, body){
            if(error){
                cb(false);
            }
            parseString(body, function(err, result){
                console.log(JSON.stringify((result)));
                original_prices[i] = parseFloat(result.history.day[0].close[0]);
                count++;
                if(count == portfolio.stock_list.length){
                    for(j = 0; j < portfolio.stock_list.length; j++){
                        original_value += original_prices[j] * portfolio.stock_list[j].quantity;
                    }
                    getPortfolioStockCurrentPrices(portfolio, original_value, cb);
                }
            });
        }

        request(options, tradierCallback);
    }
}

function getPortfolioStockCurrentPrices(portfolio, original_value, cb){
    let current_prices = new Array(portfolio.stock_list.length);
    let symbols = "";
    let new_value = 0;
    let err = false;

    for(let i = 0; i < portfolio.stock_list.length; i++){
        symbols += portfolio.stock_list[i].ticker + ",";
    }

    let options = {
        url: `https://sandbox.tradier.com/v1/markets/quotes?symbols=${symbols}`,
        headers: {
            Authorization: tradier_key
        }
    };

    function tradierCallback(error, response, body){
        if(error){
            cb(false);
        }
        parseString(body, function(err, result){
            console.log(JSON.stringify((result)));
            for (let i=0; i < result.quotes.quote.length; i++){
                current_prices[i] = parseFloat(result.quotes.quote[i].close[0]);
            }
            for(let i=0; i < portfolio.stock_list.length; i++){
                new_value += current_prices[i] * portfolio.stock_list[i].quantity;
            }
            let performance = (((new_value - original_value) / original_value) * 100).toFixed(2);
            cb(performance);
        });
    }

    request(options, tradierCallback);
}

function calculatePortfolioVolatility(portfolio, time){

}


module.exports = { calculatePortfolioPerformance, calculatePortfolioVolatility };