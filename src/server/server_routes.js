module.exports = function(app) {
    const express = require('express');
    const jwt = require('jsonwebtoken');
    const cors = require('cors');
    const passport = require('passport');
    const passportJWT = require('passport-jwt');
    const randomstring = require('randomstring');
    // const sha512 = require('js-sha512');
    let config = require('../config.json');
  
    const corsOptions = {
      origin: `${config.host}`,
      optionsSuccessStatus: 200,
      credentials: true
    };
};
  