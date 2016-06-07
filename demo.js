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

var send = (body, method) => {
  var uri = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + process.env.PAGE_ACCESS_TOKEN

  request({
    body: JSON.stringify(body),
    json: true,
    uri: uri,
    method: method
  }, (err, obj, res) => {
    console.log(res);
  });
}

var send_message = (user, text) => {
  var message_payload = {
      "recipient":{
          "id": user
      },
      "message":{
          "text": text
      }
  };

  send(message_payload, 'post');
}


console.log(process.env.PAGE_ACCESS_TOKEN);

// Enable encoded URL (optional)
app.use(bodyParser.urlencoded({extended: true}))

// Enable JSON (optional)
app.use(bodyParser.json())

app.post('/', (req, res) => {
  var payload = req.body;
  console.log(payload)
  console.log(payload.object)
  if (payload.object == 'page') {
    var entry = payload.entry;
    entry.map((message_instance) => {
      var messaging = message_instance.messaging;
      messaging.map((message) => {
        var user = message.sender.id;
        var text = message.message.text;
        console.log(message);
        console.log(user, text);
        if (text) {
          var negative = false;
          var buy = false;
          var slice = jieba.cut(text);
          slice.map((piece) => {
            if (piece in n) {
              negative = true;
            }

            if (piece in b) {
              buy = true;
            }
          });

          if (negative && buy) {
            send_message(user, '不買就不買～～');
            return false;
          }

          if (buy && !negative) {
            send_message(user, '推薦點東西給你');
            return false;
          }

          send_message(user, '還有其他的問題嗎?');
        }
      });
    });
  }
});

app.get('/', (req, res) => {
  if (req.query['hub.verify_token'] === 'here_friday_token') {
    res.send(req.query['hub.challenge']);
  }
});

app.listen(3000);
