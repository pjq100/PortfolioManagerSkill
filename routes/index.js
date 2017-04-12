var express = require('express');
var router = express.Router();
let portfolio_controller = require('../controllers/portfolio');
let stock_controller = require('../controllers/stock');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Portfolio Manager Skill' });
});

router.post('/portfolio/:id', portfolio_controller.createPortfolio);

router.get('/portfolio/:id', portfolio_controller.getPortfolio);

router.post('/portfolio/:id/stock/:ticker', portfolio_controller.addStockToPortfolio);

router.delete('/portfolio/:id/stock/:ticker', portfolio_controller.removeStockFromPortfolio);

router.get('/stock/:ticker', stock_controller.getStockQuote);

router.get('/portfolio/:id/performance/:time', function(req, res){

});

router.get('/portfolio/:id/correlation/:time', function(req, res){

});

router.get('/portfolio/:id/volatility/:time', function(req, res){

});

router.get('/portfolio/:id/index/:name/comparison/:time', function(req,res){

});

module.exports = router;