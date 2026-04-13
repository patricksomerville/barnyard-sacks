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

// In-memory payments storage (passed from server.js)
let paymentsStore;

function initPaymentsStore(store) {
  paymentsStore = store;
}

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
  const payment = paymentsStore.get(paymentId);
  if (!payment) return null;

  payment.status = 'confirmed';
  payment.transactionHash = transactionHash;
  payment.confirmedAt = Date.now();

  return payment;
}

module.exports = { createPayment, verifyPayment, SUPPORTED_CHAINS, initPaymentsStore };
