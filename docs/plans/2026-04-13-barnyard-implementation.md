# Barnyard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-sided ritual messaging system at `barnyard.world` where senders pay $2 crypto to send authenticated ASCII video messages unlocked by spoken phrases, and recipients unlock messages by speaking the same phrases.

**Architecture:** Node/Express backend with message storage and phrase generation. React frontend with WebRTC for camera access, Canvas API for ASCII video rendering, and Web Audio API for phrase detection. Solana/Base wallet connection for payments. All deployed to Wix with custom domain.

**Tech Stack:** Node.js, Express, React, WebRTC, Canvas API, Solana Web3.js, Wagmi/Viem for EVM, Web Audio API, localStorage for message persistence (MVP).

---

## Domain & Infrastructure

### Task 1: Secure barnyard.world domain

**Files:**
- Action: Wix domain purchase via Wix dashboard (manual)

- [ ] **Step 1: Purchase barnyard.world through Wix**
  
  Go to Wix dashboard → Domains → Search "barnyard.world" → Purchase if available at non-premium price.

- [ ] **Step 2: Verify domain ownership**
  
  Check that barnyard.world appears in your Wix domains list.

---

## Backend (Node/Express)

### Task 2: Initialize backend project

**Files:**
- Create: `server/package.json`
- Create: `server/server.js`

- [ ] **Step 1: Create backend package.json**

```json
{
  "name": "barnyard-server",
  "version": "1.0.0",
  "description": "Barnyard ritual messaging backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.0",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

- [ ] **Step 2: Create basic Express server**

```javascript
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage (replace with DB for production)
const messages = new Map();
const payments = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', barn: getCurrentBarn() });
});

