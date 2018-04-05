'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dataValues = exports.dataProx = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _dropbox = require('dropbox');

var _dropbox2 = _interopRequireDefault(_dropbox);

var _twit = require('twit');

var _twit2 = _interopRequireDefault(_twit);

var _nodeTelegramBotApi = require('node-telegram-bot-api');

var _nodeTelegramBotApi2 = _interopRequireDefault(_nodeTelegramBotApi);

var _apiai = require('apiai');

var _apiai2 = _interopRequireDefault(_apiai);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _convertbtc = require('./convertbtc');

var _convertbtc2 = _interopRequireDefault(_convertbtc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// local enviroment variables
_dotenv2.default.load();

// Telegram api config
var bot = new _nodeTelegramBotApi2.default(process.env.BOT_TOKEN, { polling: true });

// Global Var
var bddata = {},
    newBdia = void 0,
    newbdv = void 0,
    newptv = void 0,
    newBdiaCount = 0,
    newgifCount = 0,
    rgifcount = 0,
    bdiadaycount = [[], [0, 0], 0, 0],
    nvloop = 0,
    silentUsers = void 0;

var dropfilesurl = [[process.env.DROP_DATA, 'bddata.json', 'bddata'], [process.env.DROP_GIF, 'gifdata.json', 'gifdata'], [process.env.DROP_NV, 'nvdata.json', 'nvdata']];

// [process.env.DROP_NV, 'nvdata.json', 'nvdata']
var gifdata = {
  newgif: [],
  ckdgif: [],
  lastgif: []
};

// Time config
var nowDay = function nowDay() {
  return (0, _moment2.default)().format('ddd');
};
var STime = function STime() {
  return (0, _moment2.default)('14:00', 'HHmm');
}; // 14:00
var ETime = function ETime() {
  return (0, _moment2.default)('23:59', 'HHmm');
}; // 23:59

// Dropbox Config
var dbx = new _dropbox2.default({
  key: process.env.DROPBOX_APP_KEY,
  secret: process.env.DROPBOX_APP_SECRET,
  accessToken: process.env.DROPBOX_TOKEN,
  sandbox: false
});

// Twitter Integration
var T = new _twit2.default({
  consumer_key: process.env.TWITTER_CONSUMER,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_TOKEN,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET,
  timeout_ms: 60 * 1000
});

var streamTwit = T.stream('user');
streamTwit.on('tweet', tweetReply);

// Dialogflow config
var dialogFlow = (0, _apiai2.default)(process.env.APIAI_TOKEN, { language: 'pt-BR' });
var diagflowSession = [];

// Seção de Notas

// IDEA: organizar como o bot será utilizado em vários grupos:
// arquivos diferentes ? mesclar bases de dados ?

// IDEA: json não trabalha com " " dá problema, tem que
// converter regex pra detectar : (.+)(')(.+)(')(.+)?

console.log('bot server started...');

function saveAllData(msg) {
  var saves = [[['bd', bddata], 'Data Salvo!', 200], [['gif', gifdata], 'Gifdata Salvo!', 2200], [['nv', bdiadaycount], 'Validação Salvo!', 3200]];
  saves.forEach(function (val) {
    setTimeout(function () {
      saveNewdata(val[0][0], val[0][1]);
      if (msg !== undefined) {
        bot.sendMessage(msg.chat.id, val[1]);
      }
    }, val[2]);
  });
}

process.on('SIGTERM', function () {
  console.log('Salvando dados e finalizando bot..');
  saveAllData();
  setTimeout(function () {
    process.exit(0);
  }, 7000);
});

// pega o arquivo no dropbox e transforma em objeto
function startRead() {
  dropfilesurl.forEach(function (id) {
    dbx.sharingGetSharedLinkFile({ url: id[0] }).then(function (data) {
      _fs2.default.writeFileSync(data.name, data.fileBinary, 'binary', function (err) {
        if (err) {
          throw err;
        }
      });
      if (id[2] === 'bddata') {
        bddata = JSON.parse(_fs2.default.readFileSync('./bddata.json', 'utf8'));
      } else if (id[2] === 'gifdata') {
        gifdata = JSON.parse(_fs2.default.readFileSync('./gifdata.json', 'utf8'));
      } else if (id[2] === 'nvdata') {
        bdiadaycount = JSON.parse(_fs2.default.readFileSync('./nvdata.json', 'utf8'));
        silentUsers = bdiadaycount[4];
      }
    }).catch(function (err) {
      throw err;
    });
  });
}
startRead();

/*

const { latebdreceived, latebdsay, bomdia, bdiasvar, pontosvar } = bddata;

const { ckdgif, newgif, lastgif, tumblrgif, tumblrlist } = gifdata;

*/

// bot.on('message', (msg) => {
// });

// comando para imagem do dia
bot.onText(/^\/bdcdia$|^\/bdcdia@bomdiacracobot$/, function (msg) {
  var text = 'https://www.dropbox.com/s/ty8b23y8qmcfa0y/bdcdia.jpg?raw=1';
  bot.sendPhoto(msg.chat.id, text).then(function () {});
});

// comando para ultimos recebidos
bot.onText(/^\/bdcultimos$|^\/bdcultimos@bomdiacracobot$/, function (msg) {
  var text = '' + bddata.latebdreceived.map(function (elem) {
    return '' + elem;
  }).join('\n');
  console.log(text);
  bot.sendMessage(msg.chat.id, text).then(function () {});
});

// comando para salvar arquivos
bot.onText(/^\/bdcsave$/, function (msg, match) {
  saveAllData(msg);
});

// comando para help
bot.onText(/^\/bdchelp$|^\/bdchelp@bomdiacracobot$/, function (msg) {
  var text = 'Bom dia!\n    Eu guardo toda a frase dita ap\xF3s "bom dia".\n    E respondo todos os bom dias com ou sem frases..\n    mas ainda n\xE3o entendo coisas loucas tipo "bu\xF3nday".\n\n    /bdcstatus - Ver a quantidades de bom dias no banco\n    /bdcadmin - Ver comandos de administra\xE7\xE3o\n    /bdcbtc - Ver cota\xE7\xE3o bitcoin. Formato: 1 BTC BRL\n    /bdcultimos - Ver os ultimos bom dias adicionados';
  bot.sendMessage(msg.chat.id, text).then(function () {});
});

bot.onText(/^\/bdcadmin\s(.+)$/, function (msg, match) {
  if (match[1] === process.env.ADM_PASS) {
    var text = '\n    Comandos de manuten\xE7\xE3o:\n\n    /bdcgifdup - Checar duplicidade de gifs.\n    /bdcnv - log de status N\xE3o Validar..\n    /bdccheck X - Checar e validar os gifs recebidos. (X = quantidade)\n    /bdcsave - Salvar todos os arquivos de dados.';
    bot.sendMessage(msg.chat.id, text).then(function () {});
  } else {
    var _text = 'Senha errada.';
    bot.sendMessage(msg.chat.id, _text).then(function () {});
  }
});

// buscar gif por id/tamanho duplicados e apresentar seus ids
var dupgifs = [];
var dgiftemp = void 0;
function itgifdup(msg) {
  if (dupgifs.length > 0) {
    bot.sendMessage(msg.chat.id, ' Duplicados : ' + dupgifs.length / 2);
    dupgifs[0].forEach(function (gf) {
      // console.log('oi4 : ', gf);
      dgiftemp = gf;
      bot.sendDocument(msg.chat.id, gf[0], {
        caption: gf[0].toString() + '  ' + gf[1].toString()
      });
    });
    bot.sendMessage(msg.chat.id, 'Aguardando...', {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        keyboard: [['proximo']],
        selective: true
      }
    });
    dupgifs.shift();
  } else {
    endkeyboard(msg);
  }
}

