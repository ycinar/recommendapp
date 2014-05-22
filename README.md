recommendapp
============

There are two main components: client and server. Client refers to the end user application, i.e. Android app or iPhone app. Server refers to the server application which stores data and undertakes the backend related tasks.

Client:
Note that you need to have the PhoneGap/Cordova setup in order to build the client side.

Main client logic is located in client/www/. For example, we currently have index.html there.

In order to build:
cd client
cordova build

Server:
Server side is a node.js application with MongoDB backend.
