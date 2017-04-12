/**
 * Created by Peter on 4/11/17.
 */

let mongoose = require('mongoose');

let portfolio_schema = new mongoose.Schema({
    portfolio_id: {type: String, unique: true, required: true},
    stock_list: {type: Array, default: [] },
    stock_quantities: {type: Array, default: []}
});

let portfolio_model = mongoose.model('Portfolio', portfolio_schema);

function createPortfolio(portfolio_id, cb){
    let portfolio = new portfolio_model({
        portfolio_id: portfolio_id,
        stock_list: [],
        stock_quantities: []
    });

    portfolio.save(function(err){
        if(err){
            console.log(err);
        }
        cb(portfolio);
    });
}

function getPortfolio(portfolio_id, cb){
    portfolio_model.findOne({portfolio_id: portfolio_id}, function(err, portfolio){
        if(err){
            console.log(err);
        }
        cb(portfolio);
    })
}

function addStock(portfolio_id, ticker, quantity, cb){
    portfolio_model.findOne({portfolio_id: portfolio_id}, function(err, portfolio){
        if(err){
            console.log(err);
            cb(null);
        }
        else{
            let index = portfolio.stock_list.indexOf(ticker);
            if(index == -1){
                portfolio_model.findOneAndUpdate(
                    {portfolio_id: portfolio_id},
                    {$push: {stock_list: ticker, stock_quantities: quantity}},
                    {new: true, upsert: true, safe: true}, function(err, portfolio){
                       console.log(err);
                       cb(portfolio, false);
                    });

            }
            else{
                let update = {};
                update['stock_quantities.'+index] = quantity;
                portfolio_model.findOneAndUpdate(
                    {portfolio_id: portfolio_id},
                    {$inc: update},
                    {new: true, upsert: true, safe: true}, function(err, portfolio){
                        console.log(err);
                        cb(portfolio, true);
                 });
            }
        }
    });
}

function removeStock(portfolio_id, ticker, quantity, cb){
    portfolio_model.findOne({portfolio_id: portfolio_id}, function(err, portfolio){
       if(err){
           console.log(err);
           cb(null, false);
       }
       else{
           let index = portfolio.stock_list.indexOf(ticker);
           if(index==-1){
               cb(portfolio, false, false);
           }
           else if(quantity < portfolio.stock_quantities[index]){
               let update = {};
               update['stock_quantities.'+index] = quantity * -1;
               portfolio_model.findOneAndUpdate(
                   {portfolio_id: portfolio_id},
                   {$inc: update},
                   {new: true, upsert: true, safe: true}, function(err, portfolio) {
                       console.log(err);
                       cb(portfolio, true, false);
               });
           }
           else{
               let update = {};
               update['stock_quantities.'+index] = null;
               portfolio.update({$set: update});
               portfolio_model.findOneAndUpdate(
                   {portfolio_id: portfolio_id},
                   {$pull: {stock_list: ticker, stock_quantities: null}},
                   {new: true, safe: true},
                   function(err, portfolio){
                       if(err){
                           console.log(err);
                       }
                       cb(portfolio, true, true);
               });
           }
       }
    });
}

module.exports = { createPortfolio, getPortfolio, addStock, removeStock };