recommendapp
============

There are two main components: client and server. Client refers to the end user application, i.e. Android app or iPhone app. Server refers to the server application which stores data and undertakes the backend related tasks.

Client:
---------
Note that you need to have the PhoneGap/Cordova setup in order to build the client side.

Main client logic is located in client/www/. For example, we currently have index.html there.

In order to build:
1. cd client
2. phonegap build

Note: The project is created by using PhoneGap 3.5.0-0.20.4

Server:
---------
Server side is a node.js application with MongoDB backend.

Some notes on usage:
---------
- For connecting to the server, client should call connectToServer() method of the server. Call syntax:

```
socket.emit('connectToServer', phoneNumber, password, name, devicePlatform, pushNotificationId);

phoneNumber: phone number of the user.
password: for blocking unintended connections. Should be synced with server's password.
name: the name which user chooses, shown in the app.
devicePlatform: the platform of the device.
pushNotificationId: id for sending push notifications.
```

- For sending recommendation requests, client should call sendRecommendRequest() method of the server. Call syntax:

```
socket.emit('sendRecommendRequest', receivers, what, where, description, forwardedRequestInfo);

receivers: an array contains userId(phone numbers)s of the receivers.
what: the topic of the recommend request.
where: recommend is requested in the "where" area.
description: a brief description of the recommend request.
forwardedRequestInfo: use if the request is forwarded. must have fields: id, sentDate, sender
```

- For getting recommendation requests, client should implement getRecommendRequest() method. Method syntax:

```
socket.on('getRecommendRequest', function(recommendRequest) {
	// incoming request handling code here.
});

recommendRequest: Check the server code for recommendRequests's fields.
```

- For checking if the contacts of the user use the app, user should call checkContactsOnApp() method of the server. Call syntax:

```
socket.emit('checkContactsOnApp', contacts);

contacts: contact list of the user.
```
The server then, sends the checked contacts back to the user. To get this contacts, user should implement updateUsersOnApp() method.
Method syntax:

```
socket.on('updateUsersOnApp', function(contacts) {
	// handle the contacts array containing contacts with onApp fields.
});
```