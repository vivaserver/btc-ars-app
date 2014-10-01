var ConectaBitcoin = function() {
  var conf = {
    quote: function(data, use_data_time) {  // needed to cache/parse exchanger quotes
      var data_time = new Date();
      if ((data || {}).btc_usd && (data || {}).btc_ars) {
        if (use_data_time) {  // force expired date
          data_time = new Date(data_time.getFullYear(),data_time.getMonth(),data_time.getDate()-1);
        }
        data_time = data_time.toJSON();

        return {
          buy: {
            usd:  data.btc_usd.buy,
            ars:  data.btc_ars.buy,
            time: data_time
          },
          sell: {
            usd:  data.btc_usd.sell,
            ars:  data.btc_ars.sell,
            time: data_time
          },
          // blue: usd_ars.sell/usd_ars.buy
          created_at: data_time  // "2014-07-09T17:13:34.553Z"
        };
      }
      else {
        return false;
      }
    },
    cache: "/javascripts/cache.conectabitcoin.json",
    name: "conectabitcoin",
    URI: "https://conectabitcoin.com/es/market_prices.json"
  };

  return exchangeable(conf);
};
