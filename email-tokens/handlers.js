'use strict';

const _ = require('lodash');
const resolveCache = require('../resolve-cache');

module.exports = _.memoize((state) => {
  const { generateToken } = require('../users/helpers')(state);

  function create(json, client = state.db) {
    const token = generateToken();

    return client.query('INSERT INTO email_tokens (user_id, email, token) VALUES ($1, $2, $3) RETURNING token;',
      [json.userId, json.email, token]).then((result) => result.rows[0].token);
  }

  return {
    create,
  };
}, resolveCache);
