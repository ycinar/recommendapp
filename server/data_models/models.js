var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* User model begin */

/**
 * create user schema and export
 */
exports.UserSchema = new Schema({
	userId: {type: String, required: true, index: {unique: true}},	// phone number of the user.
	username: String,	// the username which user chooses in the app.
	//password: String // a hashed phone number maybe.(to block unintended connections)
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
	from: String,
	to: [String],	// more than one receiver
	what: String,
	where: String,
	desc: String
})

// add methods here.


exports.RecommendRequestModel = mongoose.model('request', exports.RecommendRequestSchema);

/* Reccommend Request Model end */
