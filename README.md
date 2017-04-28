# PortfolioManagerSkill

This is an Alexa skill/web service that allows a user to monitor their stock portfolio performance using an Echo device (or by going to a website that hosts the service).

The Alexa commands are as follows:

Create Portfolio: creates a portfolio to which you can add stocks

Get My Portfolio: reads a list of stock tickers/quantities currently in your portfolio

Add {sharenumber} Of {company name} To My Portfolio: Adds the specified quantity of the specified stock to your portfolio.

Remove {sharenumber} Of {company name} From My Portfolio: Removes the specified quantity of the specified stock from your portfolio.

Get Portfolio Performance Since {date}: Returns your portfolio performance since the specified date (based on the quantity of each stock currently in your portfolio) Note: if you provide a date earlier than the date at which you added a specific stock to your portfolio then performance for that stock is calculated from the add date NOT the specified date.

Get Stock Quote For {company}: Returns the most recent close price for the specified stock

Get Correlation For {company1} And {company2} Since {date}: Returns the correlation between the two specified stocks from the specified date up until the current date.  This is useful for building a diversified portfolio.
