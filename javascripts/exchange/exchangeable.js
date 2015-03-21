module.exports = {
  init: function(exchange) {
    var backendURL = function() {
      return (window.location.port ? window.location.href : "http://btc-ars.herokuapp.com/") + "quote/";
    };

    var updateCache = function(data, use_data_time) {
      console.log(data);
      localforage.getItem(exchange.name,function(cache) {
        var quote, current, previous = {"previous":null};
        if (!!cache) {
          previous = {"previous":cache.current};
        }
        quote = exchange.quote(data,use_data_time);
        if (!!quote) {
          current = $.extend({"current":quote},previous);
          localforage.setItem(exchange.name,current,function() {
            $el.trigger("data:change");
          });
        }
        else {
          $el.trigger("data:error");
        }
      });
    };

    var updateFrom = function(uri, use_data_time) {
      // ask quotes via backend to avoid CORS; but mind cache files are stored locally
      var targetURI = uri.substring(0,4)==="http" ? backendURL()+uri : uri; 
      $.ajax({
        dataType: "json",
        type: "GET",
        url: targetURI, 
        success: function(data) {
          updateCache(data,use_data_time);
        },
        error: function(xhr, type) {
          console.log(type);  // "abort"
          $el.trigger("data:error");
        }
      });
    };

    var lapseExpired = function(cache) {
      var then  = moment(cache.created_at), now = moment();  // mind created_at
      var diff  = moment(now).diff(moment(then));
      var lapse = moment.duration(diff).asMinutes();
      return lapse;
    };

    return {
      current: function(callBack) {
        localforage.getItem(exchange.name,function(cache) {
          callBack(cache && cache.current ? cache.current : null);
        });
      },
      previous: function(callBack) {
        localforage.getItem(exchange.name,function(cache) {
          callBack(cache && cache.previous ? cache.previous : null);
        });
      },
      blue: function(quote) {
        if (!!quote && quote.ars && quote.usd) {
          return quote.ars/quote.usd;
        }
      },
      name: function() {
        return exchange.name;
      },
      update: function() {
        localforage.getItem(exchange.name,function(cache) {
          if (!cache || lapseExpired(cache.current) > cache_timeout-1) {
            updateFrom(exchange.URI);
          }
        });
      },
      updateFromLocal: function() {
        var use_data_time = true;
        localforage.removeItem(exchange.name,function() {
          updateFrom(exchange.cache,use_data_time);
        });
      }
    };
  }
};
