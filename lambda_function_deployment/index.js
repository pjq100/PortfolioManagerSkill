'use strict';

// Import statements
let request = require('request');
let parseString = require('xml2js').parseString;
let MongoClient = require('mongodb').MongoClient;
let AWS = require('aws-sdk');

// Decryption used
const kms = new AWS.KMS();

// Tradier authorization key
let tradier_key = 'Bearer O8gMEZFxvdrSOr2NRZ8PwyJwD7di';

// Key-value mapping of company names to tickers (because Alexa can't recognize tickers)
let ticker_map = {
    "shopify": "shop",
    "apple": "aapl",
    "tesla": "tsla"
};

let reverse_ticker_map = {
    "shop": "shopify",
    "aapl": "apple",
    "tsla": "tesla"
}

// MongoDB instance variables (for portfolio functionality)
let cachedDb = null;
let atlas_connection_uri = "";

// Helper Functions
function buildSpeechletResponse(outputText, shouldEndSession) {
	return{
		outputSpeech: {
			type: "PlainText",
			text: outputText
		},
		shouldEndSession: shouldEndSession
	}
}

function generateResponse(speechletResponse, sessionAttributes) {
	return{
		version: "1.0",
		sessionAttributes: sessionAttributes,
		response: speechletResponse
	}
}

function createPortfolio(user_id, context){
    if(cachedDb == null){
        MongoClient.connect(atlas_connection_uri, function(err, db){
            if(err){
                console.log(err);
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse("Error connecting to database. Please try again.", true),
                        {}
                    )
                )
            }
            else{
                cachedDb = db;
                return createPortfolioHelper(db, user_id, context);
            }
        });
    }
    else{
        return createPortfolioHelper(cachedDb, user_id, context);
    }
}

function createPortfolioHelper(db, user_id, context){
    db.collection('portfolios').insertOne({portfolio_id: user_id, stock_list: []}, function(err, result){
        if(err != null){
            console.log("An error occurred when trying to insert a portfolio into the database.");
            context.succeed(
                generateResponse(
                    buildSpeechletResponse("Error occured when trying to add your portfolio to the database. Please try again.", true),
                    {}
                )
            )
        }
        else{
                console.log("Portfolio successfully added to database.");
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse("Portfolio successfully added to the database.", true),
                        {}
                    )
                )
            }
        });
}

function getPortfolio(user_id, context){
    if(cachedDb == null){
        MongoClient.connect(atlas_connection_uri, function(err, db){
            if(err){
                console.log(err);
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse("Error connecting to database. Please try again.", true),
                        {}
                    )
                )
            }
            else{
                cachedDb = db;
                getPortfolioHelper(db, user_id, context);
            }
        });
    }
    else{
       getPortfolioHelper(cachedDb, user_id, context); 
    }
}

function getPortfolioHelper(db, user_id, context){
    db.collection('portfolios').findOne({portfolio_id: user_id}, function(err, portfolio){
        if(err){
            console.log(err);
            context.succeed(
                generateResponse(
                    buildSpeechletResponse("Error retrieving your portfolio from the database. Please try again.", true),
                    {}                                
                )
            )
        }
        else{
            let company_list = "Babe";
            if(portfolio.stock_list != []){
                for(let i=0; i < portfolio.stock_list; i++){
                    company_list += reverse_ticker_map[portfolio.stock_list[i].ticker];
                    company_list += " ";
                    company_list += portfolio.stock_list[i].quantity;
                    company_list += " shares ";
                }
            }
            context.succeed(
                generateResponse(
                    buildSpeechletResponse(`Here is a list of stocks in your portfolio ${company_list}`, true),
                    {}                                
                )
            )
        }
    })
}

function addStockToPortfolio(ticker, quantity, user_id, context){
    if(cachedDb == null){
        MongoClient.connect(atlas_connection_uri, function(err, db){
            if(err){
                console.log(err);
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse("Error connecting to database. Please try again.", true),
                        {}
                    )
                )
            }
            else{
                cachedDb = db;
                addStockToPortfolioHelper(db, ticker, quantity, user_id, context);
            }
        });
    }
    else{
       addStockToPortfolioHelper(cachedDb, ticker, quantity, user_id, context); 
    }
}

