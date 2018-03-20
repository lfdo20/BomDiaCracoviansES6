import { dataProx, dataValues } from '../dist/bot'; // certo é ./dist/bot

var express = require('express');
var path = require('path');
var packageInfo = require('../package.json');


var app = express();

app.use(express.static(path.join(__dirname, '../web')));

app.get('/api/length', function (req, res) {
  res.json({
    bdlen: dataValues().bddata.bomdia.length,
    giflen: dataValues().gifdata.ckdgif.length,
    gifvalidlen: dataValues().gifdata.newgif.length,
    bdc: dataValues().bdiadaycount,
    proxData: dataProx()
  });
});

app.get('/api/bdias', function (req, res) {
  res.json({
    bdias: dataValues().bddata.latebdreceived,
  });
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});


var port = process.env.PORT || 8080;
var server = app.listen(port, function () {
  var host = server.address().address;
  var por = server.address().port;

  console.log(`Web server started at http://${host}:${por}`);
});
