import React, { useState } from 'react';
import PaymentStep from './PaymentStep';
import PhraseGate from './PhraseGate';
import RecordingChamber from './RecordingChamber';

function SenderFlow() {
  const [step, setStep] = useState('payment'); // payment, phrase, recording, complete
  const [messageData, setMessageData] = useState(null);
  const [error, setError] = useState(null);

  const handlePaymentComplete = (payment) => {
    setMessageData({ payment });
    setStep('phrase');
    setError(null);
  };

  const handlePhraseComplete = (message) => {
    setMessageData(prev => ({ ...prev, ...message }));
    setStep('recording');
    setError(null);
  };

  const handleRecordingComplete = () => {
    setStep('complete');
    setError(null);
  };

  const handleError = (err) => {
    setError(err.message || 'Something went wrong');
  };

  const handleReset = () => {
    setStep('payment');
    setMessageData(null);
    setError(null);
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#040404',
      position: 'relative'
    }}>
      {/* Error display */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,100,100,0.1)',
          border: '1px solid rgba(255,100,100,0.3)',
          color: '#ff9999',
          padding: '1rem 2rem',
          borderRadius: '4px',
          zIndex: 1000,
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '1rem',
              background: 'transparent',
              border: 'none',
              color: '#ff9999',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step content */}
      {step === 'payment' && (
        <PaymentStep 
          onComplete={handlePaymentComplete} 
          onError={handleError}
        />
      )}
      
      {step === 'phrase' && (
        <PhraseGate 
          messageData={messageData} 
          onComplete={handlePhraseComplete}
          onError={handleError}
        />
      )}
      
      {step === 'recording' && (
        <RecordingChamber 
          messageData={messageData} 
          onComplete={handleRecordingComplete}
          onError={handleError}
        />
      )}
      
      {step === 'complete' && (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#f4f0e8',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem',
            fontWeight: 'normal'
          }}>
            Thank you.
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            opacity: 0.8,
            marginBottom: '2rem'
          }}>
            Your message has been sent.
          </p>
          <p style={{ 
            fontSize: '1rem', 
            opacity: 0.6,
            fontStyle: 'italic',
            marginBottom: '3rem'
          }}>
            Phrase: {messageData?.phrase?.phrase}
          </p>
          <button
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: '1px solid #f4f0e8',
              color: '#f4f0e8',
              padding: '1rem 2rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(244,240,232,0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            Send another message
          </button>
        </div>
      )}

      {/* Progress indicator */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.5rem',
        zIndex: 100
      }}>
        {['payment', 'phrase', 'recording', 'complete'].map((s, i) => (
          <div
            key={s}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: step === s ? '#f4f0e8' : 'rgba(244,240,232,0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default SenderFlow;
