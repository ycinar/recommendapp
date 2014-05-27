/* database */

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;

/* if any error occurs */
db.on('error', console.error.bind(console, 'connection error:'));

/* succesfully connected to database. */
db.once('open', function callback () {
	console.log('Connected to database!');
});

/* database end */

/* hash function */

/**
 * gets a phoneNumber and creates a password.
 */
 function hash(phoneNumber) {
	 return 1234554321;	// a fake password.
 }

/* hash function end

/* server */

var models = require('./data_models/models');
var User = models.UserModel;

var io = require('socket.io').listen(8080);

io.sockets.on('connection', function (socket) {

	var connectionAccepted = false; // boolean showing if the connection is valid. updated in connect function.
	
	/* saves the nickname */
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

	// @TODO: 	Add connectionAccepted checks for all functions.
	// @TODO:   Deliver undelivered messages to the connected user.
	/**
	 * The function for server connection, used by user.
	 * username: phone number.
	 * password: hashed phone number
	 * savedUsername: the username which user chooses, shown in the app.
	 */
	socket.on('connect', function (username, password, savedUsername) {

		if (!password) {	// no password, no connection.
			console.log('Connection refused. Reason: no password.');
			socket.disconnect();
			return;
		}

		// calculate the real password.
		actualPass = hash(username);

		// check if actual pass equals the incoming user's pass
		if (actualPass !== parseInt(password)) {	// doesn't match, no connection.
			console.log('Connection refused. Reason: wrong password.');
			socket.disconnect();
			return;
		}

		// we have a valid connection.
		connectionAccepted = true;
		
		console.log('Connection accepted, passwords match.');
			var usernameCopy = username;

		// check if the connected user was in the database.
		User.findOne({userId: usernameCopy}, function(err, user) {
			if (err) {
				console.log('An error occured during search of the user in the database');
				return;
			}
				console.log(user);	// print out the user matching in the database.
				if (user.length == 0) {	// no user matching in the database.
				/* save user in the database. */
				console.log('Saving the user in the database.');
				if (!savedUsername) {
					savedUsername = '';
				}
				var connectedUser = new User({userId: username, username: savedUsername}); 
				console.log(connectedUser);
				connectedUser.save(function (err) {
					if (err) {
						return console.error(err);
					}
					console.log('New user: ' + 'username: ' + connectedUser.userId + ' savedUsername: ' + connectedUser.username + ' saved.');
				});
			} else {
				console.log('The user is already registered in the database.');
				console.log('Checking for update.');
				if (user.username != savedUsername) {	// check if the db username and provided is the same.
					console.log('New username provided. Updating...');
					user.username = savedUsername;	// update the old to new username
					user.save(function (err) {	// save
						if (err) {
							return console.error(err);
						}
						console.log('Updated. New username: ' + savedUsername + ' for userId: ' + username);
					});
				} else {
					console.log('No need to update.');
				}
			}
		});
	});
});

/* server end */
