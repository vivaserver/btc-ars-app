//! version : 0.1.9
//! authors : Cristian R. Arroyo <cristian.arroyo@vivaserver.com>
//! license : MIT
//! btc-ars.enmicelu.com

var $el, exchange, cache_timeout = 10;  // in minutes

var exchangeable = function(exchange) {
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
};

var app = function() {
  var HomeView = function() {
    var $buy, $sell, $time;

    var renderQuotes = function() {
      exchange.previous(function(cache) {
        var current = {buy: {}, sell: {}}, previous = {buy: {}, sell: {}};
        if (!!cache) {
          previous = cache;
        }
        exchange.current(function(cache) {
          if (!!cache) {
            current = cache;
            renderQuote($buy,  cache.created_at, current.buy,  previous.buy);
            renderQuote($sell, cache.created_at, current.sell, previous.sell);
            renderSpread($buy, current);
            renderSpread($sell,current);
          }
          else {
            // no current cache stored, fallback to static .json
            // and force update on expired bundled data time
            exchange.updateFromLocal();
          }
        });
      });
    };

    var toString = function(value) {
      return numeral(value).format("0,0.00");  // format according to numeral.language()
    };

    var renderSpread = function($quote, quote) {
      if (quote.buy.usd && quote.sell.usd) {
        numeral.language("en");
        $quote.find(".spread-usd").text(toString(Math.abs(quote.buy.usd-quote.sell.usd))+" ↔");
      }
      else {
        $quote.find(".spread-usd").text("");
      }
      if (quote.buy.ars && quote.sell.ars) {
        numeral.language("es");
        $quote.find(".spread-ars").text(toString(Math.abs(quote.buy.ars-quote.sell.ars))+" ↔");
      }
      else {
        $quote.find(".spread-ars").text("");
      }
    };

    var clearDelta = function($id) {
      $id.removeClass("badge-negative").removeClass("badge-positive").text("").hide();
    };

    var renderDelta = function($id, current, previous) {
      clearDelta($id);
      if (current && previous) {
        switch (true) {  // ref. http://stackoverflow.com/a/21808629
          case (previous > current):
            $id.addClass("badge-negative").show().text(toString(previous-current)+" ↓");
          break;
          case (previous < current):
            $id.addClass("badge-positive").show().text(toString(current-previous)+" ↑");
          break;
          default:
            $id.show().text("=");
          break;
        }
      }
    };

    var renderQuote = function($id, created_at, current, previous) {
      var time = moment(created_at), blue = exchange.blue(current);

      // USD
      if (current.usd) {
        numeral.language("en");
        $id.find(".usd").text(toString(current.usd));
        renderDelta($id.find(".delta-usd"),current.usd,previous.usd);
      }
      else {
        $id.find(".usd").text("");
        clearDelta($id.find(".delta-usd"));
      }

      // ARS
      if (current.ars) {
        numeral.language("es");
        $id.find(".ars").text(toString(current.ars));
        renderDelta($id.find(".delta-ars"),current.ars,previous.ars);
      }
      else {
        $id.find(".ars").text("");
        clearDelta($id.find(".delta-ars"));
      }

      // dolar blue
      if (blue) {
        $id.find(".blue").text(toString(blue)+" x USD");
      }
      else {
        $id.find(".blue").text("");
      }

      // "30/6/214 (hace 3 días)"
      $time.removeClass("error");
      $time.data("time",created_at);
      $time.text(time.format("l")+" ("+time.fromNow()+")");
    };

    return {
      init: function() {  // closure $el
        var that = this;
        $buy  = $el.find("#buy");
        $sell = $el.find("#sell");
        $time = $el.find("#time");
        $el.on("data:change",function(el) {
          that.error(false);
          that.render();
        });
        $el.on("data:error",function(el) {
          that.error(true);
        });
      },
      error: function(truthy) {
        var time;
        if (truthy) {
          time = moment($time.data("time"));
          $time.text(time.format("l")+" ("+time.fromNow()+")");
          $time.addClass("error");
        }
        else {
          $time.removeClass("error");
        }
      },
      render: function() {
        renderQuotes();
      }
    };
  }();

  var ExchangerSelectView = function() {
    return {
      // ref. https://github.com/twbs/ratchet/issues/625
      init: function() {  // closure $el
        var exchanger;
        $el.find(".popover li").bind("touchend",function(e) {
          exchanger = $(this).attr("id");
          console.log(exchanger);
          // trigger only on exchange update
          if (exchanger !== exchange.name) {
            $el.find(".backdrop").trigger("touchend");
            $el.find("nav #exchanger").text(exchanger);
            // closure exchange
            switch (exchanger) {
              case "casadecambio":
                exchange = CasaDeCambio();
              break;
              case "conectabitcoin":
                exchange = ConectaBitcoin();
              break;
              case "digicoins":
                exchange = DigiCoins();
              break;
              case "ripio":
                exchange = Ripio();
              break;
            }
            $el.trigger("data:change");
          }
          e.preventDefault();
        });
      }
    };
  }();

  return {
    init: function(elem) {
      localforage.setDriver("localStorageWrapper");
      moment.lang("es");

      $el = $(elem || "body");
      exchange = CasaDeCambio();  // TODO: get from localforage

      HomeView.init();
      HomeView.render();
      //
      ExchangerSelectView.init();

      // force first update
      exchange.update();
      // schedule all next
      setInterval(function() {
        exchange.update();
      },cache_timeout*60*1000);  // cache_timeout in miliseconds
    }
  };
}();

$(document).ready(function() {
  app.init();
});
