const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { createPayment, verifyPayment, SUPPORTED_CHAINS, initPaymentsStore } = require('./payments');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage (replace with DB for production)
const messages = new Map();
const payments = new Map();

// Initialize payments module with storage reference
initPaymentsStore(payments);

// ============================================
// BARN ROTATION SYSTEM (Task 3)
// ============================================
const BARN_VARIANTS = [
  { id: 'classic', name: 'Classic Barn', complexity: 'high' },
  { id: 'silo', name: 'Barn with Silo', complexity: 'medium' },
  { id: 'lean', name: 'Lean-to Barn', complexity: 'low' },
  { id: 'dutch', name: 'Dutch Barn', complexity: 'medium' },
  { id: 'round', name: 'Round Barn', complexity: 'high' },
  { id: 'bank', name: 'Bank Barn', complexity: 'medium' },
  { id: 'crib', name: 'Corn Crib Barn', complexity: 'low' },
  { id: 'pole', name: 'Pole Barn', complexity: 'low' },
  { id: 'gambrel', name: 'Gambrel Barn', complexity: 'medium' },
  { id: 'monitor', name: 'Monitor Barn', complexity: 'high' }
];

let currentBarn = BARN_VARIANTS[0];
let lastBarnChange = Date.now();
const BARN_ROTATION_MS = 60000; // 60 seconds

function getCurrentBarn() {
  const now = Date.now();
  const elapsed = now - lastBarnChange;

  if (elapsed >= BARN_ROTATION_MS) {
    const rotations = Math.floor(elapsed / BARN_ROTATION_MS);
    const barnIndex = rotations % BARN_VARIANTS.length;
    currentBarn = BARN_VARIANTS[barnIndex];
    lastBarnChange = now - (elapsed % BARN_ROTATION_MS); // Preserve fractional rotation
  }

  return {
    ...currentBarn,
    changedAt: lastBarnChange,
    nextChangeAt: lastBarnChange + BARN_ROTATION_MS
  };
}

// ============================================
// PHRASE GENERATION SYSTEM (Task 4)
// ============================================
const ADJECTIVES = [
  'cerulean', 'hidden', 'broken', 'velvet', 'flickering', 'radiant',
  'thawing', 'luminous', 'bronze', 'melancholy', 'scarlet', 'drifting',
  'ancient', 'jubilant', 'frozen', 'cryptic', 'silent', 'burnished',
  'weathered', 'polished', 'trembling', 'golden', 'silver', 'shadowed',
  'bright', 'dim', 'cracked', 'whole', 'lost', 'found', 'wandering',
  'settled', 'rising', 'falling', 'open', 'closed', 'distant', 'near'
];

const NOUNS = [
  'mandolin', 'lighthouse', 'paradox', 'terrace', 'lantern', 'chronometer',
  'pavilion', 'mirror', 'telescope', 'meadow', 'cathedral', 'quilt',
  'hourglass', 'windmill', 'river', 'harmonica', 'observatory', 'barn',
  'silo', 'fence', 'gate', 'path', 'road', 'bridge', 'tower', 'well',
  'orchard', 'field', 'pasture', 'dawn', 'dusk', 'noon', 'midnight',
  'harvest', 'seed', 'grain', 'hay', 'tools', 'work', 'rest'
];

