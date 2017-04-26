/**
 * Created by Peter on 4/11/17.
 */

let request = require('request');
let parseString = require('xml2js').parseString;
let portfolio_helpers = require('../helpers/portfolio');
let portfolio_model = require('../models/portfolio');
let tradier_key = require('../config/tradier_key');


function createPortfolio(req, res){
    let portfolio_id = req.params.id;
    console.log("Inside create portfolio");
    portfolio_model.createPortfolio(portfolio_id, function(portfolio){
        if(!portfolio){
           res.status(500).send('Server error. Portfolio not created')
        }
        else{
            res.status(201).send();
        }
    });
}

function getPortfolio(req, res){
    let portfolio_id = req.params.id;
    portfolio_model.getPortfolio(portfolio_id, function(portfolio){
        if(!portfolio){
            res.status(404).send('Could not find existing portfolio with specified ID');
        }
        else{
            res.render('portfolio', {
                portfolio: portfolio
            });
        }
    })
}

function addStockToPortfolio(req, res){
    let portfolio_id = req.params.id;
    let ticker = req.params.ticker;
    let quantity = parseInt(req.body.quantity);

    if(isNaN(quantity)){
        res.status(400).send("Client error. Please enter a valid number");
        return;
    }

    //Setting URL and Header for request to see if ticker entered is a valid ticker
    let options = {
      url: 'https://sandbox.tradier.com/v1/markets/lookup?q='+ticker,
      headers: {
          Authorization: tradier_key
      }
    };

    //Setting callback for request to see if ticker entered is a valid ticker and to add it to portfolio if it is
    function callback(error, response, body){
        console.log('error:', error);
        if(error){
            res.status(500).send('Server error. Stock not added to your portfolio');
            return;
        }
        console.log('statusCode:', response && response.statusCode);
        parseString(body, function(err, result){
           console.log(JSON.stringify(result));

            if(!result.securities.security){
                res.status(400).send("Please enter a valid stock, ETF, or index ticker");
            }
            else{
                portfolio_model.addStock(portfolio_id, ticker, quantity, function(portfolio, update, index){
                    console.log("INDEX"+index);
                    if(portfolio){
                        console.log(portfolio);
                        res.status(201).send({
                            ticker: ticker,
                            quantity: portfolio.stock_list[index].quantity,
                            update: update
                        });
                    }
                    else{
                        res.status(500).send('Server error. Stock not added to your portfolio');
                    }
                })
            }

        });
    }

    request(options, callback);
}

function removeStockFromPortfolio(req, res){
    let portfolio_id = req.params.id;
    let ticker = req.params.ticker;
    let quantity = parseInt(req.body.quantity);

    if(isNaN(quantity)){
        res.status(400).send("Client error. Please enter a valid number");
        return;
    }

    portfolio_model.removeStock(portfolio_id, ticker, quantity, function(portfolio, removal_performed, deleted, index){
        if(portfolio){
            if(removal_performed){
                if(index > -1){
                    res.status(201).send({
                        ticker: ticker,
                        quantity: portfolio.stock_list[index].quantity,
                        deleted: deleted
                    })
                }
                else{
                    res.status(201).send({
                        ticker: ticker,
                        deleted: deleted
                    })
                }
            }
            else{
                res.status(400).send("Client error.  Requested removal of a stock not in your portfolio")
            }
        }
        else{
            res.status(500).send('Server error. Stock not removed from your portfolio');
        }
    });
}

function getPortfolioPerformance(req, res){
    let portfolio_id = req.params.id;
    let time = parseInt(req.params.time);

    if(isNaN(time)){
        res.status(400).send("Client error. Please enter a valid number of days");
        return;
    }

    portfolio_model.getPortfolio(portfolio_id, function(portfolio){
        if(!portfolio){
            res.status(404).send('Could not find existing portfolio with specified ID');
        }
        else{
            function cb(performance){
                if(performance == false){
                    res.status(500).send('Server error. Could not calculate performance');

                }
                res.status(200).send({
                    performace: performance
                });
            }
            portfolio_helpers.calculatePortfolioPerformance(portfolio, time, cb);
        }
    });
}

function getPortfolioVolatility(req, res){

}

module.exports = { createPortfolio, getPortfolio, addStockToPortfolio, removeStockFromPortfolio, getPortfolioPerformance, getPortfolioVolatility };