var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* User model begin */

/**
 * create user schema and export
 */
exports.UserSchema = new Schema({
	phoneNumber: {type: String, required: true, index: {unique: true}},	// phone number of the user.
	name: String,	// the username which user chooses in the app.
	//password: String // a hashed phone number maybe.(to block unintended connections)
	devicePlatform: String,
	pushNotificationId: String
})

// add methods here.

// export user model
exports.UserModel = mongoose.model('user', exports.UserSchema);

/* User model end */


/* Reccommend Request Model begin */

/*Using String type for sender and receivers seems easier. 
 *Mongodb's find method can be used for finding user with the given id of the user -a string
 */
exports.RecommendRequestSchema = new Schema({
	id: 0,
	date: Date,
	from: String,
	to: [String],	// more than one receiver
	what: String,
	where: String,
	desc: String,
	forwardCount: 0
})

// add methods here.


exports.RecommendRequestModel = mongoose.model('request', exports.RecommendRequestSchema);

/* Reccommend Request Model end */

/* Reply Model start */
exports.ReplySchema = new Schema({
	requestId: 0,	// reply is sent to the request with id: requestId
	receiver: String,
	date: Date,
	sender: String,
	reply: String,
	requestForwardCount: 0
})

// add methods here.

exports.ReplyModel = mongoose.model('reply', exports.ReplySchema);
/* Reply Model end */

/* KeyValue Model start */

exports.KeyValueSchema = new Schema({
	key: String,
	value: String
})

exports.KeyValueModel = mongoose.model('keyValue', exports.KeyValueSchema);

/* KeyValue Model end */