function generatePhrase(messageId) {
  const seed = crypto.createHash('sha256').update(messageId).digest();
  const adjIndex = seed.readUInt32BE(0) % ADJECTIVES.length;
  const nounIndex = seed.readUInt32BE(4) % NOUNS.length;

  return {
    adjective: ADJECTIVES[adjIndex],
    noun: NOUNS[nounIndex],
    phrase: `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`
  };
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    barn: getCurrentBarn(),
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ============================================
// BARN ENDPOINTS
// ============================================
app.get('/api/barn', (req, res) => {
  res.json(getCurrentBarn());
});

app.get('/api/barn/all', (req, res) => {
  res.json({
    variants: BARN_VARIANTS,
    current: getCurrentBarn(),
    rotationIntervalMs: BARN_ROTATION_MS
  });
});

// ============================================
// PAYMENT ENDPOINTS (Task 5)
// ============================================
// Get supported chains
app.get('/api/payment/chains', (req, res) => {
  res.json(Object.keys(SUPPORTED_CHAINS).map(key => ({
    id: key,
    ...SUPPORTED_CHAINS[key]
  })));
});

// Create payment
app.post('/api/payment/create', (req, res) => {
  const { chain } = req.body;

  if (!chain || !SUPPORTED_CHAINS[chain]) {
    return res.status(400).json({ error: 'Invalid chain. Supported: solana, base' });
  }

  const payment = createPayment(chain);
  payments.set(payment.id, payment);

  res.json(payment);
});

// Get payment status
app.get('/api/payment/:id', (req, res) => {
  const payment = payments.get(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

// Verify payment (webhook or polling)
app.post('/api/payment/verify', (req, res) => {
  const { paymentId, transactionHash } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  const payment = verifyPayment(paymentId, transactionHash || 'simulated-tx');
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  res.json(payment);
});

// Simulate payment for testing (skips actual crypto verification)
app.post('/api/payment/simulate', (req, res) => {
  const { chain } = req.body;

  if (!chain || !SUPPORTED_CHAINS[chain]) {
    return res.status(400).json({ error: 'Invalid chain' });
  }

  const payment = createPayment(chain);
  payment.status = 'confirmed';
  payment.transactionHash = 'simulated-' + Date.now();
  payment.confirmedAt = Date.now();
  payments.set(payment.id, payment);

  res.json(payment);
});

// ============================================
// MESSAGE ENDPOINTS (Tasks 4 & 6)
// ============================================
// Initiate message (generates phrase)
app.post('/api/messages/initiate', (req, res) => {
  const { recipientPhone, paymentId } = req.body;

  if (!recipientPhone || !paymentId) {
    return res.status(400).json({ error: 'Missing recipientPhone or paymentId' });
  }

  // Verify payment exists
  const payment = payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (payment.status !== 'confirmed') {
    return res.status(402).json({ error: 'Payment required. Status: ' + payment.status });
  }

  const messageId = uuidv4();
  const phrase = generatePhrase(messageId);

  const message = {
    id: messageId,
    recipientPhone,
    phrase,
    status: 'pending_recording',
    createdAt: Date.now(),
    paymentId
  };

  messages.set(messageId, message);

  res.json({
    messageId,
    phrase: phrase.phrase,
    expiresAt: Date.now() + 300000 // 5 minutes to record
  });
});

// Upload message video
app.post('/api/messages/:id/upload', express.raw({ type: 'video/webm', limit: '50mb' }), (req, res) => {
  const { id } = req.params;
  const message = messages.get(id);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (message.status !== 'pending_recording') {
    return res.status(400).json({ error: 'Message already recorded' });
  }

  // Store video data (in production: S3/R2)
  message.videoData = req.body;
  message.status = 'recorded';
  message.recordedAt = Date.now();

  res.json({
    success: true,
    messageId: id,
    phrase: message.phrase.phrase
  });
});

// Verify phrase and get message info
app.post('/api/messages/verify', (req, res) => {
  const { phrase } = req.body;

  if (!phrase) {
    return res.status(400).json({ error: 'Missing phrase' });
  }

  // Find message by phrase
  const message = Array.from(messages.values()).find(m =>
    m.phrase.phrase.toLowerCase() === phrase.toLowerCase() &&
    m.status === 'recorded'
  );

  if (!message) {
    return res.status(404).json({ error: 'No message found for this phrase' });
  }

  res.json({
    messageId: message.id,
    verified: true,
    hasVideo: !!message.videoData
  });
});

// Get message video
app.get('/api/messages/:id/video', (req, res) => {
  const { id } = req.params;
  const { phrase } = req.query;

  const message = messages.get(id);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (!phrase || message.phrase.phrase.toLowerCase() !== phrase.toLowerCase()) {
    return res.status(403).json({ error: 'Invalid phrase' });
  }

  if (!message.videoData) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.set('Content-Type', 'video/webm');
  res.send(message.videoData);
});

// Get message by ID (internal/debug)
app.get('/api/messages/:id', (req, res) => {
  const message = messages.get(req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  // Don't return video data in JSON
  const { videoData, ...messageWithoutVideo } = message;
  res.json({
    ...messageWithoutVideo,
    hasVideo: !!videoData
  });
});

// List all messages (debug/admin only)
app.get('/api/messages', (req, res) => {
  const messageList = Array.from(messages.values()).map(m => ({
    id: m.id,
    status: m.status,
    phrase: m.phrase.phrase,
    createdAt: m.createdAt,
    hasVideo: !!m.videoData
  }));
  res.json(messageList);
});

// ============================================
// STATS ENDPOINT
// ============================================
app.get('/api/stats', (req, res) => {
  res.json({
    messages: {
      total: messages.size,
      pending: Array.from(messages.values()).filter(m => m.status === 'pending_recording').length,
      recorded: Array.from(messages.values()).filter(m => m.status === 'recorded').length
    },
    payments: {
      total: payments.size,
      pending: Array.from(payments.values()).filter(p => p.status === 'pending').length,
      confirmed: Array.from(payments.values()).filter(p => p.status === 'confirmed').length
    },
    barn: getCurrentBarn()
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚜 Barnyard server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Barn rotates every ${BARN_ROTATION_MS / 1000} seconds (${BARN_VARIANTS.length} variants)`);
});

module.exports = app;
