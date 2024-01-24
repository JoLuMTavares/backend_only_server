var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var encrypt = require('mongoose-encryption');

// For encryption
// var encKey = process.env.RAND_32BYTE_BASE64_STRING_KEY
// var sigKey = process.env.RAND_64BYTE_BASE64_STRING_KEY

var secKey = process.env.SECRET_KEY;

var userSchema = new Schema({
	firstName: String,
	lastName: String,
	email: String,
	password: String,
	regDate: Date,
	lastLogDate: Date,
	active: Boolean
});

// console.log("First length -> ",encKey.length);
// console.log("The length -> ",sigKey.length);

userSchema.plugin(encrypt, {/* encryptionKey : encKey , signingKey : sigKey, */ secret: secKey, excludeFromEncryption: ['email','password'], additionalAuthenticatedFields: ['email']});
// This adds _ct and _ac fields to the schema, as well as pre 'init' and pre 
// 'save' middleware, and encrypt, decrypt, sign, and authenticate instance 
// methods.
// Only the password is excluded, for now.



var Users = mongoose.model('users', userSchema);
module.exports = Users;
