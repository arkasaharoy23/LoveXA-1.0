

'use strict';

const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

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

    creatorKeyHash: { type: String, required: true, select: false },
    viewerTokenHash: { type: String, default: null, select: false },
    viewerTokenExpiresAt: { type: Date, default: null, select: false },

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
        greenery: mongoose.Schema.Types.Mixed,
        card: mongoose.Schema.Types.Mixed,
        theme: mongoose.Schema.Types.Mixed,
        message: String,
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

    acceptedAt: { type: Date, default: null },
    review: {
      rating: { type: Number, min: 1, max: 5, default: null },
      createdAt: { type: Date, default: null },
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
    couplePhoto:     this.couplePhoto,
    memoryPhotos:    this.memoryPhotos,
    bouquet:         this.bouquet,
    createdAt:       this.createdAt,
    viewedAt:        this.viewedAt,
    acceptedAt:      this.acceptedAt,
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
    couplePhoto:   this.couplePhoto,
    memoryPhotos:  this.memoryPhotos,
    expiresAt:     this.expiresAt,
    expiresInHours: parseInt(process.env.PROPOSAL_TTL_HOURS, 10) || 24,
    review: this.review || null,
  };
};

module.exports = mongoose.model('Proposal', ProposalSchema);
