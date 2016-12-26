var express = require('express');
var path = require('path');
var http = require('http');
var socket = require('socket.io');
var CONSTANTS = require('./constants');

/* APP SETUP & ROUTES */
var app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/constants', function(req, res) {
  res.send(CONSTANTS);
});

/* SERVE APP */
var server = http.createServer(app);
server.listen(3000, function() {
  console.log('listening on *:3000');
});

/* SOCKET HANDLING */
var io = socket(server);
var connections = 0;
io.on('connection', function(socket) {
  // upon connection to socket, increment connections counter and broadcast new value
  connections += 1;
  io.emit(CONSTANTS.EVENT_TYPES.CONNECTIONS, connections);

  // upon message from client, broadcast to all clients
  socket.on(CONSTANTS.EVENT_TYPES.MESSAGE, function(msg) {
    io.emit(CONSTANTS.EVENT_TYPES.MESSAGE, msg);
  });

  // upon user disconnect, decrement connections counter and broadcast new value
  socket.on('disconnect', function() {
    connections -= 1;
    io.emit(CONSTANTS.EVENT_TYPES.CONNECTIONS, connections);
  });
});
