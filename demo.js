var express = require('express');
var jieba = require('nodejieba');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
var uri = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + process.env.PAGE_ACCESS_TOKEN
var setting_uri = 'https://graph.facebook.com/v2.6/' + process.env.PAGE_ID + '/thread_settings?access_token=' + process.env.PAGE_ACCESS_TOKEN;
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

var send = (uri, body, cb) => {
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

var get_elements_json = (title, image_url, subtitle, url) => {
  var json = {
    "title": title,
    "image_url": image_url,
    "subtitle": subtitle,
    "buttons": [
      {
        "type": "web_url",
        "url": url,
        "title": "查看賣場"
      }
    ]
  };

  return json;
}

var get_generic_json = (user, elements) => {
  var json = {
    "recipient": {
      "id": user
    },
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": []
        }
      }
    }
  };

  elements.map((element) => {
    json.message.attachment.payload.elements.push(get_elements_json(element.title, element.image_url, element.subtitle, element.url));
  });

  return json;
}

var set_welcome_screen = () => {

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

  send(uri, message_payload, cb);
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
            console.log('recieve:' + text);
            var negative = false;
            var buy = false;
            var buy_index = 0;
            var slice = jieba.cut(text);
            console.log('slice:' + slice);
            slice.map((piece, idx) => {
              if (n.indexOf(piece)) {
                negative = true;
              }

              if (b.indexOf(piece)) {
                buy = true;
                buy_index = idx;
              }
            });

            if (negative && buy) {
              send_message(user, '不買就算了');
            } else if (buy && !negative) {
              var items = slice.slice(buy_index + 1);
              send_message(user, '推薦點東西給你', () => send_message(user, '正在搜尋...'));
              request.get({url: 'https://shopping-api.friday.tw/api/app/v2/search?currentPage=1&pageSize=20&keyword=' + items.join('+'), json: true}, (err, req, body) => {
                var data = body.data;
                var elements = [];
                data.map((product) => {
                  elements.push({
                    title: product.saleName,
                    image_url: product.image,
                    subtitle: product.modelNo,
                    url: 'http://shopping.friday.tw/salecenter/index?saleNo='+product.saleNo
                  });
                });

                var json = get_generic_json(user, elements);
                send(uri, json, () => {
                  send_message(user, '從friday.tw找到上面這些商品');
                });
              });
            } else {
              send_message(user, '無法識別您在說什麼');
            }
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
