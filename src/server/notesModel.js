var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var encrypt = require('mongoose-encryption');

// For encryption
// var encKey = process.env.RAND_32BYTE_BASE64_STRING_KEY
// var sigKey = process.env.RAND_64BYTE_BASE64_STRING_KEY

var secKey = process.env.SECRET_KEY;

var noteSchema = new Schema({
	title: String,
	body: String,
	user_id: Schema.Types.ObjectId,
	author: String,
	/* img_id: Schema.Types.ObjectId,
	audio_id: Schema.Types.ObjectId,
	video_id: Schema.Types.ObjectId, */
	createdDate: Date,
	lastEditedDate: Date
});

noteSchema.plugin(encrypt, {/* encryptionKey : encKey , signingKey : sigKey, */ secret: secKey, excludeFromEncryption: ['user_id']});
// This adds _ct and _ac fields to the schema, as well as pre 'init' and pre 
// 'save' middleware, and encrypt, decrypt, sign, and authenticate instance 
// methods.

var Notes = mongoose.model('notes', noteSchema);
module.exports = Notes;
