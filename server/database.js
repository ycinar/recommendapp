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

/* drop database if you need */
//mongoose.connection.db.dropDatabase();
//console.log('Database in localhost/test dropped.');

/* database end */