

'use strict';

const TTL_HOURS = parseInt(process.env.PROPOSAL_TTL_HOURS, 10) || 24;
const DRAFT_TTL_HOURS = parseInt(process.env.PROPOSAL_DRAFT_TTL_HOURS, 10) || 72;

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function linkExpiresAt() {
  return hoursFromNow(TTL_HOURS);
}

function draftExpiresAt() {
  return hoursFromNow(DRAFT_TTL_HOURS);
}

function isExpired(proposal) {
  if (!proposal || !proposal.expiresAt) return false;
  return new Date(proposal.expiresAt) <= new Date();
}

const EXPIRED_MESSAGE =
  'This link has expired. Your message, photos, and bouquet have been permanently deleted to protect your privacy.';

module.exports = {
  TTL_HOURS,
  DRAFT_TTL_HOURS,
  linkExpiresAt,
  draftExpiresAt,
  isExpired,
  EXPIRED_MESSAGE,
};