app.listen(PORT, () => {
  console.log(`Barnyard server running on port ${PORT}`);
});
```

- [ ] **Step 3: Install dependencies**

```bash
cd server && npm install
```

- [ ] **Step 4: Test server starts**

```bash
npm run dev
```

Expected: Server starts on port 3001, no errors.

---

### Task 3: Implement barn rotation system

**Files:**
- Modify: `server/server.js`

- [ ] **Step 1: Create barn definitions**

```javascript
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
    lastBarnChange = now;
  }
  
  return {
    ...currentBarn,
    changedAt: lastBarnChange,
    nextChangeAt: lastBarnChange + BARN_ROTATION_MS
  };
}
```

- [ ] **Step 2: Add barn endpoint**

```javascript
app.get('/api/barn', (req, res) => {
  res.json(getCurrentBarn());
});
```

- [ ] **Step 3: Test barn rotation**

```bash
curl http://localhost:3001/api/barn
```

Expected: Returns current barn with id, name, changedAt, nextChangeAt.

---

### Task 4: Implement phrase generation system

**Files:**
- Modify: `server/server.js`

- [ ] **Step 1: Create word lists**

```javascript
const ADJECTIVES = [
  'cerulean', 'hidden', 'broken', 'velvet', 'flickering', 'radiant',
  'thawing', 'luminous', 'bronze', 'melancholy', 'scarlet', 'drifting',
  'ancient', 'jubilant', 'frozen', 'cryptic', 'silent', 'burnished',
  'weathered', ' polished', 'trembling', 'golden', 'silver', 'shadowed',
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
```

- [ ] **Step 2: Add phrase generation endpoint**

```javascript
app.post('/api/messages/initiate', (req, res) => {
  const { recipientPhone, paymentId } = req.body;
  
  if (!recipientPhone || !paymentId) {
    return res.status(400).json({ error: 'Missing recipientPhone or paymentId' });
  }
  
  // Verify payment exists
  const payment = payments.get(paymentId);
  if (!payment || payment.status !== 'confirmed') {
    return res.status(402).json({ error: 'Payment required' });
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
```

- [ ] **Step 3: Test phrase generation**

```bash
curl -X POST http://localhost:3001/api/messages/initiate \
  -H "Content-Type: application/json" \
  -d '{"recipientPhone": "+1234567890", "paymentId": "test-payment"}'
```

Expected: Returns messageId and unique two-word phrase.

---

### Task 5: Implement payment system (crypto)

**Files:**
- Modify: `server/server.js`
- Create: `server/payments.js`

- [ ] **Step 1: Create payment module**

```javascript
// server/payments.js
const crypto = require('crypto');

const PAYMENT_AMOUNT_USD = 2;

// Supported chains
const SUPPORTED_CHAINS = {
  solana: {
    name: 'Solana',
    currency: 'SOL',
    // Mainnet receiver address (user must provide)
    receiverAddress: process.env.SOLANA_RECEIVER || 'PLACEHOLDER'
  },
  base: {
    name: 'Base',
    currency: 'ETH',
    receiverAddress: process.env.BASE_RECEIVER || 'PLACEHOLDER'
  }
};

function createPayment(chain) {
  if (!SUPPORTED_CHAINS[chain]) {
    throw new Error('Unsupported chain');
  }
  
  const paymentId = crypto.randomUUID();
  const chainConfig = SUPPORTED_CHAINS[chain];
  
  return {
    id: paymentId,
    chain,
    amountUsd: PAYMENT_AMOUNT_USD,
    receiverAddress: chainConfig.receiverAddress,
    status: 'pending',
    createdAt: Date.now()
  };
}

function verifyPayment(paymentId, transactionHash) {
  // In production: verify on-chain
  // For MVP: simulate verification
  const payment = payments.get(paymentId);
  if (!payment) return null;
  
  payment.status = 'confirmed';
  payment.transactionHash = transactionHash;
  payment.confirmedAt = Date.now();
  
  return payment;
}

module.exports = { createPayment, verifyPayment, SUPPORTED_CHAINS };
```

- [ ] **Step 2: Add payment endpoints**

```javascript
const { createPayment, verifyPayment, SUPPORTED_CHAINS } = require('./payments');

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
    return res.status(400).json({ error: 'Invalid chain' });
  }
  
  const payment = createPayment(chain);
  payments.set(payment.id, payment);
  
  res.json(payment);
});

// Verify payment (webhook or polling)
app.post('/api/payment/verify', (req, res) => {
  const { paymentId, transactionHash } = req.body;
  
  const payment = verifyPayment(paymentId, transactionHash);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  res.json(payment);
});
```

- [ ] **Step 3: Test payment flow**

```bash
# Get chains
curl http://localhost:3001/api/payment/chains

# Create payment
curl -X POST http://localhost:3001/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"chain": "solana"}'
```

Expected: Returns payment object with receiver address.

---

### Task 6: Implement message storage

**Files:**
- Modify: `server/server.js`

- [ ] **Step 1: Add message upload endpoint**

```javascript
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
```

- [ ] **Step 2: Add message retrieval endpoint**

```javascript
app.post('/api/messages/verify', (req, res) => {
  const { phrase } = req.body;
  
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

app.get('/api/messages/:id/video', (req, res) => {
  const { id } = req.params;
  const { phrase } = req.query;
  
  const message = messages.get(id);
  
  if (!message || message.phrase.phrase.toLowerCase() !== phrase?.toLowerCase()) {
    return res.status(403).json({ error: 'Invalid phrase' });
  }
  
  if (!message.videoData) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  res.set('Content-Type', 'video/webm');
  res.send(message.videoData);
});
```

---

## Frontend (React SPA)

### Task 7: Initialize frontend project

**Files:**
- Create: `client/package.json`
- Create: `client/public/index.html`
- Create: `client/src/index.js`

- [ ] **Step 1: Create React package.json**

```json
{
  "name": "barnyard-client",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@solana/web3.js": "^1.87.0",
    "wagmi": "^1.4.0",
    "viem": "^1.19.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "react-scripts": "5.0.1"
  }
}
```

- [ ] **Step 2: Create HTML entry**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barnyard | Speak the Words</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #040404;
      color: #f4f0e8;
      font-family: Georgia, "Times New Roman", serif;
      overflow: hidden;
    }
    #root { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

- [ ] **Step 3: Create React entry**

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

---

### Task 8: Build landing page

**Files:**
- Create: `client/src/App.js`
- Create: `client/src/components/Landing.js`
- Create: `client/src/components/BarnAnimation.js`

- [ ] **Step 1: Create App router**

```javascript
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import SenderFlow from './components/SenderFlow';
import RecipientFlow from './components/RecipientFlow';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/send" element={<SenderFlow />} />
      <Route path="/receive" element={<RecipientFlow />} />
    </Routes>
  );
}

export default App;
```

- [ ] **Step 2: Create Landing component**

```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarnAnimation from './BarnAnimation';