bot.onText(/^\/bdcgifdup$/gi, function (msg, match) {
  var _gifdata = gifdata,
      ckdgif = _gifdata.ckdgif,
      newgif = _gifdata.newgif,
      lastgif = _gifdata.lastgif,
      tumblrgif = _gifdata.tumblrgif,
      tumblrlist = _gifdata.tumblrlist;

  ckdgif.forEach(function (x) {
    var dupt = ckdgif.filter(function (y) {
      return y[0] === x[0] && y[1] === x[1];
    });
    if (dupt.length > 1) {
      dupgifs.push(dupt);
    }
  });
  console.log('Gifs Duplicados : ', dupgifs);
  itgifdup(msg);
});

// Recebimento de gifs putaria e contagem
bot.on('document', function (msg) {
  if (nowDay() === 'Fri') {
    // check is is Fri
    if (msg.document.mime_type === 'video/mp4') {
      // var gifthumb = 'https://api.telegram.org/file/bot'+token+'/'+msg.document.thumb.file_path;
      var newGf = [msg.document.file_id, msg.document.file_size.toString()];
      checkBdData(gifdata.newgif, newGf, 'gif');
      rgifcount += 1;
      console.log('Gif aleat\xF3rio contador: ' + rgifcount);
      if (rgifcount > 3) {
        if ((0, _moment2.default)().isBetween(STime(), ETime(), 'minute', '[]')) {
          randomGif(msg);
          rgifcount = 0;
        }
      }
    }
  }
});

