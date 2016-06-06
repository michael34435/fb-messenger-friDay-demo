var express = require('express');
var app = express();

app.get('/', function (req, res) {
  if (req.query['hub.verify_token'] === 'here_friday_token') {
    res.send(req.query['hub.challenge']);
  }
});

app.listen(3000);
