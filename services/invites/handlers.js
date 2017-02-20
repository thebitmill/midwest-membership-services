'use strict';

// modules > native
const url = require('url');

// modules > 3rd party
const nodemailer = require('nodemailer');

// modules > midwest
const factory = require('midwest/factories/handlers');

const verifyConfig = require('../../verify-config');

// modules > project
const config = require('../../config');

verifyConfig(config);

const { db } = config;

// modules > local
const { generateToken } = require('../users/helpers');
const queries = require('./queries');

const columns = ['id', 'email', 'dateCreated', 'createdById', 'dateModified', 'dateConsumed'];

const transport = nodemailer.createTransport(config.smtp);

const template = require('./email');

function create(json, cb) {
  const token = generateToken();

  db.query(queries.create, [json.email, token, json.createdById, json.roles], (err, result) => {
    if (err) return cb(err);

    const link = `${url.resolve(config.site.url, config.paths.register)}?email=${json.email}&token=${token}`;

    transport.sendMail({
      from: config.invite.from,
      to: json.email,
      subject: config.invite.subject || `You have been invited to ${config.site.title}`,
      html: template({ site: config.site, inviter: json.createdByEmail, link }),
    }, (err) => {
      if (err) return cb(err);

      return cb(null, result.rows[0]);
    });
  });
}

function find(json, cb) {
  const page = Math.max(0, json.page);

  db.query(queries.find, [page * 20], (err, result) => {
    if (err) return cb(err);

    cb(null, result.rows);
  });
}

function findById(id, cb) {
  db.query(queries.findById, [id], (err, result) => {
    if (err) return cb(err);

    cb(null, result.rows[0]);
  });
}

function findByEmail(email, cb) {
  db.query(queries.findByEmail, [email], (err, result) => {
    if (err) return cb(err);

    cb(null, result.rows[0]);
  });
}

function findByTokenAndEmail(token, email, cb) {
  db.query(queries.findByTokenAndEmail, [token, email], (err, result) => {
    if (err) return cb(err);

    cb(null, result.rows[0]);
  });
}

function getAll(cb) {
  db.query(queries.getAll, (err, result) => {
    if (err) return cb(err);

    cb(null, result.rowCount ? result.rows : undefined);
  });
}

function consume(id, cb) {
  const query = 'UPDATE invites SET date_consumed = NOW() WHERE id = $1;';

  db.query(query, [id], (err, result) => {
    if (err) return cb(err);

    cb(null, result.rowCount > 0);
  });
}

module.exports = Object.assign(factory({
  table: 'invites',
  columns: columns,
  exclude: ['create', 'getAll', 'find', 'findById'],
}), {
  create,
  find,
  findByEmail,
  findById,
  findByTokenAndEmail,
  getAll,
  consume,
});
