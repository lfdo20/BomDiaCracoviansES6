import fs from 'fs';
import moment from 'moment';
import request from 'request';
import dotenv from 'dotenv';
import Dropbox from 'dropbox';
import Twit from 'twit';
import Bot from 'node-telegram-bot-api';
import cBtc from './convertbtc';

// local enviroment variables
// dotenv.load();

// Telegram api config
const bot = new Bot(process.env.BOT_TOKEN, { polling: true });

// Global Var
let bddata = {},
  newBdia,
  newbdv,
  newptv,
  newBdiaCount = 0,
  newgifCount = 0,
  rgifcount = 0;

const dropfilesurl = [[process.env.DROP_DATA, 'data.json', 'bddata'], [process.env.DROP_GIF, 'gifdata.json', 'gifdata']];
let gifdata = {
  newgif: [],
  ckdgif: [],
  lastgif: []
};

// Time config
const nowDay = () => moment().format('ddd');
const STime = moment('14:00', 'HHmm'); // 14:00
const ETime = moment('23:59', 'HHmm'); // 23:59

// Dropbox Config
const dbx = new Dropbox({
  key: process.env.DROPBOX_APP_KEY,
  secret: process.env.DROPBOX_APP_SECRET,
  accessToken: process.env.DROPBOX_TOKEN,
  sandbox: false
});

// Twitter Integration
const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_TOKEN,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET,
  timeout_ms: 60 * 1000
});

const streamTwit = T.stream('user');
streamTwit.on('tweet', tweetReply);

// Seção de Notas

// IDEA: organizar como o bot será utilizado em vários grupos:
// arquivos diferentes ? mesclar bases de dados ?

// IDEA: json não trabalha com " " dá problema, tem que
// converter regex pra detectar : (.+)(')(.+)(')(.+)?

console.log('bot server started...');

// pega o arquivo no dropbox e transforma em objeto
// bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
function startRead() {
  dropfilesurl.forEach((id) => {
    dbx.sharingGetSharedLinkFile({ url: id[0] })
      .then((data) => {
        fs.writeFileSync(data.name, data.fileBinary, 'binary', (err) => {
          if (err) { throw err; } else {
            // console.log('File: ' + data.name + ' saved.');
          }
        });
        if (id[2] === 'bddata') {
          bddata = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
        } else if (id[2] === 'gifdata') {
          gifdata = JSON.parse(fs.readFileSync('./gifdata.json', 'utf8'));
        }
      }).catch((err) => {
        throw err;
      });
  });
}
startRead();

/*

const { latebdreceived, latebdsay, bomdia, bdiasvar, pontosvar } = bddata;

const { ckdgif, newgif, lastgif, tumblrgif, tumblrlist } = gifdata;

*/

bot.on('message', (msg) => {
});

// comando para imagem do dia
bot.onText(/^\/bdcdia$|^\/bdcdia@bomdiacracobot$/, (msg) => {
  const text = 'https://www.dropbox.com/s/ty8b23y8qmcfa0y/bdcdia.jpg?raw=1';
  bot.sendPhoto(msg.chat.id, text).then(() => {
    // reply sent!
  });
});

// comando para ultimos recebidos
bot.onText(/^\/bdcultimos$|^\/bdcultimos@bomdiacracobot$/, (msg) => {
  const text = `${bddata.latebdreceived.map(elem => `${elem}`).join('\n')}`;
  console.log(text);
  bot.sendMessage(msg.chat.id, text).then(() => {
    // reply sent!
  });
});

// comando para salvar arquivos
bot.onText(/^\/bdcsave\s(data|gif)$/, (msg, match) => {
  match[1] === 'data' ? saveNewdata(bddata) : saveNewdata(gifdata);
  bot.sendMessage(msg.chat.id, 'Salvo!');
});

// comando para help
bot.onText(/^\/bdchelp$|^\/bdchelp@bomdiacracobot$/, (msg) => {
  const text = `Bom dia!
    Eu guardo toda a frase dita após "bom dia".
    E respondo todos os bom dias com ou sem frases..
    mas ainda não entendo coisas loucas tipo "buónday".

    /bdcstatus - Ver a quantidades de bom dias no banco
    /bdcadmin - Ver comandos de administração
    /bdcbtc - Ver cotação bitcoin. Formato: 1 BTC BRL
    /bdcultimos - Ver os ultimos bom dias adicionados`;
  bot.sendMessage(msg.chat.id, text).then(() => { });
});

