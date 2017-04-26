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

router.get('/portfolio/:id/performance/:time', portfolio_controller.getPortfolioPerformance);

router.get('/portfolio/:id/volatility/:time', portfolio_controller.getPortfolioVolatility);

router.get('/stock/:ticker', stock_controller.getStockQuote);

router.get('/stock/volatility/:ticker1/:ticker2', stock_controller.getStockCorrelation);

module.exports = router;