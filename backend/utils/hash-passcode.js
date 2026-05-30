

'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;


async function hashPasscode(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Passcode must be a non-empty string.');
  }
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}


async function comparePasscode(plaintext, hash) {
  if (!plaintext || !hash) return false;
  return bcrypt.compare(plaintext, hash);
}

module.exports = { hashPasscode, comparePasscode };
