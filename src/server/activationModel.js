var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var encrypt = require('mongoose-encryption');

// For encryption
// var encKey = process.env.RAND_32BYTE_BASE64_STRING_KEY;
// var sigKey = process.env.RAND_64BYTE_BASE64_STRING_KEY;

var secKey = process.env.SECRET_KEY;

var activSchema = new Schema({
  activCode: String,
  activEmail: String,
  activPassword: String,
  activDate: Date
});

activSchema.plugin(encrypt, {/* encryptionKey : encKey , signingKey : sigKey, */ secret: secKey, encryptedFields: ['activEmail','activDate']});
// This adds _ct and _ac fields to the schema, as well as pre 'init' and pre 
// 'save' middleware, and encrypt, decrypt, sign, and authenticate instance 
// methods.

var Activation = mongoose.model('activation', activSchema);
module.exports = Activation;
