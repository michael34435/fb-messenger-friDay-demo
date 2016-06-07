var express = require('express');
var jieba = require('nodejieba');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();

var n = [
  '否',
  '不要',
  '不',
  '拒絕'
];

var b = [
  '買',
  '找'
];

var send = (body, cb) => {
  var uri = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + process.env.PAGE_ACCESS_TOKEN
  request({
    json: body,
    uri: uri,
    method: 'post'
  }, (err, obj, res) => {
    console.log(res);
    if (cb) {
      cb();
    }
  });
}

var send_message = (user, text, cb) => {
  var message_payload = {
      "recipient":{
          "id": user
      },
      "message":{
          "text": text
      }
  };

  send(message_payload, cb);
}

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.post('/', (req, res) => {
  var payload = req.body;
  if (payload.object == 'page') {
    var entry = payload.entry;
    entry.map((message_instance) => {
      var messaging = message_instance.messaging;
      messaging.map((message) => {
        var user = message.sender.id;
        if (message.message) {
          var text = message.message.text;
          if (text) {
            var negative = false;
            var buy = false;
            var buy_index = 0;
            var slice = jieba.cut(text);
            slice.map((piece, idx) => {
              if (piece in n) {
                negative = true;
              }

              if (piece in b) {
                buy = true;
                buy_index = idx;
              }
            });

            if (negative && buy) {
              send_message(user, '不買就算了');
            }

            if (buy && !negative) {
              send_message(user, '推薦點東西給你');
            }

            send_message(user, '請問您還有其他的問題嗎?');
          }
        }
      });
    });
  }

  res.sendStatus(200);
});

app.get('/', (req, res) => {
  if (req.query['hub.verify_token'] === 'here_friday_token') {
    res.send(req.query['hub.challenge']);
  }
});

app.get('/welcome', (req, res) => {
  res.send('hello world');
});

app.listen(80);
