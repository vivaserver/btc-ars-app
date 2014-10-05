var Ripio = function() {
  var conf = {
    quote: function(data, use_data_time) {  // needed to cache/parse exchanger quotes
      var data_time = new Date();  // "2014-07-09T17:13:34.553Z"
      if ((data || {}).base && (data || {}).rates) {
        if (use_data_time) {  // force expired date
          data_time = new Date(data_time.getFullYear(),data_time.getMonth(),data_time.getDate()-1);
        }
        return {
          buy: {
            usd:  data.rates.USD_BUY,
            ars:  data.rates.ARS_BUY,
            time: data_time
          },
          sell: {
            usd:  data.rates.USD_SELL,
            ars:  data.rates.ARS_SELL,
            time: data_time
          },
          created_at: data_time
        };
      }
      else {
        return false;
      }
    },
    cache: "/javascripts/exchange/cache/ripio.json",
    name: "ripio",
    URI: "https://www.ripio.com/api/v1/rates/"
  };

  return exchangeable(conf);
};
