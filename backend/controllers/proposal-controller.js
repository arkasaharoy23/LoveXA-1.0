

'use strict';

const Proposal = require('../models/proposal');
const crypto = require('crypto');
const { Readable } = require('stream');
const { v2: cloudinary } = require('cloudinary');
const { hashPasscode, comparePasscode } = require('../utils/hash-passcode');
const { hashCreatorKey, compareCreatorKey } = require('../utils/creator-key');
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function requireCreator(proposal, req, res) {
  if (!compareCreatorKey(req.get('x-creator-key'), proposal.creatorKeyHash)) {
    res.status(403).json({ success: false, message: 'Creator authorization required.' });
    return false;
  }
  return true;
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
    const { senderName, recipientName, message } = req.body || {};

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true }).select('+creatorKeyHash');
    if (!proposal) {
      if (!req.get('x-creator-key')) return res.status(403).json({ success: false, message: 'Creator authorization is missing. Start a new proposal.' });
      return notFound(res, id);
    }
    if (!requireCreator(proposal, req, res)) return;
    if (rejectIfExpired(proposal, res)) return;

    if (senderName !== undefined) proposal.senderName = senderName;
    if (recipientName !== undefined) proposal.recipientName = recipientName;
    if (message !== undefined) proposal.message = message;

    await proposal.save();

    return res.status(200).json({
      success:    true,
      proposalId: proposal.proposalId,
    });
  } catch (err) { next(err); }
}

async function createProposal(req, res, next) {
  try {
    const { senderName, recipientName, message } = req.body || {};

    const errors = [];
    if (typeof senderName !== 'string' || !senderName.trim()) errors.push('senderName is required.');
    if (typeof recipientName !== 'string' || !recipientName.trim()) errors.push('recipientName is required.');
    if (typeof message !== 'string' || !message.trim()) errors.push('message is required.');
    if (typeof senderName === 'string' && senderName.trim().length > 60) errors.push('senderName must be 60 characters or fewer.');
    if (typeof recipientName === 'string' && recipientName.trim().length > 60) errors.push('recipientName must be 60 characters or fewer.');
    if (typeof message !== 'string') errors.push('message must be text.');
    if (message && message.length > 2000)         errors.push('message cannot exceed 2000 characters.');

    if (errors.length) return res.status(400).json({ success: false, errors });

    const creatorKey = crypto.randomBytes(32).toString('base64url');
    const proposal = await Proposal.create({
      senderName:    senderName.trim(),
      recipientName: recipientName.trim(),
      message:       message.trim(),
      creatorKeyHash: hashCreatorKey(creatorKey),
      expiresAt:     draftExpiresAt(),
    });

    console.log(`✓ Proposal created: ${proposal.proposalId}`);

    return res.status(201).json({
      success:    true,
      proposalId: proposal.proposalId,
      creatorKey,
    });
  } catch (err) { next(err); }
}

async function setPasscode(req, res, next) {
  try {
    const { id }       = req.params;
    const { passcode } = req.body;

    if (typeof passcode !== 'string' || !/^\d{6}$/.test(passcode)) {
      return res.status(400).json({
        success: false,
        message: 'Passcode must be exactly 6 digits.',
      });
    }

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true }).select('+creatorKeyHash');
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;
    if (!requireCreator(proposal, req, res)) return;

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
      .select('+passcodeHash +viewerTokenHash +creatorKeyHash');

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

    const viewerToken = crypto.randomBytes(32).toString('base64url');
    proposal.viewerTokenHash = hashCreatorKey(viewerToken);
    proposal.viewerTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await proposal.save();
    return res.status(200).json({
      success:   true,
      valid:     true,
      expiresAt: proposal.expiresAt,
      viewerToken,
    });
  } catch (err) { next(err); }
}

async function getProposal(req, res, next) {
  try {
    const { id }       = req.params;
    const passcode = req.body && req.body.passcode;
    const viewerToken = req.get('x-viewer-token');
    if (!passcode && !viewerToken) {
      return res.status(400).json({
        success: false,
        message: 'Passcode query parameter is required.',
      });
    }

    const proposal = await Proposal
      .findOne({ proposalId: id, isActive: true })
      .select('+passcodeHash +viewerTokenHash +creatorKeyHash');

    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    const valid = viewerToken
      ? Boolean(proposal.viewerTokenExpiresAt && proposal.viewerTokenExpiresAt > new Date() && compareCreatorKey(viewerToken, proposal.viewerTokenHash))
      : Boolean(passcode && proposal.passcodeHash && await comparePasscode(passcode, proposal.passcodeHash));
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect passcode.' });
    }

    return res.status(200).json({ success: true, proposal: proposal.toPublic() });
  } catch (err) { next(err); }
}

