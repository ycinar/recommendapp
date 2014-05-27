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

exports.RequestSchema = new Schema({
	from: Schema.Types.ObjectId,
	to: [Schema.Types.ObjectId],	// more than one receiver
	what: String,
	where: String,
	desc: String
})

// add methods here.


exports.RequestModel = mongoose.model('request', exports.RequestSchema);

/* Reccommend Request Model end */
