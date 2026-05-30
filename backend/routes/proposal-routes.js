

'use strict';

const express = require('express');
const router  = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');

const {
  createProposal,
  updateProposal,
  setPasscode,
  verifyPasscode,
  getProposal,
  getProposalSummary,
  updatePhotos,
  updateBouquet,
} = require('../controllers/proposal-controller');

function requireJson(req, res, next) {
  if (req.method !== 'GET' && !req.is('application/json')) {
    return res.status(415).json({ success: false, message: 'Content-Type must be application/json.' });
  }
  next();
}

router.post  ('/',                requireJson, createProposal);
router.patch ('/:id/passcode',    requireJson, setPasscode);
router.post  ('/:id/verify',      requireJson, verifyPasscode);
router.get   ('/:id/summary',                  getProposalSummary);
router.patch ('/:id/photos',      requireJson, updatePhotos);
router.post('/:id/photos', uploadMiddleware, controllerFunction);
router.patch ('/:id/bouquet',     requireJson, updateBouquet);
router.patch ('/:id',             requireJson, updateProposal);
router.get   ('/:id',                          getProposal);

module.exports = router;
