'use strict';

// modules > 3rd party
const crypto = require('crypto');

// modules > 3rd party
const mongoose = require('mongoose');

const config = require('../../config');

const UserSchema = new mongoose.Schema(Object.assign({
  email: { type: String, required: true, unique: true },
  local: {
    password: String,
    reset: {
      date: Date,
      code: String
    },
    verificationCode: { type: String },
  },
  facebook: {
    id: String,
    token: String,
    email: String
  },
  google: {
    id: String,
    token: String,
    email: String
  },
  givenName: String,
  familyName: String,
  roles: { type: [ { type: String } ], required: true, default: [ 'member' ] },
  lastActivity: { type: Date },
  lastLogin: { type: Date },
  dateCreated: { type: Date, default: Date.now },
  loginAttempts: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false }

}, config.membership.userSchema));

UserSchema.methods.login = function () {
  this.lastLogin = Date.now();

  if (this.local.reset)
    this.local.reset = undefined;

  this.save(function (err) {
    // TODO send error to error handler
    if (err) console.log(err);
  });
};

UserSchema.methods.generateVerificationCode = function () {
  this.local.verificationCode = crypto.createHash('sha512').update(Date.now() + this.email).digest('hex');

  // make sure no errors here
  this.save();
};

UserSchema.methods.resetPassword = function (next) {
  if (!this.local)
    return false;

  const date = Date.now();
  const hash = crypto.createHash('sha512').update(date + this.local.password + this.email).digest('hex');

  this.local.reset = {
    date,
    code: hash
  };

  this.save(function (err) {
    // TODO ensure response doesnt get sent twice
    next(err);
  });
};

const SALT_LENGTH = 16;

UserSchema.path('local.password').set(function (password) {
  // generate salt
  password = password.trim();
  const chars = '0123456789abcdefghijklmnopqurstuvwxyz';
  let salt = '';
  for (let i = 0; i < SALT_LENGTH; i++) {
    const j = Math.floor(Math.random() * chars.length);
    salt += chars[j];
  }

  // hash the password
  const passwordHash = crypto.createHash('sha512').update(salt + password).digest('hex');

  // entangle the hashed password with the salt and save to the model
  return entangle(passwordHash, salt, password.length);
});

UserSchema.methods.hasRole = function (role) {
  return this.roles.indexOf(role) > -1;
};

UserSchema.methods.authenticate = function (password) {
  password = password.trim();
  const obj = detangle(this.local.password, password.length);

  return crypto.createHash('sha512').update(obj.salt + password).digest('hex') === obj.hash;
};

function entangle(string, salt, t) {
  string = salt + string;
  const length = string.length;

  const arr = string.split('');
  for (let i = 0; i < salt.length; i++) {
    const num = ((i + 1) * t) % length;
    const tmp = arr[i];
    arr[i] = arr[num];
    arr[num] = tmp;
  }

  return arr.join('');
}

function detangle(string, t) {
  const length = string.length;
  const arr = string.split('');

  for (let i = SALT_LENGTH - 1; i >= 0; i--) {
    const num = ((i + 1) * t) % length;
    const tmp = arr[i];
    arr[i] = arr[num];
    arr[num] = tmp;
  }
  const str = arr.join('');

  return {
    salt: str.substring(0, SALT_LENGTH),
    hash: str.substring(SALT_LENGTH)
  };
}

module.exports = mongoose.model('User', UserSchema);