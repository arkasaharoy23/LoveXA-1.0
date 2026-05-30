

'use strict';

const Proposal = require('../models/proposal');
const { hashPasscode, comparePasscode } = require('../utils/hash-passcode');
const {
  compressString,
  compressPhotoArray,
} = require('../utils/media-compress');
const {
  TTL_HOURS,
  linkExpiresAt,
  draftExpiresAt,
  isExpired,
  EXPIRED_MESSAGE,
} = require('../utils/proposal-expiry');

function notFound(res, id) {
  return res.status(404).json({
    success: false,
    message: `No proposal found with ID "${id}".`,
  });
}

function expired(res) {
  return res.status(410).json({
    success: false,
    expired: true,
    message: EXPIRED_MESSAGE,
  });
}

const MAX_PHOTO_BYTES = (parseInt(process.env.MAX_PHOTO_SIZE_KB, 10) || 500) * 1024 * 1.4;

function isValidBase64Image(str) {
  if (typeof str !== 'string') return false;
  if (str.length > MAX_PHOTO_BYTES) return false;
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(str);
}

function rejectIfExpired(proposal, res) {
  if (isExpired(proposal)) {
    expired(res);
    return true;
  }
  return false;
}

async function updateProposal(req, res, next) {
  try {
    const { id } = req.params;
    const { senderName, recipientName, message } = req.body;

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true });
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    if (senderName)    proposal.senderName    = senderName.trim();
    if (recipientName) proposal.recipientName = recipientName.trim();
    if (message)       proposal.message       = message.trim();

    await proposal.save();

    return res.status(200).json({
      success:    true,
      proposalId: proposal.proposalId,
    });
  } catch (err) { next(err); }
}

async function createProposal(req, res, next) {
  try {
    const { senderName, recipientName, message } = req.body;

    const errors = [];
    if (!senderName    || !senderName.trim())    errors.push('senderName is required.');
    if (!recipientName || !recipientName.trim()) errors.push('recipientName is required.');
    if (!message       || !message.trim())        errors.push('message is required.');
    if (message && message.length > 2000)         errors.push('message cannot exceed 2000 characters.');

    if (errors.length) return res.status(400).json({ success: false, errors });

    const proposal = await Proposal.create({
      senderName:    senderName.trim(),
      recipientName: recipientName.trim(),
      message:       message.trim(),
      expiresAt:     draftExpiresAt(),
    });

    console.log(`✓ Proposal created: ${proposal.proposalId}`);

    return res.status(201).json({
      success:    true,
      proposalId: proposal.proposalId,
    });
  } catch (err) { next(err); }
}

async function setPasscode(req, res, next) {
  try {
    const { id }       = req.params;
    const { passcode } = req.body;

    if (!passcode || !/^\d{6}$/.test(passcode)) {
      return res.status(400).json({
        success: false,
        message: 'Passcode must be exactly 6 digits.',
      });
    }

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true });
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    proposal.passcodeHash     = await hashPasscode(passcode);
    proposal.linkActivatedAt  = new Date();
    proposal.expiresAt        = linkExpiresAt();
    await proposal.save();

    console.log(`✓ Passcode set for: ${id} — expires ${proposal.expiresAt.toISOString()}`);

    return res.status(200).json({
      success:        true,
      expiresAt:      proposal.expiresAt,
      expiresInHours: TTL_HOURS,
    });
  } catch (err) { next(err); }
}

async function verifyPasscode(req, res, next) {
  try {
    const { id }       = req.params;
    const { passcode } = req.body;

    if (!passcode || !/^\d{6}$/.test(passcode)) {
      return res.status(400).json({
        success: false,
        valid:   false,
        message: 'Passcode must be exactly 6 digits.',
      });
    }

    const proposal = await Proposal
      .findOne({ proposalId: id, isActive: true })
      .select('+passcodeHash');

    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    if (!proposal.passcodeHash) {
      return res.status(403).json({
        success: false,
        valid:   false,
        message: 'This proposal is not ready to be opened yet.',
      });
    }

    const valid = await comparePasscode(passcode, proposal.passcodeHash);

    if (!valid) {
      return res.status(401).json({
        success: false,
        valid:   false,
        message: 'Incorrect passcode.',
      });
    }

    if (!proposal.viewedAt) {
      proposal.viewedAt = new Date();
      await proposal.save();
    }

    return res.status(200).json({
      success:   true,
      valid:     true,
      expiresAt: proposal.expiresAt,
    });
  } catch (err) { next(err); }
}

async function getProposal(req, res, next) {
  try {
    const { id }       = req.params;
    const { passcode } = req.query;

    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: 'Passcode query parameter is required.',
      });
    }

    const proposal = await Proposal
      .findOne({ proposalId: id, isActive: true })
      .select('+passcodeHash');

    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    if (!proposal.passcodeHash) {
      return res.status(403).json({
        success: false,
        message: 'This proposal is not ready to be opened yet.',
      });
    }

    const valid = await comparePasscode(passcode, proposal.passcodeHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect passcode.' });
    }

    return res.status(200).json({ success: true, proposal: proposal.toPublic() });
  } catch (err) { next(err); }
}

async function getProposalSummary(req, res, next) {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true });
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    if (!proposal.passcodeHash) {
      return res.status(403).json({
        success: false,
        message: 'This proposal is not ready yet. Set your passcode first.',
      });
    }

    return res.status(200).json({
      success:  true,
      summary:  proposal.toSummary(),
    });
  } catch (err) { next(err); }
}

async function updatePhotos(req, res, next) {
  try {
    const { id }                        = req.params;
    const { couplePhoto, memoryPhotos } = req.body;

    if (couplePhoto !== undefined && couplePhoto !== null) {
      if (!isValidBase64Image(couplePhoto)) {
        return res.status(400).json({
          success: false,
          message: 'couplePhoto must be a valid base64 image (jpeg/png/webp) under 500KB.',
        });
      }
    }

    if (memoryPhotos !== undefined) {
      if (!Array.isArray(memoryPhotos)) {
        return res.status(400).json({ success: false, message: 'memoryPhotos must be an array.' });
      }
      if (memoryPhotos.length > 10) {
        return res.status(400).json({ success: false, message: 'Maximum 10 memory photos allowed.' });
      }
      const invalidPhoto = memoryPhotos.find(p => !isValidBase64Image(p));
      if (invalidPhoto !== undefined) {
        return res.status(400).json({
          success: false,
          message: 'One or more memory photos are invalid or exceed the size limit.',
        });
      }
    }

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true });
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    if (couplePhoto !== undefined && couplePhoto !== null) {
      proposal.couplePhoto = compressString(couplePhoto);
    }
    if (memoryPhotos !== undefined) {
      proposal.memoryPhotos = compressPhotoArray(memoryPhotos);
    }

    await proposal.save();

    console.log(`✓ Photos saved (compressed) for: ${id}`);

    return res.status(200).json({ success: true });
  } catch (err) { next(err); }
}

async function updateBouquet(req, res, next) {
  try {
    const { id }      = req.params;
    const { bouquet } = req.body;

    if (!bouquet || !Array.isArray(bouquet.flowers) || bouquet.flowers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'bouquet.flowers is required.',
      });
    }

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true });
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    proposal.bouquet = bouquet;
    await proposal.save();

    console.log(`✓ Bouquet saved for: ${id}`);

    return res.status(200).json({ success: true });
  } catch (err) { next(err); }
}

module.exports = {
  createProposal,
  updateProposal,
  setPasscode,
  verifyPasscode,
  getProposal,
  getProposalSummary,
  updatePhotos,
  updateBouquet,
};
