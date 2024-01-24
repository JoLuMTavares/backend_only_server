/**
 * This module contains operations to be called by the server.js.
 */

// Calling the global function that includes all the needed functions
let config = require('../config.json');

// Important to read files
const fs = require('fs');

// Important to correct file location
var path = require('path');

require('dotenv').config();

// A body parser
const bodyParser = require('body-parser');

// Special packages for video files upload
const mongoose = require('mongoose');
const multer = require('multer');

// Important for the data
const streamBuffers = require('stream-buffers');

const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

// Built-in Node.js package
const crypto = require('crypto');
// const { ObjectId } = require('mongodb');


// Importing the cache of notes module
const NotesCache = require('./notesCache');
const { allowedNodeEnvironmentFlags } = require('process');

//  const pkFile = require('../keys/private.pem');

// Keeping the private and public keys
const privateKey = fs.readFileSync(path.resolve('src/ssl/keys/private.key'), {
  encoding: 'utf8'
});
// const privateKey = fs.readFileSync(path.resolve('src/ssl/keys/private.pem'), { encoding: 'utf8' });

const publicKey = fs.readFileSync(path.resolve('src/ssl/keys/public.key'), {
  encoding: 'utf8'
});
// const publicKey = fs.readFileSync(path.resolve('src/ssl/keys/public.pem'), { encoding: 'utf8' });

