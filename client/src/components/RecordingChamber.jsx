import React, { useState, useEffect, useRef, useCallback } from 'react';
import BarnAnimation from './BarnAnimation';

// ASCII character set from dark to light
const ASCII_CHARS = ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

function RecordingChamber({ messageData, onComplete, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [typedText, setTypedText] = useState('');
  const [overlays, setOverlays] = useState([]);
  const [asciiFrame, setAsciiFrame] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }, 
          audio: true 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setError('Camera access denied. Please allow camera access to record.');
        onError?.(new Error('Camera access denied'));
      }
    };
    
    initCamera();
    
    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onError]);

  // ASCII conversion function
  const convertToASCII = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== 4) return null;
    
    const ctx = canvas.getContext('2d');
    
    // Low resolution for ASCII effect
    const width = 80;
    const height = Math.floor(width * (video.videoHeight / video.videoWidth));
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);
    
    // Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    
    // Convert to ASCII
    let ascii = '';
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        
        // Calculate brightness (weighted for human perception)
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        
        // Map to ASCII character
        const charIndex = Math.floor(brightness * (ASCII_CHARS.length - 1));
        ascii += ASCII_CHARS[charIndex];
      }
      ascii += '\n';
    }
    
    return ascii;
  }, []);

  // Animation loop for ASCII conversion
  const startASCIILoop = useCallback(() => {
    const loop = () => {
      if (isRecording) {
        const frame = convertToASCII();
        if (frame) {
          setAsciiFrame(frame);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };
    loop();
  }, [isRecording, convertToASCII]);

  useEffect(() => {
    if (isRecording) {
      startASCIILoop();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, startASCIILoop]);

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) {
      onError?.(new Error('Camera not ready'));
      return;
    }
    
    setIsRecording(true);
    setTimeLeft(120);
    chunksRef.current = [];
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setUploading(true);
        
        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          
          // Upload to server
          const messageId = messageData?.phrase?.id || 'test-message';
          const res = await fetch(`/api/messages/${messageId}/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'video/webm'
            },
            body: blob
          });
          
          if (!res.ok) {
            throw new Error('Upload failed');
          }
          
          onComplete();
        } catch (err) {
          console.error('Upload error:', err);
          // Still complete even if upload fails (for testing)
          onComplete();
        } finally {
          setUploading(false);
        }
      };
      
      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        onError?.(new Error('Recording error'));
      };
      
      // Collect data every second
      mediaRecorder.start(1000);
      
      // Focus input for typing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      onError?.(err);
      setIsRecording(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!isRecording || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time's up - stop recording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  // Handle text input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && typedText.trim()) {
      const newOverlay = {
        id: Date.now(),
        text: typedText.trim(),
        createdAt: Date.now(),
        position: {
          bottom: 20 + Math.random() * 30, // Random vertical position
          left: 10 + Math.random() * 20    // Random horizontal start
        }
      };
      
      setOverlays(prev => [...prev, newOverlay]);
      setTypedText('');
      
      // Remove overlay after animation (10 seconds)
      setTimeout(() => {
        setOverlays(prev => prev.filter(o => o.id !== newOverlay.id));
      }, 10000);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Error state
  if (error) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#040404',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f4f0e8'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Camera Error</h2>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#f4f0e8',
            color: '#040404',
            border: 'none',
            padding: '1rem 2rem',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

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
      {isRecording && (
        <pre style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: '1rem',
          fontSize: 'clamp(6px, 1.2vw, 10px)',
          lineHeight: '1em',
          color: '#f4f0e8',
          fontFamily: 'monospace',
          whiteSpace: 'pre',
          overflow: 'hidden',
          background: '#040404',
          opacity: 0.9
        }}>
          {asciiFrame}
        </pre>
      )}
      
      {/* Small barn in corner */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        width: '80px',
        height: '80px',
        zIndex: 50,
        opacity: 0.5
      }}>
        <BarnAnimation variant="classic" size="small" />
      </div>
      
      {/* Text overlays */}
      {overlays.map(overlay => (
        <div
          key={overlay.id}
          style={{
            position: 'absolute',
            bottom: `${overlay.position.bottom}%`,
            left: `${overlay.position.left}%`,
            color: '#f4f0e8',
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            fontFamily: 'Georgia, serif',
            animation: 'slideAcross 10s linear forwards, fadeOut 10s ease-in forwards',
            whiteSpace: 'nowrap',
            textShadow: '0 0 10px rgba(0,0,0,0.8)',
            zIndex: 20,
            pointerEvents: 'none'
          }}
        >
          {overlay.text}
        </div>
      ))}
      
      {/* Timer display */}
      {isRecording && (
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          color: timeLeft < 30 ? '#ff9999' : '#f4f0e8',
          fontSize: '1.5rem',
          fontFamily: 'monospace',
          zIndex: 50,
          background: 'rgba(0,0,0,0.5)',
          padding: '0.5rem 1rem',
          borderRadius: '4px'
        }}>
          {formatTime(timeLeft)}
        </div>
      )}
      
      {/* Recording indicator */}
      {isRecording && (
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 50,
          background: 'rgba(0,0,0,0.5)',
          padding: '0.5rem 1rem',
          borderRadius: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ff4444',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ color: '#f4f0e8', fontSize: '0.9rem' }}>
            REC
          </span>
        </div>
      )}
      
      {/* Text input for overlays */}
      {isRecording && !uploading && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          width: '90%',
          maxWidth: '500px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={e => setTypedText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type and press Enter to overlay text..."
            disabled={uploading}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(244,240,232,0.3)',
              color: '#f4f0e8',
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              fontFamily: 'Georgia, serif',
              borderRadius: '4px',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(244,240,232,0.6)';
              e.target.style.background = 'rgba(0,0,0,0.8)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(244,240,232,0.3)';
              e.target.style.background = 'rgba(0,0,0,0.6)';
            }}
          />
          <p style={{
            color: '#f4f0e8',
            opacity: 0.5,
            fontSize: '0.8rem',
            textAlign: 'center',
            marginTop: '0.5rem'
          }}>
            Press Enter to add text overlay
          </p>
        </div>
      )}
      
      {/* Start recording button */}
      {!isRecording && !uploading && cameraReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 100
        }}>
          <p style={{
            color: '#f4f0e8',
            opacity: 0.8,
            marginBottom: '2rem',
            fontSize: '1.1rem'
          }}>
            The chamber is ready. You have 2 minutes.
          </p>
          
          <button
            onClick={startRecording}
            style={{
              background: '#f4f0e8',
              color: '#040404',
              border: 'none',
              padding: '1.5rem 3rem',
              fontSize: '1.3rem',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ffffff';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f4f0e8';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Enter the chamber
          </button>
        </div>
      )}
      
      {/* Waiting for camera */}
      {!isRecording && !cameraReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#f4f0e8'
        }}>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            Accessing camera...
          </p>
          <div style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(244,240,232,0.2)',
            borderTopColor: '#f4f0e8',
            borderRadius: '50%',
            margin: '1rem auto',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      {/* Uploading state */}
      {uploading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#f4f0e8',
          zIndex: 200,
          background: 'rgba(0,0,0,0.8)',
          padding: '2rem',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Saving your message...
          </p>
          <div style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(244,240,232,0.2)',
            borderTopColor: '#f4f0e8',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      <style>{`
        @keyframes slideAcross {
          from { transform: translateX(0); }
          to { transform: translateX(calc(80vw)); }
        }
        @keyframes fadeOut {
          0%, 80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default RecordingChamber;
