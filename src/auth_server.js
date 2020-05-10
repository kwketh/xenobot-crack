/* Setup config */
var config = {
  port: 80,
  poweredBy: 'passion',
};

/* Load dependencies */
var express = require('express');
var assert = require('assert');
var crypto = require('crypto');
var logger = require('morgan');
var app = express();

/* Setup methods */
var md5 = function(data) {
  return crypto.createHash('md5').update(data).digest('hex');
};

/* Setup app */
app.use(logger());

app.use(function(request, response, next) {
  response.setHeader('X-Powered-By', config.poweredBy);
  next();
});

/* Authentication script */
app.get('/misc.php', function(request, response) {
  try {
    var name = request.query.name;
    var pass = request.query.pass;
    var key = request.query.key;
    var ticket = request.query.ticket;
  
    assert(name && name.length, 'name parameter is not empty');
    assert(pass && pass.length, 'pass parameter is not empty');
    assert(key && key.length, 'key parameter is not empty');
    assert(ticket && ticket.length, 'ticket parameter is not empty');

    /* Here comes the clever part */
    var hash = request.query.pass;
    hash = hash + name + ticket;
    hash = md5(hash) + key;
    var hashCount = ticket % 15; /* this one took me a while */
    for (var i = 0; i < hashCount + 1; i++)
      hash = md5(hash);

    response.end('Verified|' + hash);
  } catch (err) {
    if (err instanceof assert.AssertionError) {
      console.error(err.toString());
      response.end(err.toString());
    } else {
      console.error(err);
      response.connection.destroy();
    }    
  }
});

app.get('*', function(request, response) {
  response.connection.destroy();
});

app.listen(config.port);

console.log('Authentication server started on port %s', config.port);
