var exchangeable = require("./exchangeable");

var config = {
  quote: function(data, isCached) {  // needed to cache/parse exchanger quotes
    var updated_at = new Date();
    if ((data || {}).result == "ok") {  // ref. http://stackoverflow.com/a/19285523
      if (isCached) {  // force expired date
        updated_at = new Date(updated_at.getFullYear(),updated_at.getMonth(),updated_at.getDate()-1);
      }
      return {
        buy: {
          usd:  data["BTC/USD"].ask,
          ars:  data["BTC/ARS"].ask,
          time: updated_at
        },
        sell: {
          usd:  data["BTC/USD"].bid,
          ars:  data["BTC/ARS"].bid,
          time: updated_at
        },
        created_at: updated_at  // "2014-07-09T17:13:34.553Z"
      };
    }
    else {
      return false;
    }
  },
  cache: "/javascripts/exchange/cache/digicoins.json",
  name: "digicoins",
  URI: "https://digicoins.tk/ajax/tickers"
};

module.exports = exchangeable.init(config);
