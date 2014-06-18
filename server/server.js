/* import database.js */
var db = require('./database');

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
function findUserIndex(phoneNumber) {
	for (var i = 0; i < onlineUsers.length; i++) {
		if (onlineUsers[i].user.phoneNumber == phoneNumber) {
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
var Reply = models.ReplyModel;
var KeyValue = models.KeyValueModel;

/* get the recommendRequestCounter from db. It is used for giving ids to the requests. */
var recommendRequestCounter;

KeyValue.findOne({key: 'recommendRequestCounter'}, function (err, variable) {
	if (err) {
		return console.error(err);
	}
	if (!variable) {	// couldn't find the variable.
		/* create new one and save */
		var counter = new KeyValue({key: 'recommendRequestCounter', value: '0'});
		counter.save(function (err) {
			return console.error(err);
		});
	} else {	// update recommendRequestCounter
		recommendRequestCounter = variable;
		console.log('Recommend request counter value: ' + recommendRequestCounter.value);
	}
});


var onlineUsers = [];
var undeliveredRequests = [];
var undeliveredReplies = [];

var io = require('socket.io').listen(8080);

io.sockets.on('connection', function (socket) {

	var _connectionAccepted = false; // boolean showing if the connection is valid. updated in connectToServer() function.
	var _phoneNumber = '';
	var _name = '';

	// @TODO: 	Add _connectionAccepted checks for all functions.
	/**
	 * The function for server connection, used by user.
	 * @phoneNumber: phone number of the user.
	 * @password: for blocking unintended connections, should be synced with server's password
	 * @name: the username which user chooses, shown in the app.
	 */
	socket.on('connectToServer', function (phoneNumber, password, name) {

		if (!password) {	// no password, no connection.
			console.log('Connection refused. Reason: no password.');
			socket.disconnect();
			return;
		}

		// calculate the real password.
		actualPass = generatePassword(phoneNumber);

		// check if actual pass is equal with the incoming user's pass
		if (actualPass !== parseInt(password)) {	// doesn't match, no connection.
			console.log('Connection refused. Reason: wrong password.');
			socket.disconnect();
			return;
		}

		console.log('Connection accepted, passwords match.');

		// we have a valid connection.
		_connectionAccepted = true;
		
		var connectedUser = new User({phoneNumber: phoneNumber, name: name});

		// add connected user to the online users array with its socketId.
		onlineUsers.push({user: connectedUser, socketId: socket.id});

		console.log('New user has been added to the online user array.');

		// display online users.
		console.log('Online users:');
		console.log(onlineUsers);
		
		// update global variables.
		_phoneNumber = phoneNumber;
		_name = name;

		console.log('_phoneNumber updated to ' + phoneNumber);
		console.log('_name udpated to ' + name);

		// check if the connected user was in the database.
		User.findOne({phoneNumber: phoneNumber}, function(err, user) {
			if (err) {
				console.error(err);
				return;
			}
				
			console.log(user);	// print out the user matching in the database.

			if (!user) {	// no user matching in the database.

				/* save user in the database. */
				console.log('DB: No user matching.');
				console.log('DB: Saving the user.');

				if (!name) {
					name = '';	// default username.
				}

				console.log(connectedUser);

				connectedUser.save(function (err) {
					if (err) {
						return console.error(err);
					}
					console.log('DB: New user: ' + 'username: ' + connectedUser.phoneNumber + ' name: ' + connectedUser.name + ' saved.');
				});
			} else {	// found the user in the db.
				console.log('DB: The user is already registered in the database.');
				console.log('DB: Checking for update.');

				/* update the username if a new one is provided. */
				if (user.name != name) {
					console.log('New username provided. Updating...');
					user.name = name;
					user.save(function (err) {	// save the updated user.
						if (err) {
							return console.error(err);
						}
						console.log('DB: Updated. New name: ' + name + ' for phone number: ' + phoneNumber);
					});
				} else {
					console.log('DB: No need to update.');
				}
				
				/* if the user is found in the db, there may some requests to him undelivered */
				/* if there is any undelivered request to the user, send to him. */

				// NOTE: can be written in another method.
				for (var requestIndex = 0; requestIndex < undeliveredRequests.length; requestIndex++) {

					var request = undeliveredRequests[requestIndex];
					var indexOfUser = request.receivers.indexOf(phoneNumber);	// find the user in the array.

					if (indexOfUser !== -1) {	// there is an undelivered request for user.
						console.log('Undelivered Request for new connecting user ' + phoneNumber);
						io.sockets.socket(socket.id).emit('getRecommendRequest', {id: request.id, date: request.date, from: request.from, what: request.what, where: request.where, description: request.description});	// send the request.
						console.log('Delivered.');
						request.receivers.splice(indexOfUser, 1);	// clean the user from the list, because the request has been sent.

						/* if there is no user waiting for delivery, delete the request from the request array. */
						if (request.receivers.length == 0) {
							undeliveredRequests.splice(requestIndex--, 1);	// length has shrinked, so decrease requestIndex before loop update.
						}
					} else {
						console.log('Not an undelivered request for new connecting user.');
					}
				}

				/* there may also be some undelivered replies for the user, deliver them */
				// NOTE: can be written in another method.
				for (var replyIndex = 0; replyIndex < undeliveredReplies.length; replyIndex++) {
					var reply = undeliveredReplies[replyIndex];
					if (reply.receiver == phoneNumber) {	// there is an undelivered reply for new connecting user.
						io.sockets.socket(socket.id).emit('getReply', reply.requestId, reply.senderPhoneNumber, reply.reply);
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
	 * @receivers: an array contains userId(phone numbers)s of the receivers.
	 * @what: the topic of the recommend request.
	 * @where: recommend is requested in the "where" area.
	 * @description: a brief description of the recommend request. 
	 */
	socket.on('sendRecommendRequest', function (receivers, what, where, description) {
		if (!_connectionAccepted) {	// invalid connection, disconnect.
			socket.disconnect();
			return;
		} else {	// we have a valid connection.

			var recommendRequest = new RecommendRequest({id: parseInt(recommendRequestCounter.value), date: new Date(), from: _phoneNumber, to: receivers, what: what, where: where, desc: description});
		
			console.log('Coming recommend request: ' + recommendRequest);

			/* first, save the request in the db. */
			recommendRequest.save(function (err) {
				if (err) {	// if any error occures.
					return console.error(err);
				}
				console.log('DB: New recommend request ' + recommendRequest + ' saved.');
			});

			/* save the recommend request also on the phone. need to use the id, so do it now. */
			socket.emit('saveSentRecommendRequest', recommendRequest);

			
			/*  send request to all receivers: if they are online, send now; else, add to the undelivered request array */
			var undeliveredRequestReceivers = [];

			for (var i = 0; i < receivers.length; i++) {
				var receiverIndex = findUserIndex(receivers[i]);	// find user index in the onlineUser array.
				if (receiverIndex !== -1) {	// user is online.

					var receiverSocketId = onlineUsers[receiverIndex].socketId;

					// send request to the specific user which is identified by its socket id in the server.
					io.sockets.socket(receiverSocketId).emit('getRecommendRequest', {id: parseInt(recommendRequestCounter.value), date: recommendRequest.date, from: _phoneNumber, what: what, where: where, description: description});

				} else {	// user is not online.
					undeliveredRequestReceivers.push(receivers[i]);
				}
			}
			if (undeliveredRequestReceivers.length !== 0) {	// some of the users are not online, some messages couldn't be delivered.
				console.log('Receivers ' + undeliveredRequestReceivers + ' are not online for request ' + recommendRequest);
				undeliveredRequests.push({id: parseInt(recommendRequestCounter.value), date: recommendRequest.date, from: _phoneNumber, what: what, where: where, description: description, receivers: undeliveredRequestReceivers});
				console.log('Undelivered Requests: ');
				console.log(undeliveredRequests);
				console.log('Request saved for delivery to not online users');
			} else {
				console.log('All receivers are online, and recommend requests has been sent.');
			}

			/* increase the counter and save. */
			recommendRequestCounter.value = (parseInt(recommendRequestCounter.value) + 1) + '';	// increase the counter by 1

			recommendRequestCounter.save(function (err) {
				if (err) {
					return console.error(err);
				}
				console.log('Request counter updated to: ' + recommendRequestCounter.value);
			});
		}
	});
	/*
	 * The function called by the socket.io when a user disconnects.
	 */
	socket.on('disconnect', function () {
		/* clear the user from the onlineUsers array */
		console.log('User has been disconnected');
		var indexOfDisconnectedUser = findUserIndex(_phoneNumber);
		if (indexOfDisconnectedUser == -1) {
			console.log('Couldnt find the disconnected user. The user id was ' + _phoneNumber);
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
	socket.on('sendReply', function (requestId, replyReceiver, reply) {
		if (!_connectionAccepted) {	// invalid connection, disconnect.
			socket.disconnect();
			return;
		} else {
			var reply = new Reply({requestId: requestId, date: new Date(), sender: _phoneNumber, reply: reply});
			reply.save(function (err) {
				if (err) {	// if any error occures.
					return console.error(err);
				}
				console.log('DB: New reply ' + reply + ' saved.');
			});
			console.log('Sending reply.');
			var replyReceiverIndex = findUserIndex(replyReceiver);
			if (replyReceiverIndex != -1) {	// the reply receiver is online.
				var receiverSocketId = onlineUsers[replyReceiverIndex].socketId;
				io.sockets.socket(receiverSocketId).emit('getReply', reply);
				console.log('Reply sent.');
			} else {
				console.log('Reply receiver is not online.');

				// store the reply for delivery. The reply will be delivered when the user connects.
				undeliveredReplies.push({requestId: requestId, senderPhoneNumber: _phoneNumber, receiver: replyReceiver, reply: reply});
				console.log('Reply saved for delivery.');
			}
		}
	});

	/*
	 * @TODO: Write the function from scratch. User listesinden gelen telefon numalarini kullanarak database'de
	 * olup olmadiklarina bak user'larin.
	 * The function used for answering 'Is the user using the recommendApp?' question.
	 */
	socket.on('checkContactsOnApp', function (contactList) {
		var resultContactList = [];
		var validPnCounter = 0;
		for (var contactIndex = 0; contactIndex < contactList.length; contactIndex++) {
			var contact = contactList[contactIndex];
			if (contact.phoneNumbers != null) {
				for (var pnIndex = 0; pnIndex < contact.phoneNumbers.length; pnIndex++) {
					validPnCounter++;
					// use a new scoped function to deal with the async. calls.
					(function () {
						// store all needed data.
						// @TODO: find a better way for coping with the async. calls.
						var contactWrapped = contact;
						var pnIndexWrapped = pnIndex;
						var contactIndexWrapped = contactIndex;
						var phoneNumberWrapped = contactWrapped.phoneNumbers[pnIndexWrapped];
						User.findOne({phoneNumber: phoneNumberWrapped}, function (err, contactFromDb) {
							if (err) {
								return console.error(err);
							}
							var onApp = contactFromDb ? true : false;
							resultContactList.push({displayName: contactWrapped.displayName, phoneNumber: phoneNumberWrapped, onApp: onApp});
							console.log('Phone number: ' + phoneNumberWrapped);
							/* if we have reached to the end of the loop, call client's function to send the result. */
							if (--validPnCounter == 0) {
								console.log('DB: Result contact list: ');
								console.log(resultContactList);
								socket.emit('updateUsersOnApp', resultContactList);
							}
						});
					})();	// call the function.
				}
			}	
		}
	}); 
});

/* server end */
