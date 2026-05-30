

'use strict';

const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const {
  decompressString,
  decompressPhotoArray,
} = require('../utils/media-compress');

const BouquetFlowerSchema = new mongoose.Schema(
  {
    id:      String,
    name:    String,
    emoji:   String,
    meaning: String,
    count:   Number,
  },
  { _id: false }
);

const ProposalSchema = new mongoose.Schema(
  {
    proposalId: {
      type:    String,
      default: () => nanoid(10),
      unique:  true,
      index:   true,
    },

    senderName: {
      type:      String,
      required:  [true, 'Sender name is required.'],
      trim:      true,
      maxlength: [60, 'Sender name cannot exceed 60 characters.'],
    },

    recipientName: {
      type:      String,
      required:  [true, 'Recipient name is required.'],
      trim:      true,
      maxlength: [60, 'Recipient name cannot exceed 60 characters.'],
    },

    message: {
      type:      String,
      required:  [true, 'Proposal message is required.'],
      trim:      true,
      maxlength: [2000, 'Message cannot exceed 2000 characters.'],
    },

    passcodeHash: {
      type:    String,
      default: null,
      select:  false,
    },

    couplePhoto: {
      type:    String,
      default: null,
    },

    memoryPhotos: {
      type:    [String],
      default: [],
      validate: {
        validator: arr => arr.length <= 10,
        message:   'A maximum of 10 memory photos are allowed.',
      },
    },

    bouquet: {
      type: {
        flowers:  [BouquetFlowerSchema],
        ribbon:   mongoose.Schema.Types.Mixed,
        wrapping: mongoose.Schema.Types.Mixed,
        builtAt:  String,
      },
      default: null,
    },

    linkActivatedAt: {
      type:    Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      index: { expires: 0 },
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    viewedAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

ProposalSchema.methods.toPublic = function () {
  return {
    proposalId:      this.proposalId,
    senderName:      this.senderName,
    recipientName:   this.recipientName,
    message:         this.message,
    couplePhoto:     decompressString(this.couplePhoto),
    memoryPhotos:    decompressPhotoArray(this.memoryPhotos),
    bouquet:         this.bouquet,
    createdAt:       this.createdAt,
    viewedAt:        this.viewedAt,
    expiresAt:       this.expiresAt,
    linkActivatedAt: this.linkActivatedAt,
  };
};

ProposalSchema.methods.toSummary = function () {
  return {
    proposalId:    this.proposalId,
    senderName:    this.senderName,
    recipientName: this.recipientName,
    message:       this.message,
    bouquet:       this.bouquet,
    expiresAt:     this.expiresAt,
    expiresInHours: parseInt(process.env.PROPOSAL_TTL_HOURS, 10) || 24,
  };
};

module.exports = mongoose.model('Proposal', ProposalSchema);
