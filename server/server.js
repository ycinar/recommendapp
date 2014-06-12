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

/* generatePassword function */

/**
 * gets a phoneNumber and creates a password.
 */
 function generatePassword(phoneNumber) {
	 return 42;
 }

/* generatePassword function end */

/* findUserIndex function begin */

/**
 * Finds the index of the specific userin the onlineUsers array. If the user is online, returns index of the user; otherwise returns -1. 
 */
function findUserIndex(userId) {
	for (var i = 0; i < onlineUsers.length; i++) {
		if (onlineUsers[i].user.userId == userId) {
			return i;
		}
	}
	// the user is not online, return -1.
	return -1;
}

/* findUserIndex function end */

/* server */

/* import data models */
var models = require('./data_models/models');

var User = models.UserModel;
var RecommendRequest = models.RecommendRequestModel;

var onlineUsers = [];
var undeliveredRequests = [];
var undeliveredReplies = [];

var io = require('socket.io').listen(8080);

io.sockets.on('connection', function (socket) {

	var connectionAccepted = false; // boolean showing if the connection is valid. updated in connectToServer() function.
	var userId = '';


	// @TODO: 	Add connectionAccepted checks for all functions.
	/**
	 * The function for server connection, used by user.
	 * @username: phone number.
	 * @password: for blocking unintended connections, should be synced with server's password
	 * @savedUsername: the username which user chooses, shown in the app.
	 */
	socket.on('connectToServer', function (username, password, savedUsername) {

		if (!password) {	// no password, no connection.
			console.log('Connection refused. Reason: no password.');
			socket.disconnect();
			return;
		}

		// calculate the real password.
		actualPass = generatePassword(username);

		// check if actual pass is equal with the incoming user's pass
		if (actualPass !== parseInt(password)) {	// doesn't match, no connection.
			console.log('Connection refused. Reason: wrong password.');
			socket.disconnect();
			return;
		}

		console.log('Connection accepted, passwords match.');

		// we have a valid connection.
		connectionAccepted = true;
		
		var connectedUser = new User({userId: username, username: savedUsername});

		// add connected user to the online users array with its socketId.
		onlineUsers.push({user: connectedUser, socketId: socket.id});

		console.log('New user has been added to the online user array.');

		// display online users.
		console.log('Online users:');
		console.log(onlineUsers);
		
		userId = username;	// for future use, userId is global. userId = username = phone number of the user.
		console.log('UserId updated to ' + userId);
		// check if the connected user was in the database.
		User.findOne({userId: username}, function(err, user) {
			if (err) {
				console.error(err);
				return;
			}
				
			console.log(user);	// print out the user matching in the database.

			if (!user) {	// no user matching in the database.

				/* save user in the database. */
				console.log('DB: Saving the user in the database.');

				if (!savedUsername) {
					savedUsername = '';	// default username.
				}

				console.log(connectedUser);

				connectedUser.save(function (err) {
					if (err) {
						return console.error(err);
					}
					console.log('DB: New user: ' + 'username: ' + connectedUser.userId + ' savedUsername: ' + connectedUser.username + ' saved.');
				});
			} else {	// found the user in the db.
				console.log('DB: The user is already registered in the database.');
				console.log('DB: Checking for update.');

				/* update the username if a new one is provided. */
				if (user.username != savedUsername) {
					console.log('New username provided. Updating...');
					user.username = savedUsername;
					user.save(function (err) {	// save the updated user.
						if (err) {
							return console.error(err);
						}
						console.log('DB: Updated. New username: ' + savedUsername + ' for userId: ' + username);
					});
				} else {
					console.log('DB: No need to update.');
				}
				
				/* if the user is found in the db, there may some requests to him undelivered */
				/* if there is any undelivered request to the user, send to him. */

				// NOTE: can be written in another method.
				for (var requestIndex = 0; requestIndex < undeliveredRequests.length; requestIndex++) {

					var request = undeliveredRequests[requestIndex];
					var indexOfUser = request.receivers.indexOf(username);	// find the user in the array.

					if (indexOfUser !== -1) {	// there is an undelivered request for user.
						console.log('Undelivered Request for new connecting user ' + username);
						io.sockets.socket(socket.id).emit('getRecommendRequest', request.from, request.what, request.where, request.description);	// send the request.
						console.log('Delivered.');
						request.receivers.splice(indexOfUser, 1);	// clean the user from the list, because the request has been sent.

						/* if there is no user waiting for delivery, delete the request from the request array. */
						if (request.receivers.length == 0) {
							undeliveredRequests.splice(requestIndex--, 1);	// length has shrinked, so decrease requestIndex before loop update.
						}
					} else {
						console.log('No undelivered requests for new connecting user.');
					}
				}

				/* there may also be some undelivered replies for the user, deliver them */
				// NOTE: can be written in another method.
				for (var replyIndex = 0; replyIndex < undeliveredReplies.length; replyIndex++) {
					var reply = undeliveredReplies[replyIndex];
					if (reply.receiver == username) {	// there is an undelivered reply for new connecting user.
						io.sockets.socket(socket.id).emit('getReply', reply.senderPhoneNumber, reply.senderName, reply.reply);
						console.log('Reply ');
						console.log(reply);
						console.log(' delivered for new connecting user.');
						undeliveredReplies.splice(replyIndex--, 1);	// length has shrinked, so decrease requestIndex before loop update.
					}
				}
			}
		});
	});
	
	/** Function for sending recommend requests to the clients.
	 * @sender: the sender of the request.
	 * @receivers: an array contains userId(phone numbers)s of the receivers.
	 * @what: the topic of the recommend request.
	 * @where: recommend is requested in the "where" area.
	 * @description: a brief description of the recommend request. 
	 */
	socket.on('sendRecommendRequest', function (sender, receivers, what, where, description) {
		if (!connectionAccepted) {	// invalid connection, disconnect.
			socket.disconnect();
			return;
		} else {	// we have a valid connection.

			var recommendRequest = new RecommendRequest({from: sender, to: receivers, what: what, where: where, desc: description});
			console.log('Coming recommend request: ' + recommendRequest);

			/* first, save the request in the db. */
			recommendRequest.save(function (err) {
				if (err) {	// if any error occures.
					return console.error(err);
				}
				console.log('New recommend request ' + recommendRequest + ' saved.');
			});

			/*  send request to all receivers: if they are online, send now; else, add to the undelivered request array */

			var undeliveredRequestReceivers = [];

			for (var i = 0; i < receivers.length; i++) {
				var receiverIndex = findUserIndex(receivers[i]);	// find user index in the onlineUser array.
				if (receiverIndex !== -1) {	// user is online.

					var receiverSocketId = onlineUsers[receiverIndex].socketId;

					// send request to the specific user which is identified by its socket id in the server.
					io.sockets.socket(receiverSocketId).emit('getRecommendRequest', sender, what, where, description);

				} else {	// user is not online.
					undeliveredRequestReceivers.push(receivers[i]);
				}
			}
			if (undeliveredRequestReceivers.length !== 0) {	// some of the users are not online, some messages couldn't be delivered.
				console.log('Receivers ' + undeliveredRequestReceivers + ' are not online for request ' + recommendRequest);
				undeliveredRequests.push({from: sender, what: what, where: where, description: description, receivers: undeliveredRequestReceivers});
				console.log('Undelivered Requests: ');
				console.log(undeliveredRequests);
				console.log('Request saved for delivery to not online users');
			} else {
				console.log('All receivers are online, and recommend requests has been sent.');
			}
		}
	});
	/*
	 * The function called by the socket.io when a user disconnects.
	 */
	socket.on('disconnect', function () {
		/* clear the user from the onlineUsers array */
		console.log('User has been disconnected');
		var indexOfDisconnectedUser = findUserIndex(userId);
		if (indexOfDisconnectedUser == -1) {
			console.log('Couldnt find the disconnected user. The user id was ' + userId);
		} else {
			console.log('Disconnected user: ');
			console.log(onlineUsers[indexOfDisconnectedUser]);
			onlineUsers.splice(indexOfDisconnectedUser, 1);

			console.log('Online users: ');
			console.log(onlineUsers);
		}
	});

	/*
	 * The function for sending recommend replies to a specific user.
	 */
	socket.on('sendReply', function (replyReceiver, replySenderPhoneNumber, replySenderName, reply) {
		console.log('Sending reply.');
		var replyReceiverIndex = findUserIndex(replyReceiver);
		if (replyReceiverIndex != -1) {	// the reply receiver is online.
			var receiverSocketId = onlineUsers[replyReceiverIndex].socketId;
			io.sockets.socket(receiverSocketId).emit('getReply', replySenderPhoneNumber, replySenderName, reply);
			console.log('Reply sent.');
		} else {
			console.log('Reply receiver is not online.');

			// store the reply for delivery. The reply will be delivered when the user connects.
			undeliveredReplies.push({senderPhoneNumber: replySenderPhoneNumber, senderName: replySenderName, receiver: replyReceiver, reply: reply});
			console.log('Reply saved for delivery.');
		}
	});
});

/* server end */