function Landing() {
  const navigate = useNavigate();
  const [barn, setBarn] = useState(null);

  useEffect(() => {
    fetch('/api/barn')
      .then(r => r.json())
      .then(setBarn);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#040404',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <BarnAnimation variant={barn?.id || 'classic'} />
      
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate('/send')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f4f0e8',
            fontSize: '1.5rem',
            fontFamily: 'Georgia, serif',
            cursor: 'pointer',
            padding: '1rem 2rem'
          }}
        >
          I want to send a message
        </button>
        
        <button
          onClick={() => navigate('/receive')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f4f0e8',
            fontSize: '1.5rem',
            fontFamily: 'Georgia, serif',
            cursor: 'pointer',
            padding: '1rem 2rem'
          }}
        >
          Someone sent me a message
        </button>
      </div>
    </div>
  );
}

export default Landing;
```

---

### Task 9: Build barn animation component

**Files:**
- Create: `client/src/components/BarnAnimation.js`

- [ ] **Step 1: Create SVG barn animation**

```javascript
import React, { useEffect, useRef } from 'react';

const BARN_PATHS = {
  classic: `
    M 50 80 L 50 40 L 25 40 L 50 15 L 75 40 L 50 40
    M 50 15 L 50 10
    M 35 80 L 35 55 Q 50 50 65 55 L 65 80
    M 42 55 L 42 80
    M 58 55 L 58 80
    M 50 60 L 50 75
  `,
  silo: `
    M 50 80 L 50 35 L 30 35 L 50 10 L 70 35 L 50 35
    M 70 35 L 70 80
    M 75 35 Q 85 35 85 25 Q 85 15 75 15 Q 65 15 65 25 Q 65 35 75 35
    M 75 15 L 75 10
  `,
  // Add more variants...
};

function BarnAnimation({ variant = 'classic', size = 'large' }) {
  const svgRef = useRef();
  
  const dimensions = size === 'large' ? 
    { width: '100vw', height: '100vh' } : 
    { width: '100px', height: '100px' };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      style={{
        position: size === 'large' ? 'absolute' : 'relative',
        width: dimensions.width,
        height: dimensions.height,
        opacity: 0.15
      }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <path
        d={BARN_PATHS[variant] || BARN_PATHS.classic}
        fill="none"
        stroke="#f4f0e8"
        strokeWidth="0.5"
        filter="url(#glow)"
        style={{
          animation: 'barnDrift 20s ease-in-out infinite'
        }}
      />
      
      <style>{`
        @keyframes barnDrift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(1px, -1px) rotate(0.5deg); }
          50% { transform: translate(-1px, 1px) rotate(-0.5deg); }
          75% { transform: translate(0.5px, 0.5px) rotate(0.25deg); }
        }
      `}</style>
    </svg>
  );
}

export default BarnAnimation;
```

---

### Task 10: Build sender flow

**Files:**
- Create: `client/src/components/SenderFlow.js`
- Create: `client/src/components/PaymentStep.js`
- Create: `client/src/components/PhraseGate.js`
- Create: `client/src/components/RecordingChamber.js`

- [ ] **Step 1: Create SenderFlow component**

```javascript
import React, { useState } from 'react';
import PaymentStep from './PaymentStep';
import PhraseGate from './PhraseGate';
import RecordingChamber from './RecordingChamber';

function SenderFlow() {
  const [step, setStep] = useState('payment'); // payment, phrase, recording, complete
  const [messageData, setMessageData] = useState(null);

  const handlePaymentComplete = (payment) => {
    setMessageData({ payment });
    setStep('phrase');
  };

  const handlePhraseComplete = (message) => {
    setMessageData(prev => ({ ...prev, ...message }));
    setStep('recording');
  };

  const handleRecordingComplete = () => {
    setStep('complete');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#040404' }}>
      {step === 'payment' && <PaymentStep onComplete={handlePaymentComplete} />}
      {step === 'phrase' && <PhraseGate messageData={messageData} onComplete={handlePhraseComplete} />}
      {step === 'recording' && <RecordingChamber messageData={messageData} onComplete={handleRecordingComplete} />}
      {step === 'complete' && (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#f4f0e8',
          fontSize: '2rem'
        }}>
          Thank you. Your message has been sent.
        </div>
      )}
    </div>
  );
}