// função para lembrar que vai acabar a putaria
var endputsaid = 0;
function putariaRemenber(msg, faltam) {
  if (faltam <= 60 && endputsaid === 0) {
    bot.sendMessage(msg.chat.id, 'Faltam ' + faltam + ' minutos para acabar a putaria! \uD83D\uDE2D\uD83D\uDE2D').then(function () {
      endputsaid = 2;
    });
  } else if (faltam <= 20 && endputsaid === 2) {
    bot.sendMessage(msg.chat.id, 'Faltam ' + faltam + ' minutos para acabar a putaria! \uD83D\uDE31\uD83D\uDE31').then(function () {
      endputsaid = 4;
    });
  } else if ((faltam <= 1 || faltam > 60) && endputsaid !== 0) {
    endputsaid = 0;
  }
}

// comando para gifd tumblrs teste
bot.onText(/^(pootaria)$/gi, function (msg, match) {
  randomGif(msg);
});

// comando para gifs putaria
function getGif() {
  var _gifdata2 = gifdata,
      ckdgif = _gifdata2.ckdgif,
      newgif = _gifdata2.newgif,
      lastgif = _gifdata2.lastgif,
      tumblrgif = _gifdata2.tumblrgif,
      tumblrlist = _gifdata2.tumblrlist;

  var cb = void 0;
  var gifrand = function gifrand() {
    return Math.floor(Math.random() * ckdgif.length).toString();
  };
  ckdgif.find(function (x) {
    var gifNum = gifrand();
    if (lastgif.every(function (y) {
      return y !== gifNum;
    })) {
      lastgif.shift();
      lastgif.push(gifNum.toString());
      cb = ckdgif[gifNum][0];
      console.log(cb);
    }
    return cb;
  });
  return cb;
}

var gftagrxdays = /^(p(u|o)+taria+)$/gi;
var gftagrxfri = /^(.+)?(p(u|o)+taria+)(.+)?$/gi;
var gftagrx = function gftagrx() {
  return nowDay() === 'Fri' ? gftagrxfri : gftagrxdays;
};

bot.onText(gftagrx(), function (msg) {
  if (nowDay() !== 'Fri') {
    // Correto é Fri
    bot.sendMessage(msg.chat.id, 'Hoje não é dia né. Tá achando que putaria é bagunça!?').then(function () {});
  } else if (!(0, _moment2.default)().isBetween(STime(), ETime(), 'minute', '[]')) {
    var timeS = _moment2.default.unix(msg.date);
    var faltam = Math.abs(timeS.diff(STime(), 'minute'));
    faltam = faltam > 60 ? Math.round(faltam / 60) + ' h e ' + faltam % 60 + ' min' : faltam + ' min';
    bot.sendMessage(msg.chat.id, 'Caaaaalma, faltam ' + faltam + ' para come\xE7ar a putaria!').then(function () {});
  } else {
    var gifId = getGif();
    if (gifId !== undefined) {
      bot.sendDocument(msg.chat.id, gifId).then(function () {
        newgifCount += 1;
        console.log('Contador gif: ' + newgifCount);
        rgifcount += 1;
        console.log('Contador gif random: ' + rgifcount);
        if (newgifCount >= 5) {
          saveNewdata('gif', gifdata);
          newgifCount = 0;
        }
      });
    }
  }
});

// função para putarias random tumblr
var ix = 0,
    uri = void 0;
