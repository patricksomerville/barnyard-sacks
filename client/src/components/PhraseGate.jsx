import React, { useState, useEffect, useRef } from 'react';
import BarnAnimation from './BarnAnimation';

function PhraseGate({ messageData, onComplete, onError }) {
  const [recipientPhone, setRecipientPhone] = useState('');
  const [phrase, setPhrase] = useState(null);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      onError?.(new Error('Speech recognition not supported in this browser. Please use Chrome or Edge.'));
      return;
    }

    // Initialize speech recognition
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setFeedback('Listening...');
    };
    
    recognitionRef.current.onresult = (event) => {
      // Clear silence timer on new speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      
      setSpokenText(transcript);
      
      // Check if phrase is spoken (allow partial matches)
      if (phrase) {
        const targetPhrase = phrase.phrase.toLowerCase();
        const words = targetPhrase.split(' ');
        const transcriptWords = transcript.split(' ');
        
        // Check if all words in phrase appear in transcript
        const allWordsFound = words.every(word => 
          transcriptWords.some(tw => tw.includes(word) || word.includes(tw))
        );
        
        if (allWordsFound || transcript.includes(targetPhrase)) {
          setFeedback('Phrase recognized. Preparing chamber...');
          setIsListening(false);
          recognitionRef.current.stop();
          
          // Delay to show feedback before transitioning
          setTimeout(() => {
            onComplete({ ...messageData, phrase });
          }, 1500);
        }
      }
      
      // Set silence timer
      silenceTimerRef.current = setTimeout(() => {
        if (isListening) {
          setFeedback('Still listening... Say the phrase clearly.');
        }
      }, 3000);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setFeedback('Microphone access denied. Please allow microphone access.');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        setFeedback('No speech detected. Try speaking louder.');
      } else if (event.error === 'network') {
        setFeedback('Network error. Please try again.');
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
  }, [phrase, onComplete, messageData, onError]);

  const initiateMessage = async () => {
    if (!recipientPhone || recipientPhone.length < 10) {
      onError?.(new Error('Please enter a valid phone number'));
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/messages/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone,
          paymentId: messageData?.payment?.id || 'test-payment'
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to initiate message');
      }
      
      const data = await res.json();
      setPhrase({ phrase: data.phrase, id: data.messageId });
    } catch (err) {
      // Fallback for development
      console.log('Using fallback phrase generation:', err);
      
      // Generate a deterministic phrase based on timestamp
      const adjectives = ['cerulean', 'hidden', 'velvet', 'radiant', 'silent', 'golden', 'ancient', 'bright'];
      const nouns = ['mandolin', 'lighthouse', 'terrace', 'lantern', 'mirror', 'meadow', 'cathedral', 'barn'];
      
      const adj = adjectives[Math.floor(Date.now() % adjectives.length)];
      const noun = nouns[Math.floor((Date.now() / 1000) % nouns.length)];
      const generatedPhrase = `${adj} ${noun}`;
      
      setPhrase({ 
        phrase: generatedPhrase, 
        id: 'msg-' + Date.now() 
      });
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.log('Recognition already started or error:', err);
      }
    }
  };

  // Start listening automatically when phrase is displayed
  useEffect(() => {
    if (phrase && recognitionSupported) {
      const timer = setTimeout(() => {
        startListening();
      }, 1000); // Give user a moment to read
      
      return () => clearTimeout(timer);
    }
  }, [phrase, recognitionSupported]);

  // Phone input view
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
          <h2 style={{ 
            color: '#f4f0e8', 
            marginBottom: '0.5rem',
            fontWeight: 'normal'
          }}>
            Who is this for?
          </h2>
          
          <p style={{ 
            color: '#f4f0e8', 
            opacity: 0.6,
            marginBottom: '2rem'
          }}>
            Enter the recipient's phone number
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <input
              type="tel"
              value={recipientPhone}
              onChange={e => setRecipientPhone(e.target.value)}
              placeholder="(555) 123-4567"
              disabled={loading}
              style={{
                background: 'transparent',
                border: '1px solid #f4f0e8',
                color: '#f4f0e8',
                padding: '1rem 1.5rem',
                fontSize: '1.2rem',
                width: '280px',
                fontFamily: 'Georgia, serif',
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 20px rgba(244,240,232,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
              }}
            />
            
            <button
              onClick={initiateMessage}
              disabled={!recipientPhone || recipientPhone.length < 10 || loading}
              style={{
                background: (!recipientPhone || recipientPhone.length < 10 || loading) 
                  ? 'rgba(244,240,232,0.2)' 
                  : '#f4f0e8',
                color: (!recipientPhone || recipientPhone.length < 10 || loading) 
                  ? 'rgba(244,240,232,0.5)' 
                  : '#040404',
                border: 'none',
                padding: '1rem 2.5rem',
                fontSize: '1rem',
                cursor: (!recipientPhone || recipientPhone.length < 10 || loading) 
                  ? 'not-allowed' 
                  : 'pointer',
                fontFamily: 'Georgia, serif',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                marginTop: '1rem'
              }}
            >
              {loading ? 'Generating phrase...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phrase display and speech recognition view
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
        {!feedback.includes('recognized') ? (
          <>
            <p style={{ 
              fontSize: '1rem', 
              opacity: 0.6,
              marginBottom: '1rem'
            }}>
              Your unique phrase:
            </p>
            
            <h1 style={{ 
              fontSize: '3.5rem', 
              marginBottom: '2rem',
              fontWeight: 'normal',
              letterSpacing: '0.05em',
              textShadow: '0 0 30px rgba(244,240,232,0.2)'
            }}>
              {phrase.phrase}
            </h1>
            
            <p style={{ 
              fontSize: '1.1rem', 
              opacity: 0.7,
              marginBottom: '2rem',
              maxWidth: '400px'
            }}>
              Say these words clearly to unlock the recording chamber
            </p>
            
            {/* Listening indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isListening ? '#4ade80' : '#f4f0e8',
                opacity: isListening ? 1 : 0.3,
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }} />
              <span style={{ 
                fontSize: '0.9rem', 
                opacity: isListening ? 0.8 : 0.5 
              }}>
                {isListening ? 'Listening' : 'Waiting for microphone...'}
              </span>
            </div>
            
            {/* Manual listen button */}
            {!isListening && recognitionSupported && (
              <button
                onClick={startListening}
                style={{
                  background: 'transparent',
                  border: '1px solid #f4f0e8',
                  color: '#f4f0e8',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  transition: 'all 0.3s ease',
                  marginBottom: '1rem'
                }}
              >
                Start listening
              </button>
            )}
            
            {/* Heard text display */}
            {spokenText && (
              <p style={{ 
                marginTop: '1rem', 
                fontSize: '0.9rem', 
                opacity: 0.5,
                fontStyle: 'italic'
              }}>
                Heard: "{spokenText}"
              </p>
            )}
            
            {!recognitionSupported && (
              <p style={{
                color: '#ff9999',
                marginTop: '1rem',
                fontSize: '0.9rem'
              }}>
                Speech recognition not available. 
                <button
                  onClick={() => onComplete({ ...messageData, phrase })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f4f0e8',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  Skip for testing
                </button>
              </p>
            )}
          </>
        ) : (
          <div style={{
            animation: 'fadeIn 0.5s ease'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#4ade80'
            }}>
              {feedback}
            </h2>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default PhraseGate;
