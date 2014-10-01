var CasaDeCambio = function() {
  var conf = {
    quote: function(data, use_data_time) {  // needed to cache/parse exchanger quotes
      var data_time = new Date();
      if ((data || {}).bid && (data || {}).ask) {
        if (use_data_time) {  // force expired date
          data_time = new Date(data_time.getFullYear(),data_time.getMonth(),data_time.getDate()-1);
        }
        return {
          buy: {
            ars:  data.ask,
            time: data_time
          },
          sell: {
            ars:  data.bid,
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
    cache: "/javascripts/exchange/cache/casadecambio.json",
    name: "casadecambio",
    URI: "https://www.casadecambiobtc.com/api/quotations/BTCARS"
  };

  return exchangeable(conf);
};