var rgifrx = /(h\S+\.gif(?!\'\)))/gi;

// (\<img src\=\")(h\S+gif(?!\"\/\<br))("\/\>)/gi;
function randomGif(msg) {
  var _gifdata3 = gifdata,
      ckdgif = _gifdata3.ckdgif,
      newgif = _gifdata3.newgif,
      lastgif = _gifdata3.lastgif,
      tumblrgif = _gifdata3.tumblrgif,
      tumblrlist = _gifdata3.tumblrlist;
  // console.log(gifdata.tumblrgif.length);

  if (tumblrgif.length > 0) {
    bot.sendDocument(msg.chat.id, tumblrgif[0]).then(function () {
      tumblrgif.shift();
      rgifcount = 0;
    });
  } else if (tumblrgif.length === 0) {
    (function getlink() {
      uri = tumblrlist[ix][0].toString();
      (function getFeed() {
        return new Promise(function (resolve, reject) {
          (0, _request2.default)(uri, function (err, res, body) {
            if (err) {
              console.log(err);
            }
            body.replace(rgifrx, function (match, p1, p2) {
              tumblrgif.push(match);
            });

            bot.sendDocument(msg.chat.id, tumblrgif[0]).then(function () {
              tumblrgif.shift();
              rgifcount = 0;
              ix += 1;
              tumblrlist.pop();
              tumblrlist.push(ix.toString());
              saveNewdata('gif', gifdata);
            });
          });
        });
      })();
    })();
  }
}

// NOTE:  comando para salvar todos os thumbs de gifs
// var download = function(uri, filename, callback){
// request.head(uri, function(err, res, body){
//   console.log('content-type:', res.headers['content-type']);
//   console.log('content-length:', res.headers['content-length']);
//
//   request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
// });
// };
//
// download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
// console.log('done');
// });

// comandos para checar os gifs
var ckgfid = '',
    ckgfsize = '',
    ckgfthlink = '',
    checknum = 0;

var endkeyboard = function endkeyboard(msg) {
  saveNewdata('gif', gifdata);
  bot.sendMessage(msg.chat.id, 'Nada mais para validar..', {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      remove_keyboard: true,
      selective: true
    }
  });
};

var newgfcheck = function newgfcheck(msg) {
  console.log('ck', checknum, gifdata.newgif.length);

  if (gifdata.newgif.length > 0 && checknum > 1) {
    ckgfid = gifdata.newgif[0][0];
    var urigif = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/getFile?file_id=' + ckgfid;
    _request2.default.get(urigif, { json: true }, function (err, res, body) {
      ckgfsize = body.result.file_size;
      ckgfthlink = '';
    });
    var gifDuplicate = gifdata.ckdgif.find(function (el) {
      return el[0] === ckgfid;
    }) === undefined ? 'Não' : 'Sim';

    bot.sendDocument(msg.chat.id, ckgfid, {
      caption: 'Duplicado ? ' + gifDuplicate,
      reply_to_message_id: msg.message_id,
      reply_markup: {
        keyboard: [['👍 Sim', '👎 Não'], ['👈 Pular']],
        selective: true
      }
    }).then(function () {
      checknum -= 1;
    });
  }
  if (checknum === 1 || gifdata.newgif.length === 0) {
    endkeyboard(msg);
    checknum = 0;
  }
};

bot.onText(/^\/bdccheck(\s)(\d+)$/, function (msg, match) {
  checknum = Number(match[2]);
  checknum += 1;
  newgfcheck(msg);
});

// Dialogo interno do bot
function botDialog(msg, match) {
  if (diagflowSession.length === 0 || _moment2.default.unix(msg.date).isAfter(diagflowSession[1])) {
    diagflowSession[0] = (0, _v2.default)();
  }

  dialogFlow.language = 'pt-BR';
  var chatbot = dialogFlow.textRequest(msg.text, { lang: 'pt-BR', sessionId: diagflowSession[0] });
  chatbot.on('response', function (response) {
    var resMsg = response.result.fulfillment.speech;
    var msgTxt = resMsg.replace(/(http.+)/gim, '');
    var msgImg = resMsg.match(/(http.+)/gim);
    bot.sendMessage(msg.chat.id, msgTxt, { reply_to_message_id: msg.message_id }).then(function () {
      if (msgImg !== null) {
        bot.sendMessage(msg.chat.id, msgImg[0], { reply_to_message_id: msg.message_id });
      }
      diagflowSession[1] = _moment2.default.unix(msg.date).add(15, 'minutes');
    });
  });

  chatbot.on('error', function (error) {
    console.log(error);
  });

  chatbot.end();
}

var dialogMatchRegx = /^(.+\s)?(@bomdiacracobot|bot|bote)(!|,|\.)?(\s.+)?$/gi;
bot.onText(dialogMatchRegx, function (msg, match) {
  botDialog(msg, match);
});

// comando para analisar várias mensagens recebidas e distribuir as funções
var putexec = false,
    putstartcheck = false,
    vcmsg = '';
bot.onText(/(.)?/gi, function (msg) {
  // mensagens de início / fim de hora da putaria
  if (nowDay() === 'Fri') {
    if (!putexec) {
      var timeS = _moment2.default.unix(msg.date).format('HH');
      if (timeS === '23') {
        var timeN = _moment2.default.unix(msg.date);
        var faltam = Math.abs(timeN.diff(ETime(), 'minute'));
        putariaRemenber(msg, faltam);
      } else if (timeS === '13') {
        // 13
        var _timeN = _moment2.default.unix(msg.date);
        var _faltam = _timeN.diff((0, _moment2.default)('14:00', 'HHmm'), 'minute') * -1;
        console.log('Falta para começar a putaria: ', _faltam);
        if (_faltam < 30 && _faltam > 0 && !putstartcheck) {
          putstartcheck = true;
          vcmsg = msg.chat.id;
          console.log(msg, vcmsg, timeS, _faltam);
          setTimeout(function () {
            bot.sendAudio(vcmsg, 'CQADAQADCgAD9MvIRuM_NpJIg6-YAg');
            setTimeout(function () {
              putstartcheck = false;
            }, 60000);
          }, _faltam * 60 * 1000);
        }
      }
      putexec = true;
      setTimeout(function () {
        putexec = false;
      }, 3000);
    }
  }

  var replychk = msg.hasOwnProperty('reply_to_message') && msg.reply_to_message.from.username === 'bomdiacracobot';
  var dialogMatch = msg.text.match(dialogMatchRegx);

  if (replychk) {
    if (dialogMatch !== null) {
      botDialog(msg, dialogMatch);
    } else {
      var match = msg.text.match(/(.+)/gi);
      botDialog(msg, match);
    }
  }

  // replies do keyboard de validação de gif
  var _gifdata4 = gifdata,
      ckdgif = _gifdata4.ckdgif,
      newgif = _gifdata4.newgif;

  if (checknum > 0) {
    var cks = '👍 sim';
    if (msg.text.toString().toLowerCase().indexOf(cks) === 0) {
      console.log('ok sim');
      newgif.shift();
      var temp = [ckgfid, ckgfsize.toString()];
      ckdgif.push(temp);
      newgfcheck(msg);
    }

    var ckn = '👎 não';
    if (msg.text.toString().toLowerCase().indexOf(ckn) === 0) {
      console.log('ok não');
      newgif.shift();
      newgfcheck(msg);
    }

    var ckr = '👈 pular';
    if (msg.text.toString().toLowerCase().indexOf(ckr) === 0) {
      console.log('ok pula');
      newgif.shift();
      newgif.push(ckgfid);
      newgfcheck(msg);
    }
  }

  // Mecanismo nada mais para validar ....
  var nvlog = function nvlog(faltam) {
    return '\n    Validar Zerar...\n    Validar Bdias: ' + bdiadaycount[0] + '\n    Validar Intervalo: ' + bdiadaycount[1] + '\n    Validar Regressiva: ' + bdiadaycount[2] + '\n    Minutos para liberar: ' + faltam + '\n    Pr\xF3xima Data: ' + bdiadaycount[3] + '\n  ';
  };

  if (msg.text.toString().toLowerCase() === 'bdcnv') {
    var _timeS = _moment2.default.unix(msg.date);
    bot.sendMessage(msg.chat.id, nvlog(_timeS.diff(bdiadaycount[1][1], 'minute')));
  }

  var validDate = _moment2.default.unix(msg.date).isAfter(bdiadaycount[3], 'hours');
  if (bdiadaycount[0].length > 0 && validDate) {
    var _timeS2 = _moment2.default.unix(msg.date);
    if (bdiadaycount[1][1] === 0) {
      bdiadaycount[2] = bdiadaycount[0][0];
      bdiadaycount[1][1] = _moment2.default.unix(msg.date);
    }

    if (_timeS2.isAfter(nvloop, 'minute') || nvloop === 0) {
      setTimeout(function () {
        nvlog(_timeS2.diff(bdiadaycount[1][1], 'minute'));
        saveNewdata('nv', bdiadaycount);
        nvloop = _moment2.default.unix(msg.date).add(60, 'minutes');
      }, 5000);
    }

    var _faltam2 = _timeS2.isAfter(bdiadaycount[1][1], 'minute');
    if (_faltam2) {
      bdiadaycount[2] -= 1;
      var checkUser = silentUsers.findIndex(function (user) {
        return user === msg.from.username;
      });

      if (bdiadaycount[2] <= 0 && checkUser === -1) {
        bot.sendMessage(msg.chat.id, 'N\xE3o @' + msg.from.username + ', nada mais para validar  ...');
        bdiadaycount[0].shift();
        bdiadaycount[2] = bdiadaycount[0][0];
        bdiadaycount[1][1] = _moment2.default.unix(msg.date).add(bdiadaycount[1][0], 'h');
        saveNewdata('nv', bdiadaycount);
        console.log(nvlog(_faltam2));
      }
    }
  } else if (bdiadaycount[0].length <= 0) {
    bdiadaycount[1][2] = true;
  }

  // verificador de duplicados
  if (dgiftemp !== undefined) {
    var ckdl = 'proximo';
    if (msg.text.toString().toLowerCase().indexOf(ckdl) === 0) {
      console.log(dgiftemp);
      // newgif.splice(newgif.findIndex(dgiftemp), 0);
      itgifdup(msg);
    }
  }
});

// comando para Hoje é dia quê
var hjmessage = void 0;
var hjdiarx = /^(\w+(?=\s)\s)?((hoje|hj)|(que|q))?(.{3}|.)?((dia)|(hoje|hj)|(que|q))(.{4}|.{3})((dia)|(hoje|hj)|(que|q))$/gi;

bot.onText(hjdiarx, function (msg, match) {
  var tp1 = match[6]; // dia
  var tp2 = match[11]; // q que ou hoje
  if (tp1 === 'dia' && tp2.match(/^(q|que|hoje|hj)$/)) {
    switch (nowDay()) {
      case 'Sun':
        hjmessage = '\uD83C\uDF70\uD83C\uDF77 DOMINGO MI\xC7ANGUEIRO CREATIVO DA POHRA \uD83C\uDFA8\n        Pornfood e artes\n        (desenhos, textos, fotos de paisagens, pets, etc)\n        ';
        break;
      case 'Mon':
        hjmessage = '\uD83C\uDFA7 segunda feira spatifou \uD83C\uDFA4\n        M\xFAsicas, artistas, playlists e karaoke\n        ';
        break;
      case 'Tue':
        hjmessage = '\uD83D\uDCF7 ter\xE7a feira eg\xF3latra \uD83D\uDC86\n        Egoshot, hist\xF3rias pessoais e desabafos\n        ';
        break;
      case 'Wed':
        hjmessage = '\uD83D\uDE02 quarta feira gozada \uD83D\uDC4C\n        Piadas, twits, prints...\n        ';
        break;
      case 'Thu':
        hjmessage = '\uD83D\uDCE2 QUINTA FEIRA RADIO DE INTERNETE \uD83D\uDCFB\n        Epis\xF3dios de podcast pra indicar, lolicast e audioza\xE7os...\n        ';
        break;
      case 'Fri':
        hjmessage = '\uD83C\uDF46 sEXTA XERA SEN REGRAS \uD83D\uDCA6\n        De dia: Cracol\xEAs e tretas (ou n\xE3o)\n        De noite: Nudeshot e putaria (ou sim)\n\n        Envio gifs salvos quando se fala putaria.\n        Envio gif random a cada 3 gifs que vcs mandam.\n        ';
        break;
      case 'Sat':
        hjmessage = '\uD83C\uDFAE QUAL \xC9 A BOA / BOSTA DE S\xC1BADO ? \uD83C\uDFA5\n        (des) indica\xE7\xF5es pro fim de semana\n        ';
        break;
      default:
        break;
    }
    bot.sendMessage(msg.chat.id, hjmessage).then(function () {});
  }
});

//  retornar valor quando disserem bitcoin
var btctemp = 5;
bot.onText(/^(.+)?bitcoin(.+)?$/gim, function (msg, match) {
  if (Math.abs((0, _moment2.default)().diff(btctemp, 'minute')) >= 3 || btctemp === undefined) {
    (0, _convertbtc2.default)('BTC', 'BRL', 1).then(function (data) {
      bot.sendMessage(msg.chat.id, data).then(function () {
        btctemp = _moment2.default.unix(msg.date);
      });
    });
  }
});

//  comando apra retornar bitcoin especcífico
bot.onText(/^\/bdcbtc(\s)(\d+)(\s)(\w+)(\s)(\w{3})$|^\/bdcbtc@bomdiacracobot$/, function (msg, match) {
  (0, _convertbtc2.default)(match[4].toUpperCase(), match[6].toUpperCase(), match[2]).then(function (data) {
    bot.sendMessage(msg.chat.id, data).then(function () {});
  });
});

// comando para verificar bom dias
bot.onText(/^\/bdcstatus$|^\/bdcstatus@bomdiacracobot$/, function (msg, match) {
  var text = '\nN\xF3s temos ' + bddata.bomdia.length + ' bom dias.\nN\xF3s temos ' + gifdata.ckdgif.length + ' gifs.\nN\xF3s temos ' + gifdata.newgif.length + ' novos gifs para validar.\nN\xF3s temos ' + gifdata.tumblrlist.length + ' tumbler links.';
  bot.sendMessage(msg.chat.id, text).then(function () {});
});

// listen de bom dias
var bdrx = /^(((bo|bu)(\w+)?)(\s?)((di|de|dj|ena)\w+))(\s?|\.+|,|!|\?)?(\s)?(.+)?$/gi;
bot.onText(bdrx, function (msg, match) {
  var _bddata = bddata,
      latebdreceived = _bddata.latebdreceived,
      latebdsay = _bddata.latebdsay,
      bomdia = _bddata.bomdia,
      bdiasvar = _bddata.bdiasvar,
      pontosvar = _bddata.pontosvar;

  newbdv = match[1];
  newptv = match[8];
  newBdia = match[10];
  var bdiaback = void 0,
      notBdia = void 0;

  // checa por arrobas que não podem
  if (newBdia !== undefined) {
    notBdia = newBdia.match(/(@)/gi, '$1');
  }

  // check se o bom dia foi dado corretamente
  if (newBdia === undefined) {
    newBomDia();
    saveLastSay();
  } else if (notBdia !== null) {
    bdiaback = '\nNOT. Just Not.\nNada de marcar pessoas e botar o meu na reta.';
  } else {
    newBomDia();
    saveLastSay();
    saveLastListen();
  }
  // Gera um bom dia ramdom do banco e checa com os últimos falados.
  function newBomDia() {
    var _loop = function _loop(_i) {
      var bdnum = Math.floor(Math.random() * bomdia.length);
      var bdvnum = Math.floor(Math.random() * bdiasvar.length);
      var ptvnum = Math.floor(Math.random() * pontosvar.length);
      var lbds = latebdsay.findIndex(function (str) {
        return str === bomdia[bdnum];
      });
      var lbdr = latebdreceived.findIndex(function (str) {
        return str === bomdia[bdnum];
      });

      if (lbds === -1 && lbdr === -1) {
        _i = bomdia.length;
        bdiaback = bdiasvar[bdvnum] + pontosvar[ptvnum] + bomdia[bdnum];
      }
      i = _i;
    };

    for (var i = 0; i < bomdia.length; i += 1) {
      _loop(i);
    }
  }

  // Armazena ultimo bom dia falado
  function saveLastSay() {
    latebdsay.shift();
    latebdsay.push(bdiaback);
  }

  // Armazena ultimo bom dia recebido
  function saveLastListen() {
    latebdreceived.shift();
    latebdreceived.push(newBdia);
    checkBdData(bddata.bomdia, newBdia, 'bomdia');
    checkBdvData(newbdv);
  }

  bot.sendMessage(msg.chat.id, bdiaback).then(function () {
    var validDate = (0, _moment2.default)().isAfter(bdiadaycount[3], 'hours');
    var validQuantity = msg.text.length > 20 && bdiadaycount[0].length <= 5;

    if (validQuantity && validDate && bdiadaycount[1][2] === true) {
      bdiadaycount[0].push(msg.text.length);
      bdiadaycount[1][0] = Math.ceil(18 / (bdiadaycount[0].length + 1));
      saveNewdata('nv', bdiadaycount);
    } else if (bdiadaycount[0].length === 5) {
      var daysArray = Array.from(bdiadaycount[0]);
      bdiadaycount[1][0] = Math.ceil(18 / (bdiadaycount[0].length + 1));
      var pauseCalc = Math.floor(daysArray.reduce(function (acc, val) {
        return acc + val;
      }) / daysArray.length);
      var addHours = bdiadaycount[1][0] * 5 + pauseCalc;
      bdiadaycount[3] = _moment2.default.unix(msg.date).add(addHours, 'hours');
      bdiadaycount[1][2] = false;
      saveNewdata('nv', bdiadaycount);
    }

    if (bdiaback !== undefined) {
      newTwit(bdiaback);
    }
  });
});

// Twitter sender
function newTwit(staText) {
  console.log('twit status', staText);
  T.post('statuses/update', { status: staText }, function (err, data, response) {});
}

// Twitter Replyer
var bdrxtw = /^(@\w+\s)(((bo|bu)(\w+)?)(\s?)((di|de|dj|ena)\w+))(\s?|\.+|,|!|\?)?(\s)?(.+)?$/gi;
function tweetReply(tweet) {
  var _bddata2 = bddata,
      latebdreceived = _bddata2.latebdreceived,
      latebdsay = _bddata2.latebdsay,
      bomdia = _bddata2.bomdia,
      bdiasvar = _bddata2.bdiasvar,
      pontosvar = _bddata2.pontosvar;

  var replyTo = tweet.in_reply_to_screen_name; // Who is this in reply to?
  var name = tweet.user.screen_name; // Who sent the tweet?
  var txt = tweet.text; // What is the text?
  var match = bdrxtw.exec(txt);

  if (name !== 'bomdiaabot' && match !== null) {
    // receber bom dia do twitter
    var newbdvtw = match[2];
    var newptvtw = match[9];
    var newBdiatw = match[11];
    checkBdData(bddata.bomdia, newBdiatw, 'bomdia');
    checkBdvData(newbdvtw);

    // enviar bom dia aleatória a um reply do twitter
    var _bdnum = Math.floor(Math.random() * bomdia.length);
    var _bdvnum = Math.floor(Math.random() * bdiasvar.length);
    var _ptvnum = Math.floor(Math.random() * pontosvar.length);
    var bdiaback = bdiasvar[_bdvnum] + pontosvar[_ptvnum] + bomdia[_bdnum];
    var replytxt = '@ ' + name + ' ' + bdiaback;
    T.post('statuses/update', { status: replytxt }, function (err, reply) {
      if (err !== undefined) {
        console.log(err);
      } else {
        // console.log('Tweeted: ' + reply);
      }
    });
  }
}

// checa se a frase de bom dia recebido já existe no banco
function checkBdData(path, newBomDia, origem) {
  var existe = void 0;

  if (origem === 'gif') {
    existe = gifdata.ckdgif.findIndex(function (elem) {
      return elem[0] === newBomDia[0] && elem[1] === newBomDia[1];
    });
  } else {
    existe = path.findIndex(function (elem) {
      return elem === newBomDia;
    });
  }

  // Adiciona bom dia no banco de bom dias
  if (existe === -1 && origem === 'gif') {
    path.push(newBomDia);
    newgifCount += 1;
    console.log('Novo gif recebido: ' + newgifCount + ' -> ' + newBomDia);
  } else if (existe === -1 && origem === 'bomdia') {
    path.push(newBomDia);
    newBdiaCount += 1;
    console.log('Novo bom dia recebido: ' + newBdiaCount + ' -> ' + newBomDia);
  }

  if (newBdiaCount >= 10) {
    saveNewdata('bd', bddata);
    newBdiaCount = 0;
  } else if (newgifCount >= 10) {
    saveNewdata('gif', gifdata);
    newgifCount = 0;
  }
}

// checa se a variação de bom dia recebido já existe no banco
function checkBdvData(newbdvalue) {
  var existe = bddata.bdiasvar.findIndex(function (elem) {
    return elem === newbdvalue;
  });

  // Adiciona bom dia no banco de bom dias
  if (existe === -1) {
    bddata.bdiasvar.push(newbdvalue);
    newBdiaCount += 1;
  }
  if (newBdiaCount > 10) {
    saveNewdata('bd', bddata);
    newBdiaCount = 0;
  }
}

// sava arquivo json com bom dias no dropbox a cada 10 novos
function saveNewdata(id, dataVar) {
  var filename = '/' + id + 'data.json';
  var json = JSON.stringify(dataVar, null, 2);
  dbx.filesUpload({ path: filename, contents: json, mode: 'overwrite' }).then(function (response) {
    console.log('Data Saved : ' + filename);
    startRead();
  }).catch(function (err) {
    console.log('Error: ' + err);
  });
}

var dataProx = exports.dataProx = function dataProx() {
  return (0, _moment2.default)().diff(bdiadaycount[1][1], 'minutes');
};

var dataValues = exports.dataValues = function dataValues() {
  return { bddata: bddata,
    bdiadaycount: bdiadaycount,
    gifdata: gifdata
  };
};