export default SenderFlow;
```

- [ ] **Step 2: Create PaymentStep with wallet connection**

```javascript
import React, { useState, useEffect } from 'react';
import BarnAnimation from './BarnAnimation';

function PaymentStep({ onComplete }) {
  const [chains, setChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    fetch('/api/payment/chains').then(r => r.json()).then(setChains);
  }, []);

  const createPayment = async (chain) => {
    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain })
    });
    const paymentData = await res.json();
    setPayment(paymentData);
    setSelectedChain(chain);
  };

  // Wallet connection and payment verification would go here
  // For MVP: simulate with button

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <BarnAnimation variant="classic" />
      
      <div style={{ zIndex: 10, textAlign: 'center' }}>
        <h2 style={{ color: '#f4f0e8', marginBottom: '2rem' }}>Send a message ($2)</h2>
        
        {!selectedChain ? (
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            {chains.map(chain => (
              <button
                key={chain.id}
                onClick={() => createPayment(chain.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid #f4f0e8',
                  color: '#f4f0e8',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Pay with {chain.name}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ color: '#f4f0e8' }}>
            <p>Send $2 to:</p>
            <code style={{ 
              display: 'block', 
              margin: '1rem 0', 
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              wordBreak: 'break-all'
            }}>
              {payment?.receiverAddress}
            </code>
            <button
              onClick={() => onComplete(payment)}
              style={{
                background: '#f4f0e8',
                color: '#040404',
                border: 'none',
                padding: '1rem 2rem',
                cursor: 'pointer'
              }}
            >
              I've paid - continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentStep;
```

- [ ] **Step 3: Create PhraseGate component**

```javascript
import React, { useState, useEffect, useRef } from 'react';
import BarnAnimation from './BarnAnimation';

function PhraseGate({ messageData, onComplete }) {
  const [recipientPhone, setRecipientPhone] = useState('');
  const [phrase, setPhrase] = useState(null);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join(' ')
          .toLowerCase();
        setSpokenText(transcript);
        
        // Check if phrase is spoken
        if (phrase && transcript.includes(phrase.phrase.toLowerCase())) {
          setFeedback('Thank you. Send your message now.');
          recognitionRef.current.stop();
          setTimeout(() => onComplete({ ...messageData, phrase }), 2000);
        }
      };
    }
  }, [phrase]);

  const initiateMessage = async () => {
    const res = await fetch('/api/messages/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientPhone,
        paymentId: messageData.payment.id
      })
    });
    const data = await res.json();
    setPhrase({ phrase: data.phrase, id: data.messageId });
    
    // Start listening
    recognitionRef.current?.start();
  };

  if (!phrase) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <BarnAnimation variant="classic" />
        
        <div style={{ zIndex: 10, textAlign: 'center' }}>
          <input
            type="tel"
            value={recipientPhone}
            onChange={e => setRecipientPhone(e.target.value)}
            placeholder="Recipient phone number"
            style={{
              background: 'transparent',
              border: '1px solid #f4f0e8',
              color: '#f4f0e8',
              padding: '1rem',
              fontSize: '1rem',
              width: '300px',
              marginBottom: '1rem'
            }}
          />
          <button
            onClick={initiateMessage}
            disabled={!recipientPhone}
            style={{
              background: '#f4f0e8',
              color: '#040404',
              border: 'none',
              padding: '1rem 2rem',
              cursor: recipientPhone ? 'pointer' : 'not-allowed'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <BarnAnimation variant="classic" />
      
      <div style={{ zIndex: 10, textAlign: 'center', color: '#f4f0e8' }}>
        {!feedback ? (
          <>
            <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
              {phrase.phrase}
            </h1>
            <p style={{ opacity: 0.6 }}>
              Say the words clearly...
            </p>
            {spokenText && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.4 }}>
                Heard: {spokenText}
              </p>
            )}
          </>
        ) : (
          <h2>{feedback}</h2>
        )}
      </div>
    </div>
  );
}

export default PhraseGate;
```

- [ ] **Step 4: Create RecordingChamber component**

This is the most complex component. It needs:
- Camera access via WebRTC
- Real-time ASCII conversion
- Text overlay system
- 2-minute fixed timer
- Video recording and upload

```javascript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import BarnAnimation from './BarnAnimation';

