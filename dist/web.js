'use strict';

var _templateObject = _taggedTemplateLiteral(['\n              ', ' - ', '\n\n              ', '\n\n              ', '\n              ', '\n              '], ['\n              ', ' - ', '\n\n              ', '\n\n              ', '\n              ', '\n              ']),
    _templateObject2 = _taggedTemplateLiteral(['\n              ', '\n\n              ', '\n\n              ', '\n\n              ', '\n\n              ', '\n              '], ['\n              ', '\n\n              ', '\n\n              ', '\n\n              ', '\n\n              ', '\n              ']),
    _templateObject3 = _taggedTemplateLiteral(['\n            Tempo para ', ' em 6 horas : ', '\n            Temperatura : ', ' \xB0C\n            Umidade: ', '%'], ['\n            Tempo para ', ' em 6 horas : ', '\n            Temperatura : ', ' \xB0C\n            Umidade: ', '%']);

var _bot = require('../dist/bot');

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

/* eslint no-var : off */
/* eslint quotes : off */
/* eslint quote-props : off */
/* eslint func-names : off */
/* eslint prefer-arrow-callback : off */

var express = require('express');
var path = require('path');
var packageInfo = require('../package.json');
var bodyParser = require('body-parser');
var http = require('http');

var _require = require('url'),
    URL = _require.URL;

var axios = require('axios');
var dedent = require('dedent-js');
var wdk = require('wikidata-sdk');

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

  console.log('AA ', Object.keys(search).toString());

  switch (Object.keys(search).toString()) {
    case 'any':

      var urlxx = wdk.searchEntities({
        search: search['any'],
        format: 'json',
        language: 'pt',
        limit: '3',
        uselang: 'pt'
      });

      var urlxxa = wdk.getWikidataIdsFromWikipediaTitles({
        titles: search['any'],
        sites: 'ptwiki',
        languages: ['pt'],
        props: ['info', 'claims'],
        format: 'json'
      });

      console.log(urlxxa, urlxx);

      var api_url = 'http://api.duckduckgo.com/?format=json&skip_disambig=1&no_html=1&no_redirect=1&t=cracoviansbot&pretty=1';
      var reqUrl = api_url + '&q=' + search['any'];
      console.log(reqUrl);
      axios.get(reqUrl, { responseType: 'json' }).then(function (response) {
        var dataToSend = void 0;
        if (response.status === 200) {
          if (response.data.AbstractText !== '') {
            dataToSend = dedent(_templateObject, response.data.Heading, response.data.Entity, response.data.AbstractText, response.data.AbstractSource, response.data.Image);
          } else {
            dataToSend = dedent(_templateObject2, response.data.Heading, response.data.RelatedTopics[0].Text, response.data.RelatedTopics[1] ? response.data.RelatedTopics[1].Text : '', response.data.RelatedTopics[2] ? response.data.RelatedTopics[2].Text : '', response.data.Image);
          }

          return res.json({
            "fulfillmentText": dataToSend,
            "fulfillmentMessages": [{
              "text": {
                "text": [dataToSend]
              }
            }],
            "source": "duckduckgo"
          });
        }
      }).catch(function (error) {
        return res.json({
          "fulfillmentText": 'Não consegui entender, pode especificar melhor ?',
          "fulfillmentMessages": [{
            "text": {
              "text": ['Não consegui entender, pode especificar melhor ?']
            }
          }],
          "source": "weather"
        });
      });
      break;
    case 'geo-city':
      console.log('BB ', search['geo-city']);

      var api_url = 'http://api.openweathermap.org/data/2.5/forecast?cnt=2&units=metric&lang=pt&appid=' + process.env.WEATHER_API;
      var reqUrl = new URL(api_url + '&q=' + search['geo-city']);

      http.get(reqUrl, function (responseFromAPI) {
        responseFromAPI.on('data', function (chunk) {
          var weather = JSON.parse(chunk);
          var dataToSend = weather.cod === '200' ? dedent(_templateObject3, weather.city.name, weather.list[1].weather[0].description, weather.list[1].main.temp, weather.list[1].main.humidity) : 'Não consegui entender a cidade, pode especificar melhor ?';

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
        var ermsg = 'N\xE3o consegui entender a cidade, pode especificar melhor ?';
        return res.json({
          "fulfillmentText": ermsg,
          "fulfillmentMessages": [{
            "text": {
              "text": [ermsg]
            }
          }],
          "source": "weather"
        });
      });
      break;
    default:
      console.log('ahá');
  }
});

var port = process.env.PORT || 8080;
var server = app.listen(port, function () {
  var host = server.address().address;
  var por = server.address().port;

  console.log('Web server started at http://' + host + ':' + por);
});