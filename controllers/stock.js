/**
 * Created by Peter on 4/11/17.
 */

let request = require('request');
let parseString = require('xml2js').parseString;
let tradier_key = require('../config/tradier_key');

function getStockQuote(req, res){
    let ticker = req.params.ticker;

    //Setting URL and Header for request to retrieve stock quote from Tradier
    let options = {
        url: 'https://sandbox.tradier.com/v1/markets/quotes?symbols='+ticker,
        headers: {
            Authorization: tradier_key
        }
    };

    //Setting callback for request to retrieve stock quote from Tradier
    function callback(error, response, body){
        console.log('error:', error);
        if(error){
            res.status(500).send('Server error. Could not lookup stock quote');
            return;
        }
        console.log('statusCode:', response && response.statusCode);
        parseString(body, function(err, result) {
            console.log(JSON.stringify(result));
            if(result.quotes.unmatched_symbols){
                res.status(400).send('Please enter a valid stock, ETF, or index ticker');
            }
            else{
                let price = result.quotes.quote[0].last[0];
                res.status(200).send({
                   quote: price
                });
            }
        });
    }

    request(options, callback);
}

module.exports = { getStockQuote };