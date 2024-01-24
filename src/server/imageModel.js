var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var encrypt = require('mongoose-encryption');

// For encryption
// var encKey = process.env.RAND_32BYTE_BASE64_STRING_KEY
// var sigKey = process.env.RAND_64BYTE_BASE64_STRING_KEY

var secKey = process.env.SECRET_KEY;

// This is to declare foreign fields as ObjectId Types.
// The principle is similar to the foreign Keys in SQL.
const ObjectId = mongoose.SchemaTypes.ObjectId;

const ImageSchema = new Schema({
  type: String,
  name: String,
  size: Number,
  data: Buffer,
  encoding: String,
  md5: String,
  mimetype: String,
  user_id: ObjectId, // This works as foreign field for the connection to the users table
  note_id: ObjectId // Also a foreign field for the notes table
});

ImageSchema.plugin(encrypt, {/* encryptionKey : encKey , signingKey : sigKey, */ secret: secKey, excludeFromEncryption: ['user_id', 'note_id']});
// This adds _ct and _ac fields to the schema, as well as pre 'init' and pre 
// 'save' middleware, and encrypt, decrypt, sign, and authenticate instance 
// methods.

var Images = mongoose.model('images', ImageSchema);
module.exports = Images;