module.exports = function (app) {
  // Using a variable to the module initialization
  // var dbConnection = new dbConn();

  const express = require('express');

  // Definition of the user object (the content)
  const Users = require('./usermodel.js');

  // For  uploading files
  const fileUpload = require('express-fileupload');

  // Definition for the text (from the note) object
  const Notes = require('./notesModel.js');

  // Definition for the image object (type and content)
  const Images = require('./imageModel.js');

  const ImageFiles = require('./imageFileModel.js')


  // Definition for any file object (when larger than 16 MB)
  // const Files = require('./fileModel.js');

  // Important for searching IDs in MongoDB
  const ObjectId = require('mongodb').ObjectId;
  // VERY IMPORTANT! ObjectID has been depcricated in
  // favor of ObjectId

  // For the activation of a new account
  const Activation = require('./activationModel.js');

  // For sending emails to the user
  const sendMail = require('./nodeMailerModel.js');

  // Important to provide session and cookie for each user
  const session = require('express-session');
  const cookieParser = require('cookie-parser');

  /** Important constant for the password encryption.
   * This increases the security since that the
   * password can be stored on the database with
   * encryption. Even a hacker tries to still the
   * password, it will be an extremely hard task
   * to go through all this encryption and find
   * the right characters the represent the password.
   *
   * */
  const bcrypt = require('bcrypt');


  /**
   * Creating a 96-byte Customer Master Key and saving it to a file.
   */
  try {
    fs.writeFileSync("master-key.txt", crypto.randomBytes(96));
  } catch (err) {
    console.error(err);
  }
  
  // Making the database connection
  //  dbConn();

  // Even though we already have a connection this is needed for the
  // video streaming
  //  const mongoURI = 'mongodb://localhost/noteAdmin';
  // const mongoURI =
  //   'mongodb+srv://sa:mongo@notes.qxknm3e.mongodb.net/?retryWrites=true&w=majority';
  const mongoURI = process.env.REACT_APP_MONGO_URI;
  // Connection attempt
  try {
    mongoose.connect(mongoURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    // console.log('Connected to the online database...');
  } catch (error) {
    // handleError(error); Not defined yet
    console.log(error);
  }

  process.on('unhandledRejection', (error) => {
    console.log('unhandledRejection', error.message);
  });


  // Using the fileUpload constant
  app.use(fileUpload());

  // Using the cookieParser and session for the connection to
  // the user
  app.use(cookieParser());
  app.use(
    session({
      secret: 'mySecretKey',
      resave: true,
      saveUnitialized: true,
    })
  );

  // BODY PARSER AND METHOD OVERRIDE
  app.use(bodyParser.json());
  app.use(methodOverride('_method'));

  /** ++++++++++++ PREVIOUS VERSION WITH JWT ++++++++++++ */

  // For random string generation
  const randomstring = require('randomstring');

  // All this modules are important for the JSON Web Token use
  const jwt = require('jsonwebtoken');
  const cors = require('cors');
  // These next two modules provide the possibility of an authentication using
  // JSON web token (instead of sessions)

  const passport = require('passport');
  const passportJWT = require('passport-jwt');

  // Options for the right connection to be accepted (front the front end server)
  const corsOptions = {
    origin: `${config.host}`,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    credentials: true,
  };

  // Important instruction - extractor - to accept a request object as an
  // argument and return the enconded JWT string (or null)
  const ExtractJwt = passportJWT.ExtractJwt;
  // Controlling how the token is extracted (or verified) from the request
  const JwtStrategy = passportJWT.Strategy;
  const jwtOptions = {};

  // The jwtFromRequest is a function that accepts a request as the only parameter
  // and returns either the JWT as a string or null.
  // In this case, the return comes from the function - fromAuthHeaderAsBearerToken
  // This last function creates a new extractor that looks for the JWT in the
  // authorization header with the scheme 'bearer'
  jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  jwtOptions.secretOrKey = 'futureProjects2047FutureWay'; // 'futureProjects2047FutureWay'; // Secret key or master key
  // when needed

  // Black list for users that logged out
  const tokenBlacklist = [];

  /**
   * Strategy for checking how is the black list. Every time this is used,
   * the black list gets a reset. This is because every time a login is made,
   * new tokens are assigned. Therefore, it's important to discard the tokens
   * that are not needed anymore.
   * The jwt_payload is an object literal containing the decoded JWT payload.
   */
  const strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
    tokenBlacklist.forEach((internalId) => {
      if (internalId === jwt_payload.internalId) {
        return next(null, false);
      }
    });
    /**
     * For the list of store users here, each one has a comparison of the id
     * with the one from the jwt_payload. If it matches, the internal id of
     * of jwt_payload is assigned to the internal id of the user.
     */

    // // console.log(jwt_payload.id);
    Users.findById(jwt_payload.id, (err, user) => {
      if (err) {
        return next(null, false);
      } else {
        return next(null, user);
      }
    });
  });

  passport.use(strategy); // Using the created strategy above

  app.use(cors(corsOptions)); // Using the options for the connection
  app.use(passport.initialize()); // Initialization of the control

  // Also very important. Otherwise, the logout doesn't work and
  // returns always 401 error to the client-side (even if the right user
  // sent the logout request).
  app.use(passport.session());

  /** +++++++++++++++++ THE CURRENT VERSION +++++++++++++++++ */

  /**
   * This function checks if there's an existent session
   * and if it's the administrator.
   */
  this.auth = (req, res, next) => {
    if (req.session && req.session.admin === true) {
      return next();
    } else {
      return res.send(401);
    }
  };

  /**
   * This function checks if, for the given object, there is already a row  in
   * the designated collection or not. It takes as parameters the 'Schema' and
   * the parameter. If nothing is found, it returns empty.
   */
  this.findRow = (objectSchema, parameter) => {
    Users.findOne(parameter, function (err, result) {
      if (result) return result;
    });
    return '';
  };

  /**
   * This function returns the found user according to
   * a given parameter.
   *
   * @param {*} parameter
   * @returns
   */
  this.findUser = async (parameter) => {
    const user = await Users.findOne(parameter);
    // console.log(user);
    return user;
  };
  /**
   * This function converts a normal string to a
   * another one with very different characters.
   * Very important for security and specially
   * useful for passwords stored in databases.
   * The length of the new string may vary,
   * depending on the chosen number.
   */
  this.createHashString = (str) => {
    // Using the bcrypt for the string encryption
    bcrypt.hash(str, 10, function (err, hashedString) {
      if (hashedString) return hashedString;
    });
  };

  /**
   * This function performs the Hash comparison
   * between the given password and the one stored
   * on the database. It uses the bcrypt for the specific comparison.
   */
  Users.comparePassword = (givenPwd, storedPwd) => {
    if (givenPwd === undefined && storedPwd === undefined) return true;
    else {
      bcrypt.compare(givenPwd, storedPwd, function (err, result) {
        if (result) return true;
      });
    }
    return false;
  };

  /**
   *
   * This function performs the token validation.
   * Here, the token is verified by the use of JWT and with a stored
   * public key. If there's a user id store in this token that matches
   * the given user id, then token is valid. Otherwise it's false.
   * This is to prevent fake requests.
   *
   * @param {*} token
   */
  this.tokenValidation = (userid, token) => {
    try {
      // First, the important confirmation with the public key
      // Basically, with this confirmation, the user informaiton is extracted
      const user = jwt.verify(token, publicKey, { algorithm: 'RS512' });

      // Then comparing if the sent id matches the one store in the token
      if (userid === user.id) return { error: 0, ...user };
    } catch (error) {
      // If the JWT is unauthorized, the error is sent back
      if (error instanceof jwt.JsonWebTokenError)
        return { error: 401, message: error };
      // If this was a bad request after all, also the error is sent back
      else return { error: 400, message: error };
    }
  };

  var conn = mongoose.connection;

  Grid.mongo = mongoose.mongo;

  var gfs, gridfsBucket;

  conn.once('open', function () {
    console.log('open');
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads',
    });
    gfs = Grid(conn.db, mongoose.mongo);
    // The name of bucket to store the files
    gfs.collection('uploads');
  });

  //to parse json content
  app.use(express.json());
  //to parse body from url
  app.use(
    express.urlencoded({
      extended: false,
    })
  );

  // The storage engine creation
  const theStorage = GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      console.log('If this message is shown, some execution must be happening');
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err)
            // Returning  directly in case of found error
            return reject(err);

          // const filename = file.originalname;
          // The video name
          const fileName =
            buf.toString('hex') + path.extname(file.originalname);
          // const fileName = file.originalname;

          // The video structure to be stored in the database
          const fileInfo = {
            file_name: fileName,
            bucketName: 'filesBucket',
          };

          console.log(fileInfo);
          return resolve(fileInfo);
        });
      });
    },
  });


  const upload = multer(); // Now without arguments

  /* ++++++++++ The initial user registry process ++++++++++

    It's important to first check if all elements were inserted.
    Then the passwords need to match. After that the information
    is temporarily stored on another collection. Then an email
    is sent to the user. This one will have to click on the
    confirmation link to finish the account activation.

  */
  app.post('/register', (req, res) => {
    // Checking if the email and password were sent
    if (!req.body.email) {
      return res.send({ error: 10227, message: 'Email required!' });
    } else if (!req.body.password) {
      return res.send({ error: 10290, message: 'Password required!' });
    } else if (!req.body.password2) {
      return res.send({
        error: 10315,
        message: 'Please, repeat the password!',
      });
    } else if (req.body.password.toString() !== req.body.password2.toString()) {
      return res.send({ error: 10384, message: `The passwords don't match!` });
    }

    // Also important to check if the user already exists
    Users.findOne({ email: req.body.email.toLowerCase() }, function (err, user) {
      if (user)
        return res.send({
          error: 20000,
          message:
            `There's already an existent user with the inserted information`,
        });

      // Continuing if no existent user is found...

      // New string generation just for the activation code
      let newCode = randomstring.generate(24); // 24 characters

      // Generating an encrypted hash for the password
      // This way no hacker gets the password, since it's hashed.

      bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {
        // console.log('Hashed password: ' + hashedPassword);

        let now = new Date(); // Date for the current registry process

        // New activation user object creation
        let newActivation = new Activation({
          activCode: newCode,
          activEmail: req.body.email.toLowerCase(),
          activPassword: hashedPassword,
          activDate: now,
        });

        // console.log(newActivation);
        // Saving the object on the 'activation' collection
        // Then sending the activation code and the target email
        newActivation.save(function (err, newRecord) {
          if (err) return res.send({ error: err });

          // Sending the email with the activation link
          sendMail.sendMail(
            newRecord.activEmail,
            'no-reply. Account activation',
            `<!doctype html>
            <html>
              <head>
                <meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>
              </head>
              <body style='font-family: sans-serif;'>
              <div style='display: block; margin: auto; max-width: 1024px;' class='main'>
                <h1 style='font-size: 18px; font-weight: bold; margin-top: 20px'>Thank you for your registration.</h1>
                <br>
                Your given email address: ${newRecord.activEmail}<br>
                Please verify your account activation by clicking on the following link: <br>
                <a href=${config.host}/management/?activate=${newRecord.activCode}>${config.host}/management/?activate=${newRecord.activCode}</a><br><br>

                Please, do not reply to this email.<br>

                If you didn't ask for this email, we apologize for the inconvenience.<br><br>

                With best regards,<br><br><br>

                Notes Corp.
              </div>
              </body>
            </html>`
          );

          return res.send({ error: 0 });
        });
      });
    });
  });

  /**
   * This function makes the permanent account activation.
   * First checks on the 'activation' collection if there's
   * a user with the matching sent code by the front-end
   * side. If so, it creates a new schema to be recorded
   * in the 'users' collection (creating this last one if it
   * doesn't already exist). The it also deletes the information
   * of the user stored on the 'activation' collection.
   */
  app.get('/activate', function (req, res) {
    // Checking the inserted information
    if (!req.query.code)
      return res.send({ error: 'One or more fields missing!' });

    let actQuery = { activCode: req.query.code };
    // Finding the right user
    Activation.findOne({ activCode: req.query.code }, function (err, user) {
      if (err || user === undefined || user === null)
        return res.send({ error: 10020, message: 'No activation code found!' });

      let newDate = new Date(); // Date for the account activation

      // New schema
      let newUser = new Users({
        firstName: '',
        lastName: '',
        email: user.activEmail,
        password: user.activPassword,
        regDate: newDate,
        lastLogDate: newDate,
        active: true,
      });

      // Saving the new user

      newUser.save(function (err, theNewUser) {
        if (err) return res.send({ error: err });

        req.session.user = theNewUser.email;
        // Deleting the pre-activation information about the new user
        Activation.deleteOne(actQuery, function (err, user) {
          if (err) return res.send({ error: err });
        });

        // Sending the response to the front-end server.
        return res.send({ ...theNewUser, error: 0 });
      });
    });
  });

  /**
   * This function performs the user login. First, it confirms
   * if the username (which is the user email address) and the
   * password were sent.
   * Then it checks if there's a registered user with the sent
   * data. But the password comparison is made with bcrypt.
   * This ensures security.
   * After that, a payload object is generated. This one will
   * be part of a generated Token, that also contains the
   * already created privateKey and an experation time of one
   * day. The information about the logged user is saved in
   * the database and it's also sent, with the generated token,
   * to the front server.
   * When the user is logged, any requested operation is
   * checked with the token and the public key (not the private
   * one).
   */
  app.post('/login', (req, res) => {
    // Checking if the email and password were sent
    if (!req.body.email) {
      return res.send({ error: 10001, message: 'Email required!' });
    } else if (!req.body.password) {
      return res.send({ error: 10002, message: 'Password required!' });
    }

    // 1. find usr pwd combo on db
    Users.findOne(
      { email: req.body.email.toLowerCase() },

      function (err, user) {
        if (!user)
          return res.send({ error: 10012, message: 'User not found!' });

        bcrypt.compare(
          req.body.password,
          user.password,
          function (err, result) {
            if (result) {
              // 2. create a session
              req.session.user = req.body.email;
              req.session.admin = true;

              user.lastLogDate = new Date();

              // Creation of a payload object, having the
              // user, id and a random generated string
              const payload = {
                user: user.email,
                id: user.id,
                internalId: randomstring.generate(10),
              };

              /* const token = jwt.sign(payload, jwtOptions.secretOrKey, {
              algorithm: 'HS512',
              expiresIn: '1d'
            }); */

              /*
              Token creation using the RS512 (RSA) method.
              It's not possible to use the ESCDA (or ES512 or edd448)
              because javascript can't read .pem files. Also openssl
              is not converting the .pem file to a .p12 (readable) file.
            */
              const token = jwt.sign(payload, privateKey, {
                expiresIn: '1d', // 1 day validity
                algorithm: 'RS512',
              });

              // Saving the user information and sending this
              // same data to the frontend server
              user.save(function (err, loggedUser) {
                if (err) return res.send({ error: err });

                return res.send({
                  ...loggedUser,
                  id: user.id,
                  user: user.email,
                  lastLoginDate: user.lastLogDate,
                  token: token,
                  error: 0,
                });
              });
            }
            // If the password was incorrect, an error message
            // is sent
            else return res.send({ error: 10013, message: 'Invalid password!' });
          }
        );
      }
    );
  });

  /**
   * This function gets the information about the user
   * and returns it to the front-end side.
   *
   */
  app.get(
    '/userinfo',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
      // Checking the inserted information
      if (!req.query.user) return res.send({ error: 'User id is missing!' });

      // Setting the object id as the parameter
      let objId = new ObjectId(req.query.user);
      // Sending the request to the database
      Users.findOne({ _id: objId }, function (err, user) {
        if (!user)
          // Returning error if the user is not found in the database
          return res.send({ error: 10012, message: 'User not found!' });

        // Object to have the user and, if exists, the image information
        let userInfo = {};

        // Getting the associated image by the user id
        Images.find({ user_id: user.id }, (err, image) => {
          // If there was an error
          if (err) return res.send({ error: err });

          // It may also return an empty element
          if (image.length !== 0) {
            // Otherwise we need the last object from the array.
            // An array because there may be many images related to one user
            // Here is the type of image
            var contentType = image[image.length - 1]._doc.type;

            // Getting here the main data from the image and converting it to a
            // String using the Buffer function and base64 option.
            var base64 = Buffer.from(
              image[image.length - 1]._doc.data
            ).toString('base64');

            // Associating the important information
            base64 = `data:${contentType};base64,` + base64;

            // Creating an object with the user, the image and the base64 String
            userInfo = { user: user, image: image[image.length - 1], base64 };
          }
          // If no image was found, then only the user information counts
          else userInfo = { user: user };

          // Sending back the response
          return res.send({ error: 0, ...userInfo });
        });
      });
    }
  );

  /**
   * This function checks, in case there is a password update intention,
   * if all the data is correct. For each wrong situation, a different
   * number is returned.
   */
  this.checkPasswords = (currPwd, newPwd, repPwd, pwdComparison) => {
    if (newPwd !== '' && newPwd !== undefined) {
      if (!pwdComparison) return 11;
      else if (newPwd.length < 8) return 12;
      else if (
        repPwd === '' ||
        repPwd === undefined ||
        newPwd.toLowerCase() !== repPwd.toLowerCase()
      )
        return 13;
    }
    // The same must be done to the repeated password.
    // This is in case the user writes the password only on the second field
    else if (repPwd !== '' && repPwd !== undefined) {
      // Using the hash comparison to make shore the user really knows
      // the current password
      if (!pwdComparison) return 11;
      // If the current password is correctly written, then another
      // error returns since the user never wrote anything on the
      // 'New Password' field at first.
      else return 14;
    }
    // This is when the user doesn't want to change the password
    else if (
      (newPwd === undefined && repPwd === undefined) ||
      (newPwd === '' && repPwd === '')
    )
      return 15;
    // If all the inserted information is correct, then '0' is the number to be returned
    return 0;
  };


  /**
   *
   * This function creates a new note. It must receive the main written text.
   * Also is important to receive the information about the user (to be the
   * correct and not a fake one).
   *
   * If images are uploaded, they will be saved with the corresponding ids
   * from the user and the newly created note.
   *
   */
  app.post('/notecreation', async function (req, res) {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Also important to check if any text was here sent.
    if (!req.body.note)
      return res.send({ error: 50300, message: 'No given text!' });

    // Setting the object id as the parameter
    let objId = new ObjectId(req.query.userid);

    // console.log(JSON.parse(req.body.note));
    let newNote = JSON.parse(req.body.note);


    // Getting the user
    Users.findOne({ _id: objId }, function (err, user) {
      // Setting the date of this note creation
      let creationDate = new Date();

      // Setting up the text
      let note = new Notes({
        title: newNote.title,
        body: newNote.body,
        user_id: user.id,
        author: user.email,
        createdDate: creationDate,
        lastEditedDate: creationDate,
      });

      // Storing the new created note in the database
      note.save(async function (err, saved_note) {
        if (err) return res.send({ error: 1, errMessage: err, ...user });

        
        if (req.files !== undefined && req.files !== null) {
          
          // Confirming first if an array of images was sent
          if (Array.isArray(req.files.image) ) {

            const files = req.files.image;

            let images = [];
                        
            // A loop is performed to get the sent images
            // converted into ImageSchema
            files.forEach((file) => {

              // Setting up the image file
              let image = new Images({
                type: file.mimetype,
                name: file.name,
                data: file.data,
                encoding: file.encoding,
                md5: file.md5,
                mimetype: file.mimetype,
                user_id: user._id,
                note_id: saved_note._id,
              });

              images.push(image);

            });

            // After the loop is done, storing then 
            // the images in the database
            Images.create(images, function (err, saved_images) {
              if (err) return res.send({ error: 2, errMessage: err, ...user, ...saved_note });

              // Cleaning the cache before sending the confirmation
              NotesCache.removeNotesList(objId);

              // If weverything went fine, sending the confirmation
              return res.send({error: 0, ...user, ...saved_note, ...saved_images});
            });        
          }
          else {
            // In case only one single image was sent

            // Setting up the image file
            let image = new Images({
              type: req.files.image.mimetype,
              name: req.files.image.name,
              data: req.files.image.data,
              encoding: req.files.image.encoding,
              md5: req.files.image.md5,
              mimetype: req.files.image.mimetype,
              user_id: user._id,
              note_id: saved_note._id,
            });

            // Storing then the image in the database
            image.save(function (err, newImage) {
              if (err) return res.send({ error: 2, errMessage: err, ...user, ...note });

              // Cleaning the cache before sending the confirmation
              NotesCache.removeNotesList(objId);

              // If everything went fine, sending the confirmation
              return res.send({error: 0, ...user, ...saved_note, ...newImage});        
            });
          }
          
        }
        else {
          // Cleaning the cache before sending the confirmation
          NotesCache.removeNotesList(objId);
          
          // If no images were sent
          return res.send({error: 0, ...user, ...saved_note});
        }
      });
    });
  });

  /**
   * This function performs the creation of a note. When a note
   * creation request is sent, it first checks for the token
   * authorization. If this is valid, it checks for an existent
   * user by the given ID. If the user is found, the note is
   * created with the sent text.
   */
  app.post('/standardnotecreation', function (req, res) {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    // const token = req.header('authorization');
    const token = req.body.headers.Authorization;
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Also important to check if any text was here sent.
    if (!req.body.data.note)
      return res.send({ error: 50300, message: 'No given text!' });

    // Setting the object id as the parameter
    let objId = new ObjectId(req.query.userid);

    // console.log(JSON.parse(req.body.note));
    let newNote = JSON.parse(req.body.data.note);

    // console.log(note);
    // Getting the user
    Users.findOne({ _id: objId }, function (err, user) {
      // Setting the date of this note creation
      let creationDate = new Date();

      // Setting up the text
      let note = new Notes({
        title: newNote.title,
        body: newNote.body,
        user_id: user.id,
        author: user.email,
        createdDate: creationDate,
        lastEditedDate: creationDate,
      });

      // Storing the new created note in the database
      note.save(function (err, newNote) {
        if (err) return res.send({ error: err, ...user });

      // Cleaning the cache before sending the confirmation
      NotesCache.removeNotesList(objId);

      return res.send({error: 0, ...user, ...newNote});
      });
    });
  });


  /**
   *
   * This function updates an already stored note in the database.
   * It searches for the existent note in the database. Then it
   * updates this note and it adds more images, audios or videos,
   * if any of them was given.
   *
   *
   */
  app.put('/noteupdate', function (req, res) {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Also important to check if any text was here sent.
    if (!req.body.editedNote)
      return res.send({ error: 50300, message: 'No given text!' });

    // Setting the object id as the parameter
    let objId = new ObjectId(req.query.userid);

    // Getting the user
    Users.findOne({ _id: objId }, function (err, user) {
      // Sending the error if found.
      if (err) return res.send({ error: err });

      // Setting the date of this note creation
      let updateDate = new Date();
      // let newNote = JSON.parse(req.body.note);
      // Getting the edited note
      let editedNoteParsed = JSON.parse(req.body.editedNote);

      let noteObjId = new ObjectId(editedNoteParsed.id);

      // If the user is found, it's about making the update.
      // We find the right note by the id and update the body
      // and the date.
      Notes.updateOne(
        { _id: noteObjId },
        { $set: { body: editedNoteParsed.text, lastEditedDate: updateDate } },
        function (err, note) {
          // Sending the error if found.
          if (err) return res.send({ error: 1, errMessage: err, ...user });

          // If there were uploaded image files
          if (req.files !== undefined && req.files !== null && req.files.length !== 0) {
            
            // Confirming first if an array of images was sent
            if (Array.isArray(req.files.image) ) {

              const files = req.files.image;

              let images = [];
                          
              // A loop is performed to get the sent images
              // converted into ImageSchema
              files.forEach((file) => {

                // Setting up the image file
                let image = new Images({
                  type: file.mimetype,
                  name: file.name,
                  data: file.data,
                  encoding: file.encoding,
                  md5: file.md5,
                  mimetype: file.mimetype,
                  user_id: user._id,
                  note_id: noteObjId,
                });

                images.push(image);

              });

              // After the loop is done, storing then 
              // the images in the database
              Images.create(images, function (err, saved_images) {
                if (err) return res.send({ error: 2, errMessage: err, ...user, ...editedNoteParsed });

                // Cleaning the cache
                NotesCache.removeNote(noteObjId);
                NotesCache.removeNotesList(objId);

                // If weverything went fine, sending the confirmation
                return res.send({error: 0, ...user, ...editedNoteParsed, ...saved_images});
              });        
            }
            else {
              // In case only one single image was sent

              // Setting up the image file
              let image = new Images({
                type: req.files.image.mimetype,
                name: req.files.image.name,
                data: req.files.image.data,
                encoding: req.files.image.encoding,
                md5: req.files.image.md5,
                mimetype: req.files.image.mimetype,
                user_id: user._id,
                note_id: noteObjId,
              });

              // Storing then the image in the database
              image.save(function (err, newImage) {
                if (err) return res.send({ error: 2, errMessage: err, ...user, ...note });

                // Cleaning the cache
                NotesCache.removeNote(noteObjId);
                NotesCache.removeNotesList(objId);

                // If everything went fine, sending the confirmation
                return res.send({error: 0, ...user, ...editedNoteParsed, ...newImage});        
              });
            }
          }
          else {
            // Cleaning the cache
            NotesCache.removeNote(noteObjId);
            NotesCache.removeNotesList(objId);

            // Returning also the response when the note was sucessfully updated
            return res.send({ error: 0 });

          }
        });
    });
  });

  /**
   * This function deals with the file upload.
   * It receives a Form Data with the file, its name
   * and the user ID from the associated user.
   * The user is obtained from the users collection.
   * Then the ID is saved together with the image
   * information in the 'files' collection.
   */
  app.post('/imageUpload', function (req, res) {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Also important to check if any image was here sent.
    if (!req.files)
      return res.send({ error: 50300, message: 'No given file!' });


    // Setting the object id as the parameter
    let objId = new ObjectId(req.query.userid);

    // Getting the user
    Users.findOne({ _id: objId }, function (err, user) {
      // Setting up the file
      let imageFile = new ImageFiles({
        type: req.files.image.mimetype,
        name: req.files.image.name,
        data: req.files.image.data,
        encoding: req.files.image.encoding,
        md5: req.files.image.md5,
        mimetype: req.files.image.mimetype,
        user_id: user._id
      });

      imageFile.save(function (err, newImage) {
        if (err) return res.send({ error: err });

        return res.send({ error: 0, ...user, ...newImage });
      });
    });
  });

  /* app.post('/fileUpload', upload.single('userImage'), function (req, res) {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Also important to check if any image was here sent.
    if (!req.files)
      return res.send({ error: 50300, message: 'No given file!' });
    // Setting the file
    //  let uploadFile = req.files.file;
    //  const fileName = req.files.file.name;

    // Setting the object id as the parameter
    let objId = new ObjectId(req.query.userid);

    // Getting the user
    Users.findOne({ _id: objId }, function (err, user) {
      // Setting up the file
      let image = new Images({
        type: req.files.image.mimetype,
        name: req.files.image.name,
        data: req.files.image.data,
        user_id: user._id,
      });

      image.save(function (err, newImage) {
        if (err) return res.send({ error: err });

        return res.send({ error: 0, ...user, ...newImage });
      });
    });
  }); */

  /**
   * This function returns the list of stored notes in the database.
   * What needs to be sent is the id, title and text per each note.
   * The function, first, performs the token validation. So, if no
   * token was sent, this won't work.
   * If there are images associated to this note, only the first one
   * will be sent together. Both note and image are grouped in a set.
   * In the end, all the notes and the set of notes and images are
   * stored in a final array. This array will be the one sent to the
   * frontend server.
   *
  app.get('/notes', function (req, res) {

    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Setting the object id as the parameter
    let objId = new ObjectId(req.query.userid);


    // First, checking if there's a notes list array
    // stored in the cache
    const notesListArray = NotesCache.getNotesList(objId);

    if (notesListArray !== undefined && notesListArray !== null && notesListArray.length > 0) 
      // Sengind the notes list array immidiately to the frontend
      return res.send({ error: 0, notes: notesListArray[0] });
    
    else {

      // The final array to be sent to the frontend
      var notesArray = [];

      // Confirmation that the final array is inserted in the cache
      // var inserted = false;

      // Variable to control the array positions
      var i = 0;

      /**
       * If everythig is fine, all the notes associated to the
       * logged user will be shown. It's about finding all the
       * notes where the user Id matches the logged user id.
       *
       * From 17/05/2023 there's a new way. Important to get
       * the notes and the first, yes, the first image associated
       * to it, if there's any. But for now, all the associated
       * images come. For this to happen, the id of the note must
       * match the id of the note_id in the image. It's similar to
       * the relationship between tables in SQL where we have the
       * primary keys and foreign keys.
       *
       * Soon, we may need to limit the number of sets to be sent
       * to the frontend. Besides, it's never good to get all the
       * data stored.
       *
       * *
      Notes.aggregate([{
        $match : { user_id: objId } },
        { $lookup: {
            from: 'images',
            let: {'noteId': '$_id'},
            pipeline: [
                  { $match: {
                      $expr: {
                        $eq: [ '$note_id', '$$noteId' ]
                      }
                    }
                  }
                ],
            as: 'images'
          }
      }, /* {$limit : 10} * ], (err, notesList) => {
        if (!notesList)
          // Returning error if no notes are found in the database
          return res.send({ error: 401, message: 'No notes found!' });

        // As the data is encrypted in the database, it needs to be decrypted
        // first, before doing the necessary operations
        // notesList.decrypt((err) => {
        //   if (err)
        //     return res.send(err);
        // notesList.decryptFieldsSync();
          // Checking for every note, the first associated image (if there's any)
          notesList.forEach((note) => {
            let images = note.images;

            // if there are associated images, we perform the conversion from
            // only the first one (here we don't have _doc)
            if (images.length > 0) {

              // Getting the content type of the image
              var contentType = images[0].type;

              // Getting here the main data from the image and converting it to a
              // String using the Buffer function and base64 option.
              // There's also a difference from the the function that gets the
              // first image for just one note. Here we have
              // images[0].data.buffer
              var base64 = Buffer.from(images[0].data.buffer).toString('base64');

              // Associating the important information
              base64 = `data:${contentType};base64,` + base64;

              // Adding the note and the associated image to the final array
              notesArray[i] = {note: note, image: images[0], base64};

            }
            else {
              // Only the note is inserted because there are no images
              notesArray[i] = {note: note};

            }
            // Increasing for position control
            i++;
          })
          
          // Adding first this array to the cache
          NotesCache.insertNotesList(objId, notesArray);
          
          // Sending the array to the frontend
          return res.send({ error: 0, notes: notesArray });
        });
    // });
    }
  });*/

  /**
   * Auxiliary function to get the first associated image,
   * given the specific note id. Once it's found, it will
   * be returned.
   * @param {*} noteId 
   * @returns 
   */