bot.onText(/^\/bdcadmin\s(.+)$/, (msg, match) => {
  if (match[1] === process.env.ADM_PASS) {
    const text = `
    Comandos de manutenção:

    /bdcgifdup - Checar duplicidade de gifs.
    /bdccheck X - Checar e validar os gifs recebidos. (X = quantidade)
    /bdcsave - Salvar os arquivos de dados. (data | gif)`;
    bot.sendMessage(msg.chat.id, text).then(() => { });
  } else {
    const text = 'Senha errada.';
    bot.sendMessage(msg.chat.id, text).then(() => { });
  }
});

// buscar gif por id/tamanho duplicados e apresentar seus ids
const dupgifs = [];
let dgiftemp;
function itgifdup(msg) {
  if (dupgifs.length > 0) {
    dupgifs[0].forEach((gf) => {
      console.log('oi4 : ', gf);
      dgiftemp = gf;
      bot.sendDocument(msg.chat.id, gf[0], {
        caption: `${gf[0].toString()}  ${gf[1].toString()}`
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

bot.onText(/^\/bdcgifdup$/gi, (msg, match) => {
  const { ckdgif, newgif, lastgif, tumblrgif, tumblrlist } = gifdata;
  ckdgif.forEach((x) => {
    const dupt = ckdgif.filter(y => y[0] === x[0] && y[1] === x[1]);
    if (dupt.length > 1) {
      dupgifs.push(dupt);
    }
  });
  console.log('Gifs Duplicados : ', dupgifs);
  itgifdup(msg);
});

// Recebimento de gifs putaria e contagem
bot.on('document', (msg) => {
  if (nowDay() === 'Fri') { // check is is Fri
    if (msg.document.mime_type === 'video/mp4') {
      // console.log(msg.document);
      // var gifthumb = 'https://api.telegram.org/file/bot'+token+'/'+msg.document.thumb.file_path;
      const newGf = [msg.document.file_id, msg.document.file_size.toString()];
      // console.log(gifthumb);
      checkBdData(gifdata.newgif, newGf, 'gif');
      rgifcount += 1;
      console.log(`Gif aleatório contador: ${rgifcount}`);
      if (rgifcount > 3) {
        if (moment().isBetween(STime, ETime, 'minute', '[]')) {
          randomGif(msg);
          rgifcount = 0;
        }
      }
    }
  }
});

// NOTE: data não está detectando o dia após meia noite.

// função para lembrar que vai começar a putaria
let endputsaid = 0;
function putariaRemenber(msg, faltam) {
  // console.log(faltam);
  if (faltam <= 60 && endputsaid === 0) {
    bot.sendMessage(msg.chat.id, `Faltam ${faltam} minutos para acabar a putaria! 😭😭`).then(() => {
      endputsaid = 2;
    });
  } else if (faltam <= 20 && endputsaid === 2) {
    bot.sendMessage(msg.chat.id, `Faltam ${faltam} minutos para acabar a putaria! 😱😱`).then(() => {
      endputsaid = 4;
    });
  } else if ((faltam <= 1 || faltam > 60) && endputsaid !== 0) {
    endputsaid = 0;
  }
}

// comando para gifd tumblrs teste
bot.onText(/^(pootaria)$/gi, (msg, match) => {
  randomGif(msg);
});

// comando para gifs putaria
function getGif() {
  const { ckdgif, newgif, lastgif, tumblrgif, tumblrlist } = gifdata;
  let cb;
  const gifrand = () => Math.floor(Math.random() * ckdgif.length).toString();
  ckdgif.find((x) => {
    const gifNum = gifrand();
    if (lastgif.every(y => y !== gifNum)) {
      lastgif.shift();
      lastgif.push(gifNum.toString());
      cb = ckdgif[gifNum][0];
      console.log(cb);
    }
    return cb;
  });
  return cb;
}

const gftagrxdays = /^(p(u|o)+taria+)$/gi;
const gftagrxfri = /^(.+)?(p(u|o)+taria+)(.+)?$/gi;
const gftagrx = () => nowDay() === 'Tue' ? gftagrxfri : gftagrxdays;

bot.onText(gftagrx(), (msg) => {
  if (nowDay() !== 'Fri') { // Correto é Fri
    bot.sendMessage(msg.chat.id, 'Hoje não é dia né. Tá achando que putaria é bagunça!?').then(() => {
    });
  } else if (!moment().isBetween(STime, ETime, 'minute', '[]')) {
    let faltam = Math.abs(moment().diff(STime, 'minute'));
    faltam = faltam > 60 ? `${Math.round(faltam / 60)} h e ${faltam} % 60 min` : `${faltam} min`;
    bot.sendMessage(msg.chat.id, `Caaaaalma, faltam ${faltam} para começar a putaria!`).then(() => { });
  } else {
    const gifId = getGif();
    // console.log('testeoi', gifId);
    if (gifId !== undefined) {
      bot.sendDocument(msg.chat.id, gifId).then(() => {
        newgifCount += 1;
        console.log(`Contador novo gif: ${newgifCount}`);
        rgifcount += 1;
        console.log(`Contador gif random: ${rgifcount}`);
        if (newgifCount >= 5) {
          saveNewdata(gifdata);
          newgifCount = 0;
        }
      });
    }
  }
});

// função para putarias random tumblr
let ix = 0, uri;
const rgifrx = /(h\S+\.gif(?!\'\)))/gi;

// (\<img src\=\")(h\S+gif(?!\"\/\<br))("\/\>)/gi;
function randomGif(msg) {
  const { ckdgif, newgif, lastgif, tumblrgif, tumblrlist } = gifdata;
  // console.log(gifdata.tumblrgif.length);
  if (tumblrgif.length > 0) {
    bot.sendDocument(msg.chat.id, tumblrgif[0]).then(() => {
      // console.log('foi');
      tumblrgif.shift();
      rgifcount = 0;
    });
  } else if (tumblrgif.length === 0) {
    (function getlink() {
      // ix = gifdata.tumblrgif[gifdata.tumblrgif.length];
      // if (ix < gifdata.tumblrlist.length) {
      uri = tumblrlist[ix][0].toString();
      // console.log('rgif : '+ix+' & '+uri);
      // getFeed(uri, ix).then((i) => {
      (function getFeed() {
        return new Promise((resolve, reject) => {
          request(uri, (err, res, body) => {
            if (err) { console.log(err); }
            body.replace(rgifrx, (match, p1, p2) => {
              tumblrgif.push(match);
            });

            bot.sendDocument(msg.chat.id, tumblrgif[0]).then(() => {
              tumblrgif.shift();
              rgifcount = 0;
              ix += 1;
              tumblrlist.pop();
              tumblrlist.push(ix.toString());
              saveNewdata(gifdata);
            });
          });
        });
      }());
      // });
      // }
    }());
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
let ckgfid = '',
  ckgfsize = '',
  ckgfthlink = '',
  checknum = 0;

const endkeyboard = (msg) => {
  saveNewdata(gifdata);
  bot.sendMessage(msg.chat.id, 'Nada mais para validar..', {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      remove_keyboard: true,
      selective: true
    }
  });
};

const newgfcheck = (msg) => {
  if (gifdata.newgif.length > 0 && checknum > 0) {
    ckgfid = gifdata.newgif[0][0];
    const urigif = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${ckgfid}`;
    console.log(urigif);
    request.get(urigif, { json: true }, (err, res, body) => {
      console.log('Gif Check :', body.result);
      ckgfsize = body.result.file_size;
      ckgfthlink = '';
    });

    bot.sendDocument(msg.chat.id, ckgfid, {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        keyboard: [['👍 Sim', '👎 Não'], ['👈 Pular']],
        selective: true
      }
    }).then(() => {
      checknum -= 1;
    });
  } else {
    endkeyboard(msg);
    checknum = 0;
  }
};

bot.onText(/^\/bdccheck(\s)(\d+)$/, (msg, match) => {
  checknum = match[2];
  newgfcheck(msg);
});

// comando para analisar várias mensagens recebidas e distribuir as funções
let putexec = false,
  putstartcheck = false,
  vcmsg = '';

// mensagens de início / fim de hora da putaria
let timeouttemp = 5;
bot.on('message', (msg) => {
  if (nowDay() === 'Fri') {
    if (!putexec) {
      const timeS = moment.unix(msg.date).format('HH');
      if (timeS === '23') {
        const faltam = Math.abs(moment().diff(ETime, 'minute'));
        putariaRemenber(msg, faltam);
      } else if (timeS === '13') { // 13
        const faltam = moment().diff(moment('14:00', 'HHmm'), 'minute') * -1;
        console.log('t3 ', faltam); // STime
        if (faltam < 30 && faltam > 0 && !putstartcheck) {
          putstartcheck = true;
          vcmsg = msg.chat.id;
          console.log(msg, vcmsg, timeS, faltam);
          setTimeout(() => {
            bot.sendAudio(vcmsg, 'CQADAQADCgAD9MvIRuM_NpJIg6-YAg'); // msg.chat.id
            setTimeout(() => { putstartcheck = false; }, 60000);
          }, (faltam * 60) * 1000);
        }
      }
      putexec = true;
      setTimeout(() => { putexec = false; }, 3000);
    }
    // putariaCalc(msg);
  }

  const { ckdgif, newgif } = gifdata;

  if (checknum > 0) {
    // console.log(msg);
    const cks = '👍 sim';
    if (msg.text.toString().toLowerCase().indexOf(cks) === 0) {
      console.log('ok sim');
      newgif.shift();
      const temp = [ckgfid, ckgfsize.toString()];
      ckdgif.push(temp);
      // console.log(gifdata.ckdgif);
      newgfcheck(msg);
    }

    const ckn = '👎 não';
    if (msg.text.toString().toLowerCase().indexOf(ckn) === 0) {
      console.log('ok não');
      newgif.shift();
      newgfcheck(msg);
    }

    const ckr = '👈 pular';
    if (msg.text.toString().toLowerCase().indexOf(ckr) === 0) {
      console.log('ok pula');
      newgif.shift();
      newgif.push(ckgfid);
      newgfcheck(msg);
    }
  }

  // nada mais para validar ....
  // console.log(msg);
  setTimeout(() => {
    if (timeouttemp > 0) {
      timeouttemp = 5;
    } else {
      timeouttemp = 0;
    }
  }, 3000);
  if (timeouttemp === 8) {
    bot.sendMessage(msg.chat.id, `Nada mais para validar @${msg.from.username} ...`);
  }

  if (dgiftemp !== undefined) {
    const ckdl = 'proximo';
    if (msg.text.toString().toLowerCase().indexOf(ckdl) === 0) {
      console.log(dgiftemp);
      // newgif.splice(newgif.findIndex(dgiftemp), 0);
      itgifdup(msg);
    }
  }
});


// comando para Hoje é dia quê
let hjmessage;
const hjdiarx = /^(\w+(?=\s)\s)?((hoje|hj)|(que|q))?(.{3}|.)?((dia)|(hoje|hj)|(que|q))(.{4}|.{3})((dia)|(hoje|hj)|(que|q))$/gi;

bot.onText(hjdiarx, (msg, match) => {
  const tp1 = match[6]; // dia
  const tp2 = match[11]; // q que ou hoje
  if (tp1 === 'dia' && tp2.match(/^(q|que|hoje|hj)$/)) {
    switch (nowDay()) {
      case 'Sun':
        hjmessage =
        `🍰🍷 DOMINGO MIÇANGUEIRO CREATIVO DA POHRA 🎨
        Pornfood e artes
        (desenhos, textos, fotos de paisagens, pets, etc)
        `;
        break;
      case 'Mon':
        hjmessage =
        `🎧 segunda feira spatifou 🎤
        Músicas, artistas, playlists e karaoke
        `;
        break;
      case 'Tue':
        hjmessage =
        `📷 terça feira ególatra 💆
        Egoshot, histórias pessoais e desabafos
        `;
        break;
      case 'Wed':
        hjmessage =
        `😂 quarta feira gozada 👌
        Piadas, twits, prints...
        `;
        break;
      case 'Thu':
        hjmessage =
        `📢 QUINTA FEIRA RADIO DE INTERNETE 📻
        Episódios de podcast pra indicar, lolicast e audiozaços...
        `;
        break;
      case 'Fri':
        hjmessage =
        `🍆 sEXTA XERA SEN REGRAS 💦
        De dia: Cracolês e tretas (ou não)
        De noite: Nudeshot e putaria (ou sim)

        Envio gifs salvos quando se fala putaria.
        Envio gif random a cada 3 gifs que vcs mandam.
        `;
        break;
      case 'Sat':
        hjmessage =
        `🎮 QUAL É A BOA / BOSTA DE SÁBADO ? 🎥
        (des) indicações pro fim de semana
        `;
        break;
      default:
        break;
    }
    bot.sendMessage(msg.chat.id, hjmessage).then(() => {
    });
  }
});

//  retornar valor quando disserem bitcoin
let btctemp = 5;
// bt().then((data) => { console.log('tres', data); })

bot.onText(/^(.+)?bitcoin(.+)?$/gim, (msg, match) => {
  console.log(moment().diff(btctemp, 'minutes'), btctemp, moment().format('HHmm'));
  if (Math.abs(moment().diff(btctemp, 'minute')) >= 0 | btctemp === undefined) {
    cBtc('BTC', 'BRL', 1).then((data) => {
      bot.sendMessage(msg.chat.id, data).then(() => {
        btctemp = moment.unix(msg.date);
      });
    });
  }
});

//  comando apra retornar bitcoin especcífico
bot.onText(/^\/bdcbtc(\s)(\d)(\s)(\w+)(\s)(\w{3})$|^\/bdcbtc@bomdiacracobot$/, (msg, match) => {
  // console.log(match.length, match[4].toUpperCase(), match[6].toUpperCase(), match[2]);
  cBtc(match[4].toUpperCase(), match[6].toUpperCase(), match[2])
    .then((data) => {
      bot.sendMessage(msg.chat.id, data).then(() => {
      });
    });
});

// comando para verificar bom dias
bot.onText(/^\/bdcstatus$|^\/bdcstatus@bomdiacracobot$/, (msg, match) => {
  const text = `
  Nós temos ${bddata.bomdia.length} bom dias.
  Nós temos ${gifdata.ckdgif.length} gifs.
  Nós temos ${gifdata.newgif.length} novos gifs para validar.
  Nós temos ${gifdata.tumblrlist.length} tumbler links.
   `;
  bot.sendMessage(msg.chat.id, text).then(() => {
    // reply sent!
  });
});

// NOTE: buscar um novo algoritmo randomGif

// NOTE: comando para buscar e mostrar gifs repetidos pelo tamanho ou nome
// e perguntar para deletar.

// listen de bom dias
const bdrx = /^(((bo|bu)(\w+)?)(\s?)((di|de|dj|ena)\w+))(\s?|\.+|,|!|\?)?(\s)?(.+)?$/gi;
bot.onText(bdrx, (msg, match) => {
  const { latebdreceived, latebdsay, bomdia, bdiasvar, pontosvar } = bddata;
  newbdv = match[1];
  newptv = match[8];
  newBdia = match[10];
  let bdiaback, notBdia;

  // checa por arrobas que não podem
  if (newBdia !== undefined) {
    notBdia = newBdia.match(/(\@)/gi, '$1');
    // check se o bom dia foi dado corretamente
  }

  if (newBdia === undefined) {
    newBomDia();
    saveLastSay();
  } else if (notBdia !== null) {
    bdiaback = `
    NOT. Just Not.
    Nada de marcar pessoas e botar o meu na reta.`;
  } else {
    newBomDia();
    saveLastSay();
    saveLastListen();
  }
  // Gera um bom dia ramdom do banco e checa com os últimos falados.
  function newBomDia() {
    for (let i = 0; i < bomdia.length; i += 1) {
      const bdnum = Math.floor(Math.random() * bomdia.length);
      const bdvnum = Math.floor(Math.random() * bdiasvar.length);
      const ptvnum = Math.floor(Math.random() * pontosvar.length);
      const lbds = latebdsay.findIndex(str => str === bomdia[bdnum]);
      const lbdr = latebdreceived.findIndex(str => str === bomdia[bdnum]);
      console.log(lbds, lbdr, bdiaback);

      if (lbds === -1 && lbdr === -1) {
        i = bomdia.length;
        bdiaback = bdiasvar[bdvnum] + pontosvar[ptvnum] + bomdia[bdnum];
      }
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
    // console.log(bddata.latebdreceived);
    checkBdData(bddata.bomdia, newBdia, 'bomdia');
    checkBdvData(newbdv);
  }

  bot.sendMessage(msg.chat.id, bdiaback).then(() => {
    if (newBdia !== undefined) {
      newTwit(bdiaback);
    }
  });
});

// Twitter sender
function newTwit(status) {
  T.post('statuses/update', { status: 'status' }, (err, data, response) => { });
}

// Twitter Replyer
const bdrxtw = /^(@\w+\s)(((bo|bu)(\w+)?)(\s?)((di|de|dj|ena)\w+))(\s?|\.+|,|!|\?)?(\s)?(.+)?$/gi;
function tweetReply(tweet) {
  const { latebdreceived, latebdsay, bomdia, bdiasvar, pontosvar } = bddata;
  // if (!moment().isBetween(STime, ETime, 'minute', '[]')) {
  const replyTo = tweet.in_reply_to_screen_name; // Who is this in reply to?
  const name = tweet.user.screen_name; // Who sent the tweet?
  const txt = tweet.text;// What is the text?
  const match = bdrxtw.exec(txt);

  if (name !== 'bomdiaabot' && match !== null) {
    // receber bom dia do twitter
    const newbdvtw = match[2];
    const newptvtw = match[9];
    const newBdiatw = match[11];
    checkBdData(bddata.bomdia, newBdiatw, 'bomdia');
    checkBdvData(newbdvtw);

    // enviar bom dia aleatória a um reply do twitter
    const bdnum = Math.floor(Math.random() * bomdia.length);
    const bdvnum = Math.floor(Math.random() * bdiasvar.length);
    const ptvnum = Math.floor(Math.random() * pontosvar.length);
    const bdiaback = bdiasvar[bdvnum] + pontosvar[ptvnum] + bomdia[bdnum];
    const replytxt = `@ ${name} ${bdiaback}`;
    T.post('statuses/update', { status: replytxt }, (err, reply) => {
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
  // console.log(newBomDia, origem);
  let existe;
  if (origem === 'gif') {
    existe = gifdata.ckdgif.findIndex(elem => elem === newBomDia);
  } else {
    existe = path.findIndex(elem => elem === newBomDia);
  }
  // Adiciona bom dia no banco de bom dias
  if (existe === -1 && origem === 'gif') {
    path.push(newBomDia);
    newgifCount += 1;
    console.log(`Novo gif recebido: ${newgifCount} -> ${newBomDia}`);
  } else if (existe === -1 && origem === 'data') {
    path.push(newBomDia);
    newBdiaCount += 1;
    console.log(`Novo bom dia recebido: ${newBdiaCount} -> ${newBomDia}`);
  }
  if (newBdiaCount >= 10) {
    saveNewdata(bddata);
    newBdiaCount = 0;
  } else if (newgifCount >= 10) {
    saveNewdata(gifdata);
    newgifCount = 0;
  }
}

// checa se a variação de bom dia recebido já existe no banco
function checkBdvData(newbdvalue) {
  const existe = bddata.bdiasvar.findIndex(elem => elem === newbdvalue);

  // Adiciona bom dia no banco de bom dias
  if (existe === -1) {
    bddata.bdiasvar.push(newbdvalue);
    newBdiaCount += 1;
  }
  if (newBdiaCount > 10) {
    saveNewdata(bddata);
    newBdiaCount = 0;
  }
}

// sava arquivo json com bom dias no dropbox a cada 10 novos
function saveNewdata(dataVar) {
  const filename = Object.keys(dataVar).length > 6 ? '/data.json' : '/gifdata.json';
  console.log(filename);
  const json = JSON.stringify(dataVar, null, 2);
  dbx.filesUpload({ path: filename, contents: json, mode: 'overwrite' })
    .then((response) => {
      console.log(`Data Saved : ${filename}`);
      startRead();
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
}