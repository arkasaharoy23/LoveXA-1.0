

'use strict';

const zlib = require('zlib');

const PREFIX = 'gz:';

function compressString(str) {
  if (!str || typeof str !== 'string') return null;
  if (str.startsWith(PREFIX)) return str;
  const compressed = zlib.gzipSync(Buffer.from(str, 'utf8'), { level: 6 });
  return PREFIX + compressed.toString('base64');
}

function decompressString(stored) {
  if (!stored || typeof stored !== 'string') return null;
  if (stored.startsWith('data:image')) return stored;
  if (!stored.startsWith(PREFIX)) return stored;
  const buf = zlib.gunzipSync(Buffer.from(stored.slice(PREFIX.length), 'base64'));
  return buf.toString('utf8');
}

function compressPhotoArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(compressString).filter(Boolean);
}

function decompressPhotoArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(decompressString).filter(Boolean);
}

module.exports = {
  compressString,
  decompressString,
  compressPhotoArray,
  decompressPhotoArray,
};
