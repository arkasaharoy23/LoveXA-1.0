'use strict';

const crypto = require('crypto');

function secret() {
  const value = process.env.CREATOR_KEY_SECRET;
  if (process.env.NODE_ENV === 'production' && (!value || value.length < 32)) {
    throw new Error('CREATOR_KEY_SECRET must contain at least 32 characters in production.');
  }
  return value || 'local-development-only-change-me';
}

function hashCreatorKey(key) {
  return crypto.createHmac('sha256', secret()).update(key).digest('hex');
}

function compareCreatorKey(key, hash) {
  if (!key || typeof key !== 'string' || !hash) return false;
  const actual = Buffer.from(hashCreatorKey(key), 'hex');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashCreatorKey, compareCreatorKey };
