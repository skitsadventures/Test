const express = require('express'); // This is to create a web server
const axios = require('axios'); // This is for making HTTP requests
const app = express(); // Creating an instance of express
const port = 3000;

app.set('view engine', 'ejs'); // EJS is set as the view engine
app.set('views', __dirname); // Set as the current directory

function findSimilarMarkets(chainEXData, valrDataArray) {    
    const chainEXMarkets = chainEXData.data.map(item => { // Extract markets from ChainEX data
        const marketComponents = item.market.split('/'); // This splits the string where ever it finds a "/" and places it inside the marketComponents array
        return marketComponents.join(''); // Concatentaes array elements into a single string
    });
    
    const valrMarkets = valrDataArray.map(item => item.currencyPair); // this iterates over each object and looks for the currencyPair field and gives it a value

    // Find common markets
    const commonMarkets = chainEXMarkets.filter(market =>
        valrMarkets.includes(market)
    );

    // Extract specific fields for each matched market
    const extractedData = commonMarkets.map(market => {
        const chainEXMatch = chainEXData.data.find(item => {
            const components = item.market.split('/');
            return components.join('') === market;
        });

        const valrMatch = valrDataArray.find(item => item.currencyPair === market);

        if (chainEXMatch && valrMatch) {
            // Extract specific fields for ChainEX and VALR. Can add more fields to work with if you'd like
            const chainEXFields = {
                last_price: chainEXMatch.last_price,
                top_bid: chainEXMatch.top_bid,
                top_ask: chainEXMatch.top_ask
            };

            const valrFields = {
                lastTradedPrice: valrMatch.lastTradedPrice,
                bidPrice: valrMatch.bidPrice,
                askPrice: valrMatch.askPrice
            };

            return { market, chainEXFields, valrFields };
        } else {
            return null; // If one of the matches is not found, return null
        }
    });

    // Remove any null entries (matches where one of the exchanges didn't have the required data)
    return extractedData.filter(match => match !== null);
}

// Function to fetch market summary data from ChainEX
// Uses axios
async function getChainEXMarketData() {
    try {
        const response = await axios.get('https://api.chainex.io/market/summary/');
        return response.data;
    } catch (error) {
        console.error('Error fetching ChainEX market data:', error.message);
        return null;
    }
}

// Function to fetch market summary data from VALR
// Uses axios
async function getVALRMarketData() {
    try {
        const response = await axios.get('https://api.valr.com/v1/public/marketsummary');
        return response.data;
    } catch (error) {
        console.error('Error fetching VALR market data:', error.message);
        return null;
    }
}

app.get('/', async (req, res) => {
    // Fetch market data from both exchanges
    const chainEXData = await getChainEXMarketData();
    const valrData = await getVALRMarketData();

    // Extract additional data for rendering
    const commonMarketsData = findSimilarMarkets(chainEXData, valrData);
    console.log("Common markets:", commonMarketsData);

    // Render the index.ejs file with the fetched data and calculated results
    res.render('index', { chainEXData, valrData, commonMarketsData });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
