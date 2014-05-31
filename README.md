recommendapp
============

There are two main components: client and server. Client refers to the end user application, i.e. Android app or iPhone app. Server refers to the server application which stores data and undertakes the backend related tasks.

Client:
---------
Note that you need to have the PhoneGap/Cordova setup in order to build the client side.

Main client logic is located in client/www/. For example, we currently have index.html there.

In order to build:
1. cd client
2. cordova build

Server:
---------
Server side is a node.js application with MongoDB backend.

Some notes on usage:
---------
- For connecting to the server, client should call connectToServer() method of the server. Call syntax:

	socket.emit('connectToServer', username, password, savedUsername);

	@username: phone number of the user.
	@password: for blocking unintended connections. Should be synced with server's password.
	@savedUsername: the username which user chooses, shown in the app.

- For sending recommend requests, client should call sendRecommendRequest() method of the server. Call syntax:

	socket.emit('sendRecommendRequest', sender, receivers, what, where, description);

	@sender: the phone number of the request sender.
	@receivers: an array contains userId(phone numbers)s of the receivers.
	@what: the topic of the recommend request.
	@where: recommend is requested in the "where" area.
	@description: a brief description of the recommend request. 

- For getting recommend requests, client should implement getRecommendRequest() method. Method syntax:

	socket.on('getRecommendRequest', function(sender, what, where, description) {
		// incoming request handling code here.
	});

Important: The phone numbers and other variables in the function calls should be represented as Strings.
