'use strict';

const express = require('express');
const router  = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const {
  createProposal,
  updateProposal,
  setPasscode,
  verifyPasscode,
  getProposal,
  getProposalSummary,
  updatePhotos,
  updateBouquet,
  acceptProposal,
  submitReview,
} = require('../controllers/proposal-controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (Number(process.env.MAX_PHOTO_SIZE_MB) || 8) * 1024 * 1024, files: 11 },
  fileFilter: (req, file, done) => done(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});
const verifyImageBytes = (req, res, next) => {
  const files = Object.values(req.files || {}).flat();
  for (const file of files) {
    const b = file.buffer;
    const valid = (file.mimetype === 'image/jpeg' && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
      || (file.mimetype === 'image/png' && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
      || (file.mimetype === 'image/webp' && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP');
    if (!valid) return res.status(400).json({ success: false, message: 'An uploaded file does not match its image format.' });
  }
  next();
};
const passcodeLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false });

function requireJson(req, res, next) {
  if (req.method !== 'GET' && !req.is('application/json')) {
    return res.status(415).json({
      success: false,
      message: 'Content-Type must be application/json.'
    });
  }
  next();
}

router.post('/', requireJson, createProposal);
router.patch('/:id/passcode', requireJson, setPasscode);
router.post('/:id/verify', requireJson, passcodeLimit, verifyPasscode);
router.post('/:id/accept', acceptProposal);
router.post('/:id/review', submitReview);
router.post('/:id/view', getProposal);
router.post('/:id/unlock', requireJson, passcodeLimit, verifyPasscode);
router.get('/:id/summary', getProposalSummary);

router.patch('/:id/photos', upload.fields([{ name: 'couplePhoto', maxCount: 1 }, { name: 'memoryPhotos', maxCount: 10 }]), verifyImageBytes, updatePhotos);

router.patch('/:id/bouquet', requireJson, updateBouquet);
router.patch('/:id', requireJson, updateProposal);

module.exports = router;
