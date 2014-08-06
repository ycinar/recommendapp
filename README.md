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

To run the server:
1. cd server
2. [sudo] node server[.js]

Notes on usage:
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
forwardedRequestInfo: use if the request is forwarded. must have fields: id, sentDate, sender, forwardCount
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

Libraries:
---------

- Client side libraries:

Some PhoneGap plugins used for this project:

			Plugin 									Documentation
	PhoneGap push notification plugin: https://github.com/phonegap-build/PushPlugin
	PhoneGap contacts plugin:		   http://docs.phonegap.com/en/3.0.0/cordova_contacts_contacts.md.html
	PhoneGap device plugin: 		   http://docs.phonegap.com/en/3.0.0/cordova_device_device.md.html
	PhoneGap SMS plugin:			   https://github.com/aharris88/phonegap-sms-plugin
	PhoneGap SocialShare plugin: 	   https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin

For a list of basic PhoneGap plugins and usage explanations: http://docs.phonegap.com/en/3.0.0/guide_cli_index.md.html , Add Features section
For a list of device types the plugins can be used with, check src/ files of the plugins.

- Server side libraries:

```
		Library														Info
	Node.js   --> Server-side Javascript, Website: http://nodejs.org/
	socket.io --> A node library enables real-time bidirectional event-based communication between server and client. Website: http://socket.io/
	MongoDB	  --> A NoSQL database. Detailed info on usage of MongoDB with Node.js: http://docs.mongodb.org/ecosystem/drivers/node-js/
	node-gcm  --> Node.js library for sending push notifications. Documentation: https://github.com/ToothlessGear/node-gcm
```

Installation Guide of The Server Side Libraries:

To install these server side libraries, on the command line use these commands:

```
[sudo] apt-get install nodejs --> For Node.js
[sudo] apt-get install npm    --> Node Package Manager, for downloading node libraries.
[sudo] npm install socket.io  --> For socket.io
[sudo] npm install mongodb 	  --> For MongoDB
[sudo] npm install node-gcm	  --> For push notifications with Google Cloud Messaging(For Android devices).
```
Note: Since the socket.io API has changed on 1.x versions, the project is NOT compatible with 1.x versions of socket.io. Works fine with socket.io <1.x . It is working fine with socket.io 0.9.16 on my machine.

To install a version of a library with npm:

```
[sudo] npm install <library>@<version> --> e.g. $ npm install socket.io@0.9.16
```

Some additional notes on Compiling and Testing the app:
---------

Compiling:

If you want to copy the project to another location, or make a fresh start with the project, you can either:

1- Copy all files including hidden files to the new location,
2- Create a new project using phonegap command line interface(http://docs.phonegap.com/en/3.0.0/guide_cli_index.md.html), move client/www to the new location, and add the necessary plugins using `phonegap local plugin add`.

Second one is a better option if you want to change some configuration settings.(App name, file names, ...)

Testing:

The app mostly tested on Android devices. You can find the Android executable apk(RecommendAppPushNotification-debug-unaligned.apk) under the client/platforms/android/ant-build/. If you want to test the app on other devices, you may need to use some additional libraries, accounts,... 

Some useful info on this issue:

- Client side: Plugins include source files for most of the os/device types(including Android, iOS, Blackberry, Windows Phone,...). (Refer to the plugin documentations if you need more info). So, they should be working fine with these devices.

- Server side: For sending push notifications to Android devices, we are now using GCM(Google Cloud Messaging) by using the Node library called "node-gcm"(For more info: https://github.com/ToothlessGear/node-gcm). If you want to use push notifications for other devices, you need to add the required libraries[, and files to the server side].

For example: 

Apple uses APNS(Apple Push Notification Service) for sending push notifications to iOS devices. To use APNS, you need to add an apns module to the Node server. An example of such module is node-apn.(https://github.com/argon/node-apn). After installing and providing required certificate files, this library can be used for sending push notifications to iOS devices. 

And to create APNS certificates, you can follow this tutorial: http://quickblox.com/developers/How_to_create_APNS_certificates

Debugging:
---------

For Android: adb's logcat is a very useful tool for following logs in runtime. But, to use the logs efficiently, you may need to silent the logs of other programs. To do this, use the commands:

```
cd path/to/android-sdk/platform_tools/
[sudo] ./adb logcat CordovaLog:D *:S	// CordovaLog on Debug mode, Others silent
```