async function getProposalSummary(req, res, next) {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true }).select('+creatorKeyHash');
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;

    if (!requireCreator(proposal, req, res)) return;

    return res.status(200).json({
      success:  true,
      summary:  proposal.toSummary(),
    });
  } catch (err) { next(err); }
}

async function updatePhotos(req, res, next) {
  try {
    const { id } = req.params;
    const proposal = await Proposal.findOne({ proposalId: id, isActive: true }).select('+creatorKeyHash');
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;
    if (!requireCreator(proposal, req, res)) return;
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ success: false, message: 'Image uploads are not configured on this server.' });
    }
    const files = req.files || {};
    const couple = files.couplePhoto?.[0];
    const memories = files.memoryPhotos || [];
    if (memories.length > 10) return res.status(400).json({ success: false, message: 'Maximum 10 memory photos allowed.' });
    const upload = file => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder:'lovexa/proposals', resource_type:'image', transformation:[{width:1600,height:1600,crop:'limit',quality:'auto',fetch_format:'auto'}] }, (error, result) => error ? reject(error) : resolve(result.secure_url));
      Readable.from(file.buffer).pipe(stream);
    });
    const uploaded = [];
    const getPublicId = url => {
      const uploadedPath = url.split('/image/upload/')[1];
      if (!uploadedPath) return null;
      return uploadedPath.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
    };
    try {
      const coupleUrl = couple ? await upload(couple) : null;
      if (coupleUrl) uploaded.push(coupleUrl);
      const memoryResults = await Promise.allSettled(memories.map(file => upload(file)));
      for (const result of memoryResults) {
        if (result.status === 'fulfilled') uploaded.push(result.value);
      }
      const failedUpload = memoryResults.find(result => result.status === 'rejected');
      if (failedUpload) throw failedUpload.reason;
      const memoryUrls = memoryResults.map(result => result.value);
      if (coupleUrl) proposal.couplePhoto = coupleUrl;
      if (memories.length) proposal.memoryPhotos = memoryUrls;
      await proposal.save();
    } catch (error) {
      await Promise.all(uploaded.map(url => {
        const publicId = getPublicId(url);
        return publicId ? cloudinary.uploader.destroy(publicId, { resource_type:'image' }).catch(() => null) : null;
      }));
      throw error;
    }

    console.log(`✓ Photos uploaded for: ${id}`);

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

    const proposal = await Proposal.findOne({ proposalId: id, isActive: true }).select('+creatorKeyHash');
    if (!proposal) return notFound(res, id);
    if (rejectIfExpired(proposal, res)) return;
    if (!requireCreator(proposal, req, res)) return;

    const allowedFlowers = new Set(['rose','tulip','lily','sunflower','orchid','lavender','daisy','peony','babysbreath','camellia','lotus']);
    if (bouquet.flowers.length > 30 || bouquet.flowers.some(f => !allowedFlowers.has(f.id) || !Number.isInteger(f.count) || f.count < 1 || f.count > 12)) {
      return res.status(400).json({ success: false, message: 'Bouquet contains invalid flower selections.' });
    }

    proposal.bouquet = bouquet;
    await proposal.save();

    console.log(`✓ Bouquet saved for: ${id}`);

    return res.status(200).json({ success: true });
  } catch (err) { next(err); }
}

async function acceptProposal(req, res, next) {
  try {
    const proposal = await Proposal.findOne({ proposalId: req.params.id, isActive: true }).select('+viewerTokenHash +viewerTokenExpiresAt');
    if (!proposal) return notFound(res, req.params.id);
    if (rejectIfExpired(proposal, res)) return;
    if (!proposal.viewerTokenExpiresAt || !compareCreatorKey(req.get('x-viewer-token'), proposal.viewerTokenHash) || proposal.viewerTokenExpiresAt <= new Date()) {
      return res.status(401).json({ success: false, message: 'Please unlock this proposal first.' });
    }
    proposal.acceptedAt = new Date();
    await proposal.save();
    return res.json({ success: true, acceptedAt: proposal.acceptedAt });
  } catch (err) { next(err); }
}

async function submitReview(req, res, next) {
  try {
    const proposal = await Proposal.findOne({ proposalId: req.params.id, isActive: true }).select('+viewerTokenHash +viewerTokenExpiresAt');
    if (!proposal) return notFound(res, req.params.id);
    if (!proposal.viewerTokenExpiresAt || proposal.viewerTokenExpiresAt <= new Date() || !compareCreatorKey(req.get('x-viewer-token'), proposal.viewerTokenHash)) {
      return res.status(401).json({ success: false, message: 'Please unlock this proposal first.' });
    }
    if (!proposal.acceptedAt) return res.status(403).json({ success: false, message: 'Accept the proposal before leaving feedback.' });
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Choose a rating from 1 to 5.' });
    proposal.review = { rating, createdAt: new Date() };
    await proposal.save();
    return res.json({ success: true });
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
  acceptProposal,
  submitReview,
};