function RecordingChamber({ messageData, onComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [typedText, setTypedText] = useState('');
  const [overlays, setOverlays] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Initialize camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ASCII conversion
  const convertToASCII = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = 80; // Low res for ASCII effect
    const height = 60;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Convert to ASCII (simplified - full implementation in code)
    const chars = ' .:-=+*#%@';
    let ascii = '';
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const brightness = (r + g + b) / 3;
      const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
      ascii += chars[charIndex];
      
      if ((i / 4 + 1) % width === 0) ascii += '\n';
    }
    
    return ascii;
  }, []);

  // Start recording
  const startRecording = () => {
    setIsRecording(true);
    
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      // Upload to server
      await fetch(`/api/messages/${messageData.phrase.id}/upload`, {
        method: 'POST',
        body: blob
      });
      
      onComplete();
    };
    
    mediaRecorder.start(1000); // Collect 1-second chunks
  };

  // Timer
  useEffect(() => {
    if (!isRecording || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          mediaRecorderRef.current?.stop();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  // Handle typing
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && typedText.trim()) {
      const newOverlay = {
        id: Date.now(),
        text: typedText.trim(),
        createdAt: Date.now()
      };
      setOverlays(prev => [...prev, newOverlay]);
      setTypedText('');
      
      // Fade out after 10 seconds
      setTimeout(() => {
        setOverlays(prev => prev.filter(o => o.id !== newOverlay.id));
      }, 10000);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#040404',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Hidden video element for camera access */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      
      {/* Hidden canvas for ASCII processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* ASCII display */}
      <pre style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        padding: '2rem',
        fontSize: '8px',
        lineHeight: '8px',
        color: '#f4f0e8',
        fontFamily: 'monospace',
        whiteSpace: 'pre',
        overflow: 'hidden'
      }}>
        {/* ASCII frame would render here */}
        [ASCII video rendering]
      </pre>
      
      {/* Small barn in corner */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        width: '100px',
        height: '100px'
      }}>
        <BarnAnimation variant="classic" size="small" />
      </div>
      
      {/* Text overlays */}
      {overlays.map(overlay => (
        <div
          key={overlay.id}
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            color: '#f4f0e8',
            fontSize: '2rem',
            animation: 'slideAcross 10s linear forwards, fadeOut 10s ease-in forwards',
            whiteSpace: 'nowrap'
          }}
        >
          {overlay.text}
        </div>
      ))}
      
      {/* Timer */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        color: '#f4f0e8',
        fontSize: '1.5rem'
      }}>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>
      
      {/* Text input */}
      {isRecording && (
        <input
          type="text"
          value={typedText}
          onChange={e => setTypedText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type and press Enter..."
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'transparent',
            border: '1px solid rgba(244,240,232,0.3)',
            color: '#f4f0e8',
            padding: '1rem',
            width: '400px',
            fontSize: '1rem',
            zIndex: 100
          }}
        />
      )}
      
      {/* Start button */}
      {!isRecording && (
        <button
          onClick={startRecording}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#f4f0e8',
            color: '#040404',
            border: 'none',
            padding: '2rem 4rem',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          Thank you. Send your message now.
        </button>
      )}
      
      <style>{`
        @keyframes slideAcross {
          from { transform: translateX(0); }
          to { transform: translateX(80vw); }
        }
        @keyframes fadeOut {
          0%, 80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default RecordingChamber;
```

---

### Task 11: Build recipient flow

**Files:**
- Create: `client/src/components/RecipientFlow.js`

- [ ] **Step 1: Create RecipientFlow component**

```javascript
import React, { useState, useEffect, useRef } from 'react';
import BarnAnimation from './BarnAnimation';

function RecipientFlow() {
  const [step, setStep] = useState('input'); // input, verifying, watching
  const [inputPhrase, setInputPhrase] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [spokenText, setSpokenText] = useState('');
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join(' ')
          .toLowerCase();
        setSpokenText(transcript);
        
        // Auto-verify if phrase detected
        if (transcript.length > 3) {
          verifyPhrase(transcript);
        }
      };
    }
  }, []);

  const verifyPhrase = async (phrase) => {
    setStep('verifying');
    
    try {
      const res = await fetch('/api/messages/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage(data);
        setStep('watching');
        recognitionRef.current?.stop();
      } else {
        setError('No message found. Keep trying...');
        setStep('input');
      }
    } catch (err) {
      setError('Error verifying. Try again.');
      setStep('input');
    }
  };

  const startListening = () => {
    recognitionRef.current?.start();
  };

  if (step === 'watching' && message) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#040404',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <BarnAnimation variant="classic" size="small" />
        
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          color: '#f4f0e8'
        }}>
          Verified.
        </div>
        
        <video
          src={`/api/messages/${message.messageId}/video?phrase=${encodeURIComponent(inputPhrase)}`}
          autoPlay
          controls
          style={{ maxWidth: '90%', maxHeight: '90%' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <BarnAnimation variant="classic" />
      
      <div style={{ zIndex: 10, textAlign: 'center', color: '#f4f0e8' }}>
        {step === 'verifying' ? (
          <h2>Verifying...</h2>
        ) : (
          <>
            <h2 style={{ marginBottom: '2rem' }}>Speak the words you received</h2>
            
            <button
              onClick={startListening}
              style={{
                background: 'transparent',
                border: '1px solid #f4f0e8',
                color: '#f4f0e8',
                padding: '1rem 2rem',
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              Start listening
            </button>
            
            {spokenText && (
              <p style={{ opacity: 0.6, marginTop: '1rem' }}>
                Heard: {spokenText}
              </p>
            )}
            
            {error && (
              <p style={{ color: '#ff6b6b', marginTop: '1rem' }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RecipientFlow;
```

---

## Wix Integration

### Task 12: Create Wix site and deploy

**Files:**
- Action: Wix dashboard configuration

- [ ] **Step 1: Create new Wix site**

Use WixSiteBuilder tool with prompt:
"Create a minimal black website with custom code integration for barnyard.world"

- [ ] **Step 2: Configure custom domain**

In Wix dashboard:
1. Domains → Connect domain
2. Enter barnyard.world
3. Follow DNS configuration if external, or purchase if through Wix

- [ ] **Step 3: Enable Corvid/Velo for custom code**

In Wix Editor:
1. Dev Mode → Turn on
2. Add custom elements as needed

- [ ] **Step 4: Build and upload frontend**

```bash
cd client && npm run build
```

Upload `build/` folder contents to Wix static hosting.

- [ ] **Step 5: Deploy backend**

Options:
1. Wix Functions (serverless)
2. External hosting (Render/Railway) with CORS
3. Wix Premium plan with Node.js

For MVP: Use external hosting and configure CORS.

---

## Testing & Verification

### Task 13: End-to-end testing

- [ ] **Step 1: Test landing page**
  
  Navigate to barnyard.world
  Expected: Black screen, animated barn, two centered text options

- [ ] **Step 2: Test sender flow**
  
  1. Click "I want to send a message"
  2. Select chain (Solana/Base)
  3. Enter recipient phone
  4. See unique phrase
  5. Speak phrase
  6. Unlock recording chamber
  7. Record 2-minute message with text overlays
  8. Complete and see "Thank you" confirmation

- [ ] **Step 3: Test recipient flow**
  
  1. Click "Someone sent me a message"
  2. Speak received phrase
  3. See "Verified."
  4. Watch video

- [ ] **Step 4: Verify barn rotation**
  
  Wait 60 seconds, refresh page
  Expected: Different barn variant

- [ ] **Step 5: Test error cases**
  
  - Wrong phrase: Should show soft error
  - No camera: Should show error message
  - Payment failure: Should block progression

---

## Manual Steps Required

1. **Purchase barnyard.world domain** through Wix or transfer from Namecheap if recovered

2. **Set up crypto wallet addresses** for payments:
   - Add SOLANA_RECEIVER environment variable with your Solana address
   - Add BASE_RECEIVER environment variable with your Base/ETH address

3. **Deploy backend** to hosting service (Render, Railway, or similar)

4. **Configure Wix site**:
   - Create new site in Wix dashboard
   - Enable custom code/Velo
   - Connect barnyard.world domain
   - Upload built frontend files

5. **Test wallet connections** with small amounts before going live

6. **Set up SSL** (Wix provides automatically for connected domains)

7. **Configure SMS service** (Twilio or similar) for sending phrases to recipients

8. **Add privacy policy/terms** as required for payment processing

---

**Plan complete.** Ready for implementation.