function addStockToPortfolioHelper(db, ticker, quantity, user_id, context){
    db.collection('portfolios').findOne({portfolio_id: user_id}, function(err, portfolio){
        if(err){
            console.log(err);
            context.succeed(
                generateResponse(
                    buildSpeechletResponse("Error adding the stock to your portfolio in the database. Please try again.", true),
                    {}
                )
            )
        }
        else{
            let present = false;
            let new_stock = {
                ticker: ticker,
                quantity: null,
                purchase_day: null,
                purchase_month: null,
                purchase_year: null
            };

            for (let i = 0; i < portfolio.stock_list.length; i++){
                if(portfolio.stock_list[i].ticker == ticker){
                    let old_stock_quantity = portfolio.stock_list[i].quantity;
                    new_stock.quantity = old_stock_quantity + quantity;
                    new_stock.purchase_day = portfolio.stock_list[i].purchase_day;
                    new_stock.purchase_month = portfolio.stock_list[i].purchase_month;
                    new_stock.purchase_year = portfolio.stock_list[i].purchase_year;
                    portfolio.stock_list.splice(i,1);
                    portfolio.stock_list.push(new_stock);
                    db.collection('portfolios').save(portfolio).then(function(){
                        present = true;
                        context.succeed(
                        generateResponse(
                            buildSpeechletResponse(`${quantity} shares of ${reverse_ticker_map[ticker]} added to your portfolio`, true),
                            {}
                        )
                    )
                    })
                }
            }

            // If the stock isn't already present in the portfolio
            if(!present) {
                let date = new Date();
                new_stock.quantity = quantity;
                new_stock.purchase_day = date.getDate();
                new_stock.purchase_month = date.getMonth() + 1;
                new_stock.purchase_year = date.getFullYear();
                portfolio.stock_list.push(new_stock);
                db.collection('portfolios').save(portfolio).then(function(){
                    present = true;
                    context.succeed(
                        generateResponse(
                            buildSpeechletResponse(`${quantity} shares of ${reverse_ticker_map[ticker]} added to your portfolio`, true),
                            {}
                        )
                    )
                })
           }
       }
    })
}

function removeStockFromPortfolio(ticker, quantity, user_id, context){
    if(cachedDb == null){
        MongoClient.connect(atlas_connection_uri, function(err, db){
            if(err){
                console.log(err);
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse("Error connecting to database. Please try again.", true),
                        {}
                    )
                )
            }
            else{
                cachedDb = db;
                removeStockFromPortfolioHelper(db, ticker, quantity, user_id, context);
            }
        });
    }
    else{
       removeStockFromPortfolioHelper(cachedDb, ticker, quantity, user_id, context); 
    }
}

function removeStockFromPortfolioHelper(db, ticker, quantity, user_id, context){
    db.collection('portfolios').findOne({portfolio_id: user_id}, function(err, portfolio){
        if(err){
            console.log(err);
            context.succeed(
                generateResponse(
                    buildSpeechletResponse("Error adding the stock to your portfolio in the database. Please try again.", true),
                    {}
                )
            )
        }
        else{
            let present = false;
            for (let i = 0; i < portfolio.stock_list.length; i++){
                if(portfolio.stock_list[i].ticker == ticker){
                    present = true;
                    if(portfolio.stock_list[i].quantity > quantity){
                        let new_stock = {
                            ticker: ticker,
                            quantity: null,
                            purchase_day: portfolio.stock_list[i].purchase_day,
                            purchase_month: portfolio.stock_list[i].purchase_month,
                            purchase_year: portfolio.stock_list[i].purchase_year
                        };

                        let old_stock_quantity = portfolio.stock_list[i].quantity;
                        new_stock.quantity = old_stock_quantity - quantity;
                        portfolio.stock_list.splice(i,1);
                        portfolio.stock_list.push(new_stock);
                        db.collection('portfolios').save(portfolio).then(function(){
                            context.succeed(
                                generateResponse(
                                    buildSpeechletResponse(`${quantity} shares of ${reverse_ticker_map[ticker]} removed from your portfolio`, true),
                                    {}
                                )
                            )
                        })
                    }
                    else{
                        portfolio.stock_list.splice(i,1);
                        db.collection('portfolios').save(portfolio).then(function(){
                            context.succeed(
                                generateResponse(
                                    buildSpeechletResponse(`${quantity} shares of ${reverse_ticker_map[ticker]} removed from your portfolio`, true),
                                    {}
                                )
                            )
                        })
                    }
                }
            }
            // Stock doesn't currently exist in the portfolio
            if (!present){
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse(`This stock is currently not in your portfolio.`, true),
                        {}
                    )
                )
            }
        }
    })
}

