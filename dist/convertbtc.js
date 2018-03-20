'use strict';

var _util = require('util');

var request = require('request');

function cBtc() {
  var cripto = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'BTC';
  var currency = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'BRL';
  var amount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

  return new Promise(function (resolve, reject) {
    var url = 'https://apiv2.bitcoinaverage.com/convert/global?from=' + cripto + '&to=' + currency + '&amount=' + amount;
    request(url, function (error, response, body) {
      if (body.length > 70) {
        var apiResponse = JSON.parse(body);
        resolve(amount + ' ' + cripto + '  =  ' + apiResponse.price.toLocaleString('pt-BR', { style: 'currency', currency: '' + currency }));
      } else {
        resolve('Erro:  ' + body);
      }
    });
  });
}

module.exports = cBtc;