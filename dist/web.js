'use strict';

var _bot = require('../dist/bot');

// certo é ./dist/bot

var express = require('express');
var path = require('path');
var packageInfo = require('../package.json');
var bodyParser = require('body-parser');
var http = require('http');

var _require = require('url'),
    URL = _require.URL;

var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../web')));

app.get('/api', function (req, res) {
  res.json({
    bdlen: (0, _bot.dataValues)().bddata.bomdia.length,
    giflen: (0, _bot.dataValues)().gifdata.ckdgif.length,
    gifvalidlen: (0, _bot.dataValues)().gifdata.newgif.length,
    bdc: (0, _bot.dataValues)().bdiadaycount,
    proxData: (0, _bot.dataProx)(),
    bdias: (0, _bot.dataValues)().bddata.latebdreceived
  });
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});

app.post('/webhook', function (req, res) {
  var search = req.body.queryResult.parameters;
  var api_url = 'http://api.openweathermap.org/data/2.5/forecast?cnt=2&units=metric&lang=pt&appid=' + process.env.WEATHER_API;
  var reqUrl = new URL(api_url + '&q=' + search['geo-city']);

  http.get(reqUrl, function (responseFromAPI) {
    responseFromAPI.on('data', function (chunk) {
      var weather = JSON.parse(chunk);
      var dataToSend = weather.cod === '200' ? 'Tempo para ' + weather.city.name + ' em 6 horas : ' + weather.list[1].weather[0].description + ', temperatura : ' + weather.list[1].main.temp + ' \xB0C, humidade: ' + weather.list[1].main.humidity + '%' : 'Não consegui entender a cidade, pode especificar melhor ?';

      return res.json({
        "fulfillmentText": dataToSend,
        "fulfillmentMessages": [{
          "text": {
            "text": [dataToSend]
          }
        }],
        "source": "weather"
      });
    });
  }, function (error) {
    return res.json({
      "fulfillmentText": 'Não consegui entender a cidade, pode especificar melhor ?',
      "fulfillmentMessages": [{
        "text": {
          "text": ['Não consegui entender a cidade, pode especificar melhor ?']
        }
      }],
      "source": "weather"
    });
  });
});

var port = process.env.PORT || 8080;
var server = app.listen(port, function () {
  var host = server.address().address;
  var por = server.address().port;

  console.log('Web server started at http://' + host + ':' + por);
});