import React, { useState, useEffect } from 'react';
import BarnAnimation from './BarnAnimation';

function PaymentStep({ onComplete, onError }) {
  const [chains, setChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredChain, setHoveredChain] = useState(null);

  useEffect(() => {
    // Fetch available payment chains
    fetch('/api/payment/chains')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load payment options');
        return r.json();
      })
      .then(data => {
        setChains(data);
      })
      .catch(err => {
        console.log('Using default chains:', err);
        // Fallback chains if server is unavailable
        setChains([
          { id: 'solana', name: 'Solana', currency: 'SOL' },
          { id: 'base', name: 'Base', currency: 'ETH' }
        ]);
      });
  }, []);

  const createPayment = async (chain) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain })
      });
      
      if (!res.ok) throw new Error('Failed to create payment');
      
      const paymentData = await res.json();
      setPayment(paymentData);
      setSelectedChain(chain);
    } catch (err) {
      onError?.(err);
      // Fallback for development/testing
      setPayment({
        id: 'test-payment-' + Date.now(),
        chain,
        amountUsd: 2,
        receiverAddress: chain === 'solana' 
          ? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
          : '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        status: 'pending'
      });
      setSelectedChain(chain);
    } finally {
      setLoading(false);
    }
  };

  const simulatePaymentConfirmation = () => {
    // In production, this would verify the transaction on-chain
    // For MVP, we simulate the payment confirmation
    const confirmedPayment = {
      ...payment,
      status: 'confirmed',
      confirmedAt: Date.now()
    };
    onComplete(confirmedPayment);
  };

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
      
      <div style={{ zIndex: 10, textAlign: 'center', maxWidth: '600px' }}>
        <h2 style={{ 
          color: '#f4f0e8', 
          marginBottom: '0.5rem',
          fontSize: '2rem',
          fontWeight: 'normal'
        }}>
          Send a message
        </h2>
        
        <p style={{
          color: '#f4f0e8',
          opacity: 0.6,
          marginBottom: '3rem',
          fontSize: '1.1rem'
        }}>
          $2 to send an authenticated video message
        </p>
        
        {!selectedChain ? (
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {chains.map(chain => (
              <button
                key={chain.id}
                onClick={() => createPayment(chain.id)}
                onMouseEnter={() => setHoveredChain(chain.id)}
                onMouseLeave={() => setHoveredChain(null)}
                disabled={loading}
                style={{
                  background: hoveredChain === chain.id ? 'rgba(244,240,232,0.1)' : 'transparent',
                  border: '1px solid #f4f0e8',
                  color: '#f4f0e8',
                  padding: '1.5rem 2.5rem',
                  fontSize: '1.1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Georgia, serif',
                  transition: 'all 0.3s ease',
                  minWidth: '180px',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading && hoveredChain === chain.id ? (
                  'Loading...'
                ) : (
                  <>
                    <div>{chain.name}</div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.6, 
                      marginTop: '0.3rem' 
                    }}>
                      Pay with {chain.currency}
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ color: '#f4f0e8' }}>
            <p style={{ 
              marginBottom: '1.5rem',
              fontSize: '1.1rem'
            }}>
              Send $2 USD to this address:
            </p>
            
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(244,240,232,0.2)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              {payment?.receiverAddress}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={simulatePaymentConfirmation}
                style={{
                  background: '#f4f0e8',
                  color: '#040404',
                  border: 'none',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f4f0e8';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                I've paid — continue
              </button>
              
              <button
                onClick={() => {
                  setSelectedChain(null);
                  setPayment(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(244,240,232,0.3)',
                  color: '#f4f0e8',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#f4f0e8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(244,240,232,0.3)';
                }}
              >
                Back
              </button>
            </div>
            
            <p style={{
              marginTop: '2rem',
              fontSize: '0.85rem',
              opacity: 0.5,
              fontStyle: 'italic'
            }}>
              Payment ID: {payment?.id}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentStep;
