/**
 * Created by Peter on 4/26/17.
 */
let tradier_key = require('../config/tradier_key');
let parseString = require('xml2js').parseString;
let request = require('request');

function getStockPricesForCorrelationCalculation(ticker1, ticker2, time, cb){
    let prices_1 = [];
    let prices_2 = [];
    let stock_1 = true;

    let d = new Date();
    d.setDate(d.getDate() - (time-1));
    let day= d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();
    let date = year + "-" + month + "-" + day;

    let today = new Date();
    let day_today = today.getDate();
    let month_today = today.getMonth() +1;
    let year_today = today.getFullYear();
    let today_date = year_today + "-" + month_today + "-" + day_today;

    let options_1 = {
        url: `https://sandbox.tradier.com/v1/markets/history?symbol=${ticker1}&start=${date}&end=${today_date}`,
        headers: {
            Authorization: tradier_key
        }
    };
    let options_2 = {
        url: `https://sandbox.tradier.com/v1/markets/history?symbol=${ticker2}&start=${date}&end=${today_date}`,
        headers: {
            Authorization: tradier_key
        }
    };

    function tradierCallbackSwitch(err, response, body){
        if(err){
            cb(false);
        }
        else{
            if(stock_1){
                stock_1 = false;
                tradierCallback(body, true);
            }
            else{
                tradierCallback(body, false);
            }
        }
    }

    function tradierCallback(body, stock_1){
        parseString(body, function(err, result){
            console.log(JSON.stringify((result)));
            if(!result.history.day){
                cb("Bad Ticker");
                return;
            }
            if(stock_1){
                for(i = 0; i < result.history.day.length; i++){
                    prices_1.push(parseFloat(result.history.day[i].close[0]));
                }
            }
            else{
                for(i = 0; i < result.history.day.length; i++){
                    prices_2.push(parseFloat(result.history.day[i].close[0]));
                }
                calculateStockCorrelation(prices_1, prices_2, cb);
            }
        })
    }

    request(options_1, tradierCallbackSwitch);
    request(options_2, tradierCallbackSwitch);
}

function calculateStockCorrelation(prices_1, prices_2, cb){
    let mean_price_1 = 0;
    let mean_price_2 = 0;
    for(let i = 0; i < prices_1.length; i++){
        mean_price_1 += prices_1[i];
    }
    for(let i = 0; i < prices_2.length; i++){
        mean_price_2 += prices_2[i];
    }
    mean_price_1 /= prices_1.length;
    mean_price_2 /= prices_2.length;

    let deviations_1 = prices_1;
    let deviations_2 = prices_2;
    for(let i = 0; i < deviations_1.length; i++){
        deviations_1[i] = mean_price_1 - deviations_1[i];
    }
    for(let i = 0; i < deviations_2.length; i++){
        deviations_2[i] = mean_price_2 - deviations_2[i];
    }

    let covariance_array = [];
    for(let i = 0; i < deviations_1.length; i++){
        covariance_array.push(deviations_1[i] * deviations_2[i]);
    }
    let covariance = covariance_array.reduce(getSum) / (deviations_1.length - 1);

    let variance_array_1 = [];
    let variance_array_2 = [];
    for(let i = 0; i < deviations_1.length; i++){
       variance_array_1.push(Math.pow(deviations_1[i],2));
    }
    for(let i = 0; i < deviations_2.length; i++){
        variance_array_2.push(Math.pow(deviations_2[i],2));
    }

    let variance_1 = variance_array_1.reduce(getSum) / (deviations_1.length - 1);
    let variance_2 = variance_array_2.reduce(getSum) / (deviations_2.length - 1);

    let standard_deviation_1 = Math.sqrt(variance_1);
    let standard_deviation_2 = Math.sqrt(variance_2);

    let correlation = covariance / (standard_deviation_1 * standard_deviation_2);
    cb(correlation);
}

function getSum(total, num){
    return total + num;
}

module.exports = { getStockPricesForCorrelationCalculation };