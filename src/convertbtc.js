import { log } from 'util';

const request = require('request');

function cBtc(cripto = 'BTC', currency = 'BRL', amount = 1) {
  return new Promise((resolve, reject) => {
    const url = `https://apiv2.bitcoinaverage.com/convert/global?from=${cripto}&to=${currency}&amount=${amount}`;
    request(url, (error, response, body) => {
      if (body.length > 70) {
        const apiResponse = JSON.parse(body);
        resolve(`${amount} ${cripto}  =  ${apiResponse.price.toLocaleString('pt-BR', { style: 'currency', currency: `${currency}` })}`);
      } else {
        resolve(`Erro:  ${body}`);
      }
    });
  });
}

module.exports = cBtc;
