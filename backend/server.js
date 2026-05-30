'use strict';

require('dotenv').config();

const fs              = require('fs');
const express         = require('express');
const cors            = require('cors');
const path            = require('path');
const connectDB       = require('./config/database');
const proposalRoutes  = require('./routes/proposal-routes');
const errorMiddleware = require('./middleware/error-middleware');

const app  = express();
const PORT = Number(process.env.PORT) || 5000;

const ROOT = path.join(__dirname, '..');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!isProduction) {
    if (!allowedOrigins.length) return true;
    if (LOCALHOST_ORIGIN.test(origin)) return true;
  }
  return false;
}

function validateProductionEnv() {
  if (!isProduction) return;

  const missing = [];
  if (!process.env.MONGO_URI) missing.push('MONGO_URI');
  if (!allowedOrigins.length) missing.push('ALLOWED_ORIGINS');

  if (missing.length) {
    console.error('\n❌ Production startup blocked — set these in your host environment:\n');
    missing.forEach(key => console.error(`   • ${key}`));
    console.error('\n   Example ALLOWED_ORIGINS=https://your-domain.com\n');
    process.exit(1);
  }
}

function resolveIndexFile(htmlRoot) {
  const lower = path.join(htmlRoot, 'index.html');
  if (fs.existsSync(lower)) return lower;
  const upper = path.join(htmlRoot, 'Index.html');
  if (fs.existsSync(upper)) return upper;
  return lower;
}

function resolveFrontend() {
  //const nestedHtml   = path.join(ROOT, 'frontend');
  const nestedHtml = path.join(ROOT, 'frontend');
  const nestedAssets = path.join(ROOT, 'frontend', 'assets');
  const flatAssets   = path.join(ROOT, 'assets');
  const flatIndex    = resolveIndexFile(ROOT);

  if (fs.existsSync(path.join(nestedHtml, 'index.html'))) {
    const indexFile = resolveIndexFile(nestedHtml);
    return {
      layout:     'nested',
      htmlRoot:   nestedHtml,
      assetsRoot: fs.existsSync(nestedAssets) ? nestedAssets : flatAssets,
      indexFile,
    };
  }

  if (fs.existsSync(flatIndex)) {
    return {
      layout:     'flat',
      htmlRoot:   ROOT,
      assetsRoot: fs.existsSync(flatAssets) ? flatAssets : ROOT,
      indexFile:  flatIndex,
    };
  }

  return null;
}

const frontend = resolveFrontend();

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use('/api/proposals', proposalRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Forever Yours API is running.',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

if (frontend) {
  const staticOpts = {
    index:      'index.html',
    extensions: ['html'],
    maxAge:     process.env.NODE_ENV === 'production' ? '7d' : 0,
  };

  if (frontend.layout === 'nested') {
    app.use('/assets', express.static(frontend.assetsRoot, { maxAge: staticOpts.maxAge }));
    app.use(express.static(frontend.htmlRoot, staticOpts));
  } else {
    app.use(express.static(frontend.htmlRoot, staticOpts));
  }

  app.get('/', (req, res, next) => {
    sendIndex(res, next);
  });
}

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found.' });
  }
  res.status(404).type('text/plain').send('Page not found.');
});

app.use(errorMiddleware);

function sendIndex(res, next) {
  if (!frontend || !fs.existsSync(frontend.indexFile)) {
    return next(new Error('index.html not found in project root.'));
  }
  res.sendFile(frontend.indexFile);
}

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve({ server, port }));
    server.on('error', reject);
  });
}

async function listenWithFallback(preferredPort) {
  const isProd   = process.env.NODE_ENV === 'production';
  const maxTries = isProd ? 1 : 10;

  for (let i = 0; i < maxTries; i++) {
    const port = preferredPort + i;
    try {
      const result = await listen(port);
      if (i > 0) {
        console.warn(
          `\n⚠ Port ${preferredPort} is in use — server started on port ${port} instead.` +
          `\n   Open http://localhost:${port}\n`
        );
      }
      return result;
    } catch (err) {
      if (err.code !== 'EADDRINUSE' || i === maxTries - 1) throw err;
    }
  }
}

function printPortInUseHelp(fromPort, toPort) {
  console.error(`\n❌ Ports ${fromPort}–${toPort} are all in use (EADDRINUSE).`);
  console.error('   Stop leftover Node/nodemon processes, then try again.\n');
  console.error(`   netstat -ano | findstr :${fromPort}`);
  console.error('   taskkill /PID <pid> /F\n');
  console.error(`   Or set a higher PORT in .env (e.g. PORT=${toPort + 1})\n`);
}

function printFrontendHelp() {
  console.error('\n❌ Could not find the frontend.');
  console.error('   Expected one of:');
  console.error(`   • ${path.join(ROOT, 'index.html')}  (flat layout)`);
  console.error(`   • ${path.join(ROOT, 'frontend', 'html', 'index.html')}  (nested layout)\n`);
}

async function start() {
  validateProductionEnv();

  if (!frontend) {
    printFrontendHelp();
    process.exit(1);
  }

  if (!fs.existsSync(frontend.indexFile)) {
    console.error(`\n❌ Missing home page: ${frontend.indexFile}`);
    console.error('   Add index.html to the project root.\n');
    process.exit(1);
  }

  await connectDB();

  try {
    const { server, port } = await listenWithFallback(PORT);
    console.log(`\n🚀 Forever Yours server running (${frontend.layout} layout)`);
    console.log(`   Local:   http://localhost:${port}`);
    console.log(`   API:     http://localhost:${port}/api/proposals`);
    console.log(`   Health:  http://localhost:${port}/api/health\n`);

    const shutdown = (signal) => {
      console.log(`\n${signal} received — shutting down…`);
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      const isProd = process.env.NODE_ENV === 'production';
      printPortInUseHelp(PORT, isProd ? PORT : PORT + 9);
      process.exit(1);
    }
    console.error('Server failed to start:', err.message);
    process.exit(1);
  }
}


start();

module.exports = app;