function calculatePortfolioPerformance(user_id, date, context){
    if(cachedDb == null){
        MongoClient.connect(atlas_connection_uri, function(err, db){
            if(err){
                console.log(err);
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse("Error connecting to database. Please try again.", true),
                        {}
                    )
                )
            }
            else{
                cachedDb = db;
                calculatePortfolioPerformanceHelper(db, user_id, date, context);
            }
        });
    }
    else{
       calculatePortfolioPerformanceHelper(cachedDb, user_id, date, context); 
    }
}

function calculatePortfolioPerformanceHelper(db, user_id, date, context){
     db.collection('portfolios').findOne({portfolio_id: user_id}, function(err, portfolio){
        if(err){
            console.log(err);
            context.succeed(
                generateResponse(
                    buildSpeechletResponse("Error adding the stock to your portfolio in the database. Please try again.", true),
                    {}
                )
            )
        }
        else{
            let count = 0;
            let original_prices = new Array(portfolio.stock_list.length);
            let original_value = 0;

            let year = date.substr(0,4);
            let month = date.substr(5,2);
            let day = date.substr(8,2);
            console.log("Date"+year+month+day);

            for(let i = 0; i < portfolio.stock_list.length; i++){
                let stock = portfolio.stock_list[i];
                let date_used = date;
                let month_used = stock.purchase_month;
                let day_used = stock.purchase_day;
                if(year < stock.purchase_year || (year >= stock.purchase_year && month < stock.purchase_month) || (year >= stock.purchase_year && month >= stock.purchase_month && day < stock.purchase_day)){
                    if(stock.purchase_month < 10){
                    month_used = "0" + month_used;
                    }
                    if(stock.purchase_day < 10){
                        day_used = "0" + day_used;
                    }
                    date_used = stock.purchase_year + "-" + month_used + "-" + day_used;
                }

                console.log("Date used"+date_used);

                let options = {
                    url: `https://sandbox.tradier.com/v1/markets/history?symbol=${stock.ticker}&start=${date_used}&end=${date_used}`,
                    headers: {
                        Authorization: tradier_key
                    }
                };

                function tradierCallback(error, response, body){
                    if(error){
                        context.succeed(
                            generateResponse(
                                buildSpeechletResponse("Error retrieving historical prices to calculate portfolio performance. Please try again.", true),
                                {}
                            )
                        )
                    }
                    else{
                        parseString(body, function(err, result){
                            original_prices[i] = parseFloat(result.history.day[0].close[0]);
                            count++;
                            if(count == portfolio.stock_list.length){
                                for(let j = 0; j < portfolio.stock_list.length; j++){
                                    original_value += original_prices[j] * portfolio.stock_list[j].quantity;
                                }
                                getPortfolioStockCurrentPrices(db, portfolio, date, original_value, context);
                            }
                        });
                    }
                }
                request(options, tradierCallback);
            }
        }
    })
}

