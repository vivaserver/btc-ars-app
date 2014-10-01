var DigiCoins = function() {
  var conf = {
    quote: function(data, use_data_time) {  // needed to cache/parse exchanger quotes
      if ((data || {}).result == "OK") {  // ref. http://stackoverflow.com/a/19285523
        return {
          buy: {
            usd:  data.btcusdask,
            ars:  data.btcarsask,
            time: data.quotestime
          },
          sell: {
            usd:  data.btcusdbid,
            ars:  data.btcarsbid,
            time: data.quotestime
          },
          created_at: (use_data_time === true) ? data.pricestime.replace(" ","T").substr(0,23)+"Z" : new Date().toJSON()  // always like "2014-07-09T17:13:34.553Z"
        };
      }
      else {
        return false;
      }
    },
    cache: "/javascripts/exchange/cache/digicoins.json",
    name: "digicoins",
    URI: "https://digicoins.tk/ajax/get_prices"
  };

  return exchangeable(conf);
};
