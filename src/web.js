import { dataProx, dataValues } from '../dist/bot';
import dotenv from 'dotenv';

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
var { URL } = require('url');
var axios = require('axios');
var dedent = require('dedent-js');

dotenv.load();

var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../web')));

app.get('/api', function (req, res) {
  res.json({
    bdlen: dataValues().bddata.bomdia.length,
    giflen: dataValues().gifdata.ckdgif.length,
    gifvalidlen: dataValues().gifdata.newgif.length,
    bdc: dataValues().bdiadaycount,
    proxData: dataProx(),
    bdias: dataValues().bddata.latebdreceived,
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
      // var api_url = `http://api.duckduckgo.com/?format=json&skip_disambig=1&no_html=1&no_redirect=1&t=cracoviansbot&pretty=1`;
      var api_url = `https://kgsearch.googleapis.com/v1/entities:search?key=${process.env.GAPI_KEY}&limit=3&indent=True&languages=pt`;
      var reqUrl = `${api_url}&query=${search['any']}`;
      console.log(reqUrl);
      axios.get(reqUrl, { responseType: 'json' }).then((response) => {
        let dataToSend;
        const data = response.data.itemListElement;
        console.log(response.data.itemListElement);

        if (response.status === 200) {
          dataToSend =
            dedent`
            ${data[0].result.name}
            ${data[0].result.description}

            ${data[0].result.detailedDescription.articleBody}
            ${data[0].result.image.url}
            `;

          return res.json({
            "fulfillmentText": dataToSend,
            "fulfillmentMessages": [
              {
                "text": {
                  "text": [
                    dataToSend
                  ]
                }
              },
            ],
            "source": "duckduckgo",
          });
        }
      }).catch((error) => {
        return res.json({
          "fulfillmentText": 'Não consegui entender, pode especificar melhor ?',
          "fulfillmentMessages": [
            {
              "text": {
                "text": [
                  'Não consegui entender, pode especificar melhor ?'
                ]
              }
            }
          ],
          "source": "weather"
        });
      });
      break;
    case 'geo-city':
      console.log('BB ', search['geo-city']);

      var api_url = `http://api.openweathermap.org/data/2.5/forecast?cnt=2&units=metric&lang=pt&appid=${process.env.WEATHER_API}`;
      var reqUrl = new URL(`${api_url}&q=${search['geo-city']}`);

      http.get(reqUrl, (responseFromAPI) => {
        responseFromAPI.on('data', function (chunk) {
          let weather = JSON.parse(chunk);
          let dataToSend = weather.cod === '200' ?
            dedent`
            Tempo para ${weather.city.name} em 6 horas : ${weather.list[1].weather[0].description}
            Temperatura : ${weather.list[1].main.temp} °C
            Umidade: ${weather.list[1].main.humidity}%`
            : 'Não consegui entender a cidade, pode especificar melhor ?';

          return res.json({
            "fulfillmentText": dataToSend,
            "fulfillmentMessages": [
              {
                "text": {
                  "text": [
                    dataToSend
                  ]
                }
              }
            ],
            "source": "weather"
          });
        });
      }, (error) => {
        const ermsg = `Não consegui entender a cidade, pode especificar melhor ?`;
        return res.json({
          "fulfillmentText": ermsg,
          "fulfillmentMessages": [
            {
              "text": {
                "text": [
                  ermsg
                ]
              }
            },
          ],
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

  console.log(`Web server started at http://${host}:${por}`);
});