function getPortfolioStockCurrentPrices(db, portfolio, date, original_value, context){
    let current_prices = new Array(portfolio.stock_list.length);
    let symbols = "";
    let new_value = 0;

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
            context.succeed(
                generateResponse(
                    buildSpeechletResponse("Error retrieving historical prices to calculate portfolio performance. Please try again.", true),
                    {}
                )
            )
        }
        else{
            parseString(body, function(err, result){
                for (let i=0; i < result.quotes.quote.length; i++){
                    current_prices[i] = parseFloat(result.quotes.quote[i].close[0]);
                }
                for(let i=0; i < portfolio.stock_list.length; i++){
                    new_value += current_prices[i] * portfolio.stock_list[i].quantity;
                }
                let performance = (((new_value - original_value) / original_value) * 100).toFixed(2);
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse(`Performance since ${date} is ${performance} percent`, true),
                        {}
                    )
                )
            });
        }
    }

    request(options, tradierCallback);
}

function getStockQuote(ticker, company, context) {
	let options = {
        url: 'https://sandbox.tradier.com/v1/markets/quotes?symbols='+ticker,
        headers: {
            Authorization: tradier_key
        }
    };

    function cb(error, response, body){
    	if(error){
    		context.succeed(
    			generateResponse(
    				buildSpeechletResponse("Error querying API to retrieve stock quote data. Please try again.", true),
    				{}
    			)
    		)
    	}
    	else{
    		parseString(body, function(err, result){
    			if(result.quotes.unmatched_symbols){
    				context.succeed(
    					generateResponse(
    						buildSpeechletResponse("You provided an invalid ticker. Please try again with a valid ticker.", true),
    						{}
    					)
    				)
    			}
    			else{
    				let price = result.quotes.quote[0].last[0];
    				context.succeed(
    					generateResponse(
    						buildSpeechletResponse(`${company} is trading at ${price}`, true),
    						{}
    					)
    				)
    			}
    		})
    	}
    }

    request(options, cb);
}

