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
                   portfolio.save();
                   cb(portfolio, true, portfolio.stock_list.length - 1);
                   present = true;
                   break;
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
               portfolio.save();
               cb(portfolio, false, portfolio.stock_list.length - 1);
           }
       }
    });
}

function removeStock(portfolio_id, ticker, quantity, cb){
    portfolio_model.findOne({portfolio_id: portfolio_id}, function(err, portfolio){
        if(err){
            console.log(err);
            cb(null);
        }
        else{
            let present = false;
            for (let i = 0; i < portfolio.stock_list.length; i++){
                if(portfolio.stock_list[i].ticker == ticker){
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
                        portfolio.save();
                        cb(portfolio, true, false, i);
                        present = true;
                        return;
                    }
                    else{
                        portfolio.stock_list.splice(i,1);
                        portfolio.save();
                        cb(portfolio, true, true, -1);
                        present = true;
                        return;
                    }
                }
            }

            // Stock doesn't currently exist in the portfolio
            if(!present){
                cb(portfolio, false, false);
            }
        }
    });
}

/*
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
*/
module.exports = { createPortfolio, getPortfolio, addStock, removeStock };