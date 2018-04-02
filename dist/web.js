'use strict';

var _bot = require('../dist/bot');

// certo é ./dist/bot

var express = require('express');
var path = require('path');
var packageInfo = require('../package.json');

var app = express();

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

var port = process.env.PORT || 8080;
var server = app.listen(port, function () {
  var host = server.address().address;
  var por = server.address().port;

  console.log('Web server started at http://' + host + ':' + por);
});