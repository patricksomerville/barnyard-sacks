import React, { useState, useEffect, useRef } from 'react';
import BarnAnimation from './BarnAnimation';

function RecipientFlow() {
  const [step, setStep] = useState('input'); // input, verifying, watching, notfound
  const [spokenText, setSpokenText] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [lastAttemptedPhrase, setLastAttemptedPhrase] = useState('');
  const [manualPhrase, setManualPhrase] = useState('');
  
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    // Initialize speech recognition
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError('');
    };
    
    recognitionRef.current.onresult = (event) => {
      // Clear silence timer on speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      
      setSpokenText(transcript);
      
      // Auto-verify if we have enough text (2+ words)
      if (transcript.split(' ').length >= 2) {
        verifyPhrase(transcript);
      }
      
      // Silence detection
      silenceTimerRef.current = setTimeout(() => {
        if (isListening) {
          setError('Still listening... Speak the phrase you were given.');
        }
      }, 4000);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access or type the phrase below.');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try speaking louder or closer to the microphone.');
      } else if (event.error === 'network') {
        setError('Network error. Please check your connection and try again.');
        setIsListening(false);
      }
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const verifyPhrase = async (phrase) => {
    if (step === 'verifying') return; // Prevent duplicate calls
    
    setStep('verifying');
    setLastAttemptedPhrase(phrase);
    
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
        setError('');
        recognitionRef.current?.stop();
      } else {
        // No message found for this phrase
        setStep('notfound');
        setError(`No message found for "${phrase}". The phrase may have expired or been entered incorrectly.`);
        
        // Auto-retry after a delay if still listening
        if (isListening) {
          setTimeout(() => {
            setStep('input');
            setError('Still listening... Try saying the phrase again.');
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setStep('input');
      setError('Error verifying phrase. Please try again.');
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.log('Recognition already started:', err);
      }
    }
    setError('');
    setStep('input');
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualPhrase.trim()) {
      verifyPhrase(manualPhrase.trim().toLowerCase());
    }
  };

  const resetFlow = () => {
    setStep('input');
    setSpokenText('');
    setMessage(null);
    setError('');
    setManualPhrase('');
    setLastAttemptedPhrase('');
  };

  // Video playback view
  if (step === 'watching' && message) {
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
        <BarnAnimation variant="classic" size="small" />
        
        {/* Verified badge */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          color: '#4ade80',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10
        }}>
          <span style={{ fontSize: '1.2rem' }}>✓</span>
          <span>Verified</span>
        </div>
        
        {/* Video player */}
        <video
          ref={videoRef}
          src={`/api/messages/${message.messageId}/video?phrase=${encodeURIComponent(lastAttemptedPhrase)}`}
          autoPlay
          controls
          playsInline
          style={{ 
            maxWidth: '90%', 
            maxHeight: '80vh',
            boxShadow: '0 0 40px rgba(244,240,232,0.1)'
          }}
          onError={(e) => {
            console.error('Video error:', e);
            setError('Error loading video. It may have expired.');
          }}
        />
        
        {/* Video error fallback message */}
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#f4f0e8',
            background: 'rgba(0,0,0,0.8)',
            padding: '2rem',
            borderRadius: '8px'
          }}>
            <p>{error}</p>
            <button
              onClick={resetFlow}
              style={{
                marginTop: '1rem',
                background: '#f4f0e8',
                color: '#040404',
                border: 'none',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif'
              }}
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Back button */}
        <button
          onClick={resetFlow}
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            right: '1.5rem',
            background: 'transparent',
            border: '1px solid rgba(244,240,232,0.3)',
            color: '#f4f0e8',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#f4f0e8';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'rgba(244,240,232,0.3)';
          }}
        >
          Watch another message
        </button>
      </div>
    );
  }

  // Input/verification view
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
      
      <div style={{ zIndex: 10, textAlign: 'center', color: '#f4f0e8', maxWidth: '500px' }}>
        {step === 'verifying' ? (
          <div>
            <div style={{
              width: '50px',
              height: '50px',
              border: '2px solid rgba(244,240,232,0.2)',
              borderTopColor: '#f4f0e8',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ fontWeight: 'normal' }}>Verifying...</h2>
            {spokenText && (
              <p style={{ 
                marginTop: '1rem', 
                opacity: 0.6,
                fontStyle: 'italic'
              }}>
                Heard: "{spokenText}"
              </p>
            )}
          </div>
        ) : (
          <>
            <h2 style={{ 
              marginBottom: '0.5rem',
              fontWeight: 'normal',
              fontSize: '2rem'
            }}>
              Speak the words
            </h2>
            
            <p style={{ 
              opacity: 0.6,
              marginBottom: '2rem',
              fontSize: '1.1rem'
            }}>
              Say the phrase you were given to unlock the message
            </p>
            
            {/* Listen button */}
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                background: isListening 
                  ? 'rgba(255,100,100,0.2)' 
                  : 'transparent',
                border: `1px solid ${isListening ? '#ff9999' : '#f4f0e8'}`,
                color: isListening ? '#ff9999' : '#f4f0e8',
                padding: '1rem 2rem',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                transition: 'all 0.3s ease',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto 1.5rem'
              }}
            >
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isListening ? '#ff9999' : '#4ade80',
                animation: isListening ? 'pulse 1s infinite' : 'none'
              }} />
              {isListening ? 'Stop listening' : 'Start listening'}
            </button>
            
            {/* Heard text */}
            {spokenText && (
              <p style={{ 
                marginTop: '1rem', 
                opacity: 0.5,
                fontStyle: 'italic',
                fontSize: '0.9rem'
              }}>
                Heard: "{spokenText}"
              </p>
            )}
            
            {/* Error message */}
            {error && (
              <div style={{
                background: 'rgba(255,100,100,0.1)',
                border: '1px solid rgba(255,100,100,0.3)',
                color: '#ff9999',
                padding: '1rem',
                borderRadius: '4px',
                marginTop: '1.5rem',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
            
            {/* Manual entry fallback */}
            {!recognitionSupported || error ? (
              <div style={{ marginTop: '2rem' }}>
                <p style={{ 
                  opacity: 0.6, 
                  fontSize: '0.9rem',
                  marginBottom: '1rem'
                }}>
                  Or type the phrase manually:
                </p>
                
                <form onSubmit={handleManualSubmit} style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center'
                }}>
                  <input
                    type="text"
                    value={manualPhrase}
                    onChange={e => setManualPhrase(e.target.value)}
                    placeholder="e.g., cerulean mandolin"
                    style={{
                      background: 'transparent',
                      border: '1px solid #f4f0e8',
                      color: '#f4f0e8',
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      fontFamily: 'Georgia, serif',
                      width: '200px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!manualPhrase.trim()}
                    style={{
                      background: manualPhrase.trim() ? '#f4f0e8' : 'rgba(244,240,232,0.3)',
                      color: '#040404',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      cursor: manualPhrase.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'Georgia, serif'
                    }}
                  >
                    Unlock
                  </button>
                </form>
              </div>
            ) : null}
          </>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default RecipientFlow;