function getStockPricesForCorrelationCalculation(ticker1, ticker2, date, context) {
	let prices_1 = [];
    let prices_2 = [];
    let stock_1 = true;

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

    function tradierCallbackSwitch(err, response, body) {
    	if(err){
            context.succeed(
    			generateResponse(
    				buildSpeechletResponse("Error querying API to retrieve stock quote data. Please try again.", true),
    				{}
    			)
    		)
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

    function tradierCallback(body, stock_1) {
    	parseString(body, function(err, result){
            console.log("Result"+result);
    		if(result == null || !result.history.day){
    			context.succeed(
    				generateResponse(
    					buildSpeechletResponse("You provided an invalid ticker or date. Please try again with two valid tickers and a valid date in the past.", true),
    					{}
    				)
    			)
    		}
    		else if(stock_1){
    			for(let i = 0; i < result.history.day.length; i++){
                    prices_1.push(parseFloat(result.history.day[i].close[0]));
                }
    		}
    		else{
                for(let i = 0; i < result.history.day.length; i++){
                    prices_2.push(parseFloat(result.history.day[i].close[0]));
                }
                console.log("P1"+prices_1);
                console.log("P2"+prices_2);
                calculateStockCorrelation(prices_1, prices_2, context);
            }
    	})
    }

    request(options_1, tradierCallbackSwitch);
    request(options_2, tradierCallbackSwitch);
}

function calculateStockCorrelation(prices_1, prices_2, context) {
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

    console.log("Mean price 1" + mean_price_1);
    console.log("Mean price 2" + mean_price_2);


    let deviations_1 = prices_1;
    let deviations_2 = prices_2;
    for(let i = 0; i < deviations_1.length; i++){
        deviations_1[i] = mean_price_1 - deviations_1[i];
    }
    for(let i = 0; i < deviations_2.length; i++){
        deviations_2[i] = mean_price_2 - deviations_2[i];
    }

    console.log("Deviations 1" + deviations_1);
    console.log("Deviations 2" + deviations_2);

    let covariance_array = [];
    for(let i = 0; i < deviations_1.length; i++){
        covariance_array.push(deviations_1[i] * deviations_2[i]);
    }
    let covariance = covariance_array.reduce(getSum) / (deviations_1.length - 1);

    console.log("covariance array"+covariance_array);
    console.log("covariance"+covariance);

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

    console.log("Variance 1" + variance_1);
    console.log("Variance 2" + variance_2);


    let standard_deviation_1 = Math.sqrt(variance_1);
    let standard_deviation_2 = Math.sqrt(variance_2);

    let correlation = covariance / (standard_deviation_1 * standard_deviation_2);
    context.succeed(
    	generateResponse(
    		buildSpeechletResponse(`Correlation is ${(correlation).toFixed(3)}`, true),
    		{}
    	)
    )
}

function getSum(total, num) {
	return total + num;
}

try{
	exports.handler = function (event, context){
		context.callbackWaitsForEmptyEventLoop = false;

        // Need to decrypt Atlas Cluster URI Environmental Variable
        let encrypted_uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
        kms.decrypt({CiphertextBlob: new Buffer(encrypted_uri, 'base64')}, function(err, data){
            if(err){
                console.log("Decrypt error w/ Atlas Cluster URI: " + err);
                return;
            }
            else{
                atlas_connection_uri = data.Plaintext.toString('ascii');
                console.log(atlas_connection_uri);

                // New Session
                if (event.session.new){
                    console.log("New session");
                }

                switch (event.request.type){
                // Launch Request
                case "LaunchRequest":
                    console.log("Launch request");
                    break;

                // Intent Request
                case "IntentRequest":
                    console.log("Intent request");

                    switch(event.request.intent.name){
                        case "GetStockQuote":
                            let company = event.request.intent.slots.company.value.toLowerCase();
                            let ticker  = ticker_map[company];
                            getStockQuote(ticker, company, context);
                        break;

                        case "GetStockCorrelation":
                            let company_1 = event.request.intent.slots.companyone.value.toLowerCase();
                            let company_2 = event.request.intent.slots.companytwo.value.toLowerCase();
                            let ticker_1 = ticker_map[company_1];
                            let ticker_2 = ticker_map[company_2];
                            let date = event.request.intent.slots.date.value;
                            getStockPricesForCorrelationCalculation(ticker_1, ticker_2, date, context);
                        break;

                        case "CreatePortfolio":
                            createPortfolio(event.session.user.userId, context);
                        break;

                        case "GetPortfolio":
                            getPortfolio(event.session.user.userId, context);
                        break;

                        case "AddStockToPortfolio":
                            let quantity = parseInt(event.request.intent.slots.sharenumber.value);
                            let company_name = event.request.intent.slots.company.value.toLowerCase();
                            let stock_ticker = ticker_map[company_name];
                            addStockToPortfolio(stock_ticker, quantity, event.session.user.userId, context)
                        break;

                        case "RemoveStockFromPortfolio":
                            let quantity_removed = parseInt(event.request.intent.slots.sharenumber.value);
                            let company_name_removed = event.request.intent.slots.company.value.toLowerCase();
                            let stock_ticker_removed = ticker_map[company_name_removed]; 
                            removeStockFromPortfolio(stock_ticker_removed, quantity_removed, event.session.user.userId, context)
                        break;

                        case "GetPortfolioPerformance":
                            let date_performance = event.request.intent.slots.date.value;
                            if(date_performance.length != 10){
                                context.succeed(
                                    generateResponse(
                                        buildSpeechletResponse(`This skill currently only supports specific dates.  Please say a full date (day, month, and year).`, true),
                                        {}
                                    )
                                ) 
                            }
                            calculatePortfolioPerformance(event.session.user.userId, date_performance, context);
                        break;
                    }
                break;

                // Session Ended Request
                case "SessionEndedRequest":
                    console.log("Session ended request");
                break;

                default:
                    context.fail(`Invalid request type ${event.request.type}`); 
                }
            }
        });
	}
}catch(error){
	context.fail(`Exception: ${error}`);
}