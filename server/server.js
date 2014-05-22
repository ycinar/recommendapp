// server

var io = require('socket.io').listen(8080);

io.sockets.on('connection', function (socket) {
  socket.on('set nickname', function (name) {
    socket.set('nickname', name, function () {
    });
    console.log('Nickname: ' + name);
		socket.emit('ready');
  });

  socket.on('message', function (message) {
    socket.get('nickname', function (err, name) {
			socket.emit('userMessage', {nickname: name, msg: message});
			console.log('User: ' , name);
			console.log('Message: ', message);
    });
  });
});

// server end

// database

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;

/* if any error occurs */
db.on('error', console.error.bind(console, 'connection error:'));

/* succesfully connected to database. */
db.once('open', function callback () {
	console.log('Connected to database!');
});

// database end