this.findImage = async (noteId) => {
  // The returned result must be stored on the "foundImage"
  let foundImage = await Images.findOne({ note_id: noteId }).then(function(image) {
    return image;
  });
  // This one is sent back
  return foundImage;
};

/**
   * This function returns the list of stored notes in the database.
   * What needs to be sent is the id, title and text per each note.
   * The function, first, performs the token validation. So, if no
   * token was sent, this won't work.
   * If there are images associated to this note, only the first one
   * will be sent together. Both note and image are grouped in a set.
   * In the end, all the notes and the set of notes and images are
   * stored in a final array. This array will be the one sent to the
   * frontend server.
   */
app.get('/notes', function (req, res) {

  // Checking if the user id was sent
  if (!req.query.userid)
    return res.send({ error: 401, message: 'Missing id!' });

  // Checking also if there's a sent token
  const token = req.header('authorization');
  if (!token) return res.send({ error: 401, message: 'No found token!' });

  // Calling the function that verifies if the token is valid
  const tokenVal = this.tokenValidation(req.query.userid, token);

  // If the token is invalid, the error is sent to the frontend server
  if (tokenVal.error !== 0) return res.send(token);

  // Setting the object id as the parameter
  let objId = new ObjectId(req.query.userid);


  // First, checking if there's a notes list array
  // stored in the cache
  const notesListArray = NotesCache.getNotesList(objId);

  if (notesListArray !== undefined && notesListArray !== null && notesListArray.length > 0) 
    // Sendind the notes list array immidiately to the frontend
    return res.send({ error: 0, notes: notesListArray[0] });
  
  else {

    // The final array to be sent to the frontend
    var notesArray = [];

    // var nArrayLength = notesArray.length;

    let inserted = false;
    // Confirmation that the final array is inserted in the cache
    // var inserted = false;

    // Variable to control the array positions
    var i = 0;

    /**
     * If everythig is fine, all the notes associated to the
     * logged user will be shown. It's about finding all the
     * notes where the user Id matches the logged user id.
     *
     * From 30/10/2023 due to security implementation, the code
     * has to be different. This is because the encryption doesn't
     * work with the $lookup function. Therefore, there must be
     * two separated find functions. One for the list of notes and
     * a second one for the first image associated to each note.
     *
     * Soon, we may need to limit the number of sets to be sent
     * to the frontend. Besides, it's never good to get all the
     * data stored.
     *
     * */
    Notes.find({ user_id: objId }, function (err, notesList) {
      if (!notesList)
        // Returning error if the user is not found in the database
        return res.send({ error: 401, message: "No notes found!" });

      // This has to be asynchronous. Otherwise, the images won't be
      // before the loop ends
      notesList.forEach( async function(note) {

        // Using the await each time the function is called
        let image = await this.findImage(note._doc._id);

        if(image && Object.keys(image._doc).length > 0) {
          // Getting the content type of the image
          var contentType = image._doc.type;

          // Getting here the main data from the image and converting it to a
          // String using the Buffer function and base64 option.
          // There's also a difference from the the function that gets the
          // first image for just one note. Here we have
          // image.data.buffer
          var base64 = Buffer.from(image._doc.data.buffer).toString('base64');

          // Associating the important information
          base64 = `data:${contentType};base64,` + base64;

          // Adding the note and the associated image to the final array
          notesArray[i] = {note: note, image: image, base64};
         

        }
        else {
          // Only the note is inserted because there are no images
          notesArray.push({note: note});
         
        }
        i++;
        
        if (i === notesList.length) {
          // Adding first this array to the cache
          NotesCache.insertNotesList(objId, notesArray);    

          // Returnig the list of created notes.
          return res.send({ error: 0, notes: notesArray });
        }
      });
    });
  }
});
  /**
   * This function gets the requested specific note.
   *
   * It only works if the right token was sent.
   *
   * Also, the user id and the note id must be sent.
   * This way, the right note, with these two matches
   * will be search. If found, then it will be sent
   * to the frontend server.
   * 
   * Also, if there are associated images, these will
   * be sent together the found note.
   *
   */
  app.get('/note', function (req, res) {

    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Setting the user object id as the parameter
    let user_objId = new ObjectId(req.query.userid);

    // Checking if the user id was sent
    if (!req.query.noteid)
      return res.send({ error: 401, message: 'Missing note id!' });

    // Setting the user object id as the parameter
    let note_objId = new ObjectId(req.query.noteid);


    // Checking now if there's an array, corresponding to the
    // given user and note IDs, is in the notes cache
    let note = NotesCache.getNote(user_objId, note_objId);

    if (note !== undefined && note !== null && note.length > 0) {
      // If there are stored images, these need to be sent separately
      if (note[0].length === 2) {
        const convertedImages = note[0][1]
        return res.send({ error: 0, note: note[0][0], convertedImages });
      }
      else  
        // Sending the array to the front end
        return res.send({ error: 0, note: note[0][0] });
    }
      
    else {

      // Getting the specific note and send it to the frontend server
      Notes.findOne({ _id: note_objId, user_id: user_objId }, function (err, note) {
        // Getting also the associated image(s), if there are any
        Images.find({ note_id: note_objId }, function (err, images) {
          if (images.length > 0) {
            
            // Array to keep the base64 convertion for each image
            let convertedImages = [];

            // Array position control
            let i = 0; 

            // A loop is performed in order to get the base64 for all images
            images.forEach((image) => {
              // Getting the content type of the image
              var contentType = image._doc.type;
      
              // Getting here the main data from the image and converting it to a
              // String using the Buffer function and base64 option.
              // Here we have image.data.buffer
              var base64 = Buffer.from(image._doc.data).toString('base64');
      
              // Associating the important information
              base64 = `data:${contentType};base64,` + base64;
      
              // Adding the image to the final array
              convertedImages[i] = {image: image, base64};
      
              // Moving to the next position
              i++;
            });

            // Inserting the array with the note id, the note and the
            // associated images in the cache
            NotesCache.insertNote(user_objId, note_objId, [note, convertedImages]);

            // Sending the result to the frontend server
            return res.send({ error: 0, note: note, convertedImages });
          }
          // If no images are associated, it returns only the note.
          else {
            
            // Inserting first the array with the note id and the note
            // in the cache
            NotesCache.insertNote(user_objId, note_objId, [note]);

            return res.send({ error: 0, note: note });
          }
        });
      });
    }
  });

  /**
   * This function deletes a specific note from the database. It must
   * receive the id of the user and the id of the specific note to be
   * deleted.
   */
  app.delete('/notedeletion', function (req, res) {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing user id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Checking if the note id was sent
    if (!req.body.noteId)
      return res.send({ error: 401, message: 'Missing note id!' });

    // Setting the object id as the parameter
    let objId = new ObjectId(req.body.noteId);

    // Deletting the specific note
    Notes.findByIdAndDelete({ _id: objId }, function (err, note) {
      if (note) {
        // If the note was successfully found and deleted,
        // cleaning the cache first
        NotesCache.removeNote(objId);
        NotesCache.removeNotesList(new ObjectId(req.query.userid));

        // Deletting all the associated images to the note.
        Images.deleteMany({ note_id: req.body.noteId }, function (err, image) {
          return res.send({ error: 0 });
        });
      } else return res.send({ error: err });
    });
  });


  app.get('/images', function(req, res) {

    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing user id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Setting the user object id as the parameter
    let user_objId = new ObjectId(req.query.userid);

    // Now getting the image (from the imageFiles table),
    // according to the given user ID
    ImageFiles.find({ user_id : user_objId}, function(err, images) {

      // Sending the error if found.
      if (err) return res.send({ error: err });

      // If the table is empty, the error message is sent
      // back to the frontend
      if (images.length === 0) return res.send({ error : 'No stored single images!'});

      // If there are stored images, first we create a
      // final array
      let convertedImageFiles = [];

      // Important to control the array position
      let i = 0;

      // Now performing a loop trough all the stored images
      images.forEach((image) => {
        // Getting the content type of the image
        var contentType = image.type;

        // Getting here the main data from the image and converting it to a
        // String using the Buffer function and base64 option.
        // Here we have image.data.buffer
        var base64 = Buffer.from(image.data.buffer).toString('base64');

        // Associating the important information
        base64 = `data:${contentType};base64,` + base64;

        // Adding the image to the final array
        convertedImageFiles[i] = {image: image, base64};

        // Moving to the next position
        i++;
      });

      // Returning the final images array to the frontend server
      return res.send({ error: 0, images, convertedImageFiles });

    });

  });


  /**
   * This function requests a specific file. For now, we stay with
   * the image. Later we can do with the videos and then it will be
   * just a media file.
   *
  app.get('/api/media/:id', function (req, res) {
    Images.findOne({ id: req.params.id }, function (err, imageFile) {
      if (err || imageFile === null) {
        return res.status(500).send('Error occurred: database error');
      }

      res.set('Content-Type', imageFile.mimetype);

      //read from mongodb
      var readstream = gfs.createReadStream({
        filename: 'w/' + req.params.id,
      });
      readstream.pipe(res);
      res.on('close', function () {
        console.log('file has been written fully!');
      });
    });
  });

  */

  /**
   * This function deletes an image associated to a specific note.
   * It must receive the image id in order to perform the operation.
   */
  app.delete('/imagedeletion', (req, res) => {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    // If the token is invalid, the error is sent to the frontend server
    if (tokenVal.error !== 0) return res.send(token);

    // Cheking if the image id was sent
    if (!req.body.imageId)
      return res.send({ error: 401, message: 'Missing note id!' });

    // Setting the object id as the parameter
    let objId = new ObjectId(req.body.imageId);

    // Deletting the specific image
    Images.findByIdAndDelete({ _id: objId }, function (err, image) {
      if (err)
        // Sending the error image, if any
        return res.send({ error: err });

      // If no errors were found, cleaning the cache first
      NotesCache.removeNote(image._doc.note_id);  
      NotesCache.removeNotesList(image._doc.user_id);

      // Sending back the confirmation
      return res.send({ error: 0 });
    });
  });


  /**
   *
   * This one is about checking if there's a user logged in
   * with the right token. The token is sent from the client server.
   * If the sent id matches the one that was store inside
   * the sent token, the user is the right one. Otherwise the token is
   * invalid and so is the user.
   *
   * The user id comes from the sent query.
   *
   * The token comes from the sent header.
   *
   *  */
  app.get('/auth', (req, res) => {
    // Checking if the user id was sent
    if (!req.query.userid)
      return res.send({ error: 401, message: 'Missing id!' });

    // Checking also if there's a sent token
    const token = req.header('authorization');
    if (!token) return res.send({ error: 401, message: 'No found token!' });

    // Calling the function that verifies if the token is valid
    const tokenVal = this.tokenValidation(req.query.userid, token);

    /**
     * If the token is invalid the cache related 
     * to this user is cleaned.
     */
    if (tokenVal.error !== 0) {
      const objID = new ObjectId(req.query.userid);
      NotesCache.removeNoteByUserId(objID);
      NotesCache.removeNotesList(objID);
    }

    // Returing the result to the frontend server, what ever that is
    return res.send(tokenVal);
  });

  /**
   * This function performs the logout request sent by the client-side.
   * Important. The req.logout is exactly the new version of passport.
   * It does the same operation as req.session.destroy.
   */
  app.post('/logout', function (req, res) {
    req.logout(function (err) {
      if (err) return res.send({ error: err });
    });
    return res.send({ error: 0 });
  });

};
