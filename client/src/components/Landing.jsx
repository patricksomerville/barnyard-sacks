import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarnAnimation from './BarnAnimation';

function Landing() {
  const navigate = useNavigate();
  const [barn, setBarn] = useState(null);
  const [hoveredOption, setHoveredOption] = useState(null);

  useEffect(() => {
    // Fetch current barn from server
    fetch('/api/barn')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch barn');
        return r.json();
      })
      .then(setBarn)
      .catch(err => {
        console.log('Barn fetch failed, using default:', err);
        setBarn({ id: 'classic' });
      });
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
        gap: '3rem',
        zIndex: 10
      }}>
        {/* Title */}
        <h1 style={{
          color: '#f4f0e8',
          fontSize: '2.5rem',
          fontWeight: 'normal',
          letterSpacing: '0.1em',
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          Barnyard
        </h1>
        
        {/* Send option */}
        <button
          onClick={() => navigate('/send')}
          onMouseEnter={() => setHoveredOption('send')}
          onMouseLeave={() => setHoveredOption(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: hoveredOption === 'send' ? '#ffffff' : '#f4f0e8',
            fontSize: '1.5rem',
            fontFamily: 'Georgia, "Times New Roman", serif',
            cursor: 'pointer',
            padding: '1rem 2rem',
            opacity: hoveredOption === 'send' ? 1 : 0.8,
            transition: 'all 0.3s ease',
            transform: hoveredOption === 'send' ? 'scale(1.02)' : 'scale(1)',
            textShadow: hoveredOption === 'send' ? '0 0 20px rgba(244,240,232,0.3)' : 'none'
          }}
        >
          I want to send a message
        </button>
        
        {/* Receive option */}
        <button
          onClick={() => navigate('/receive')}
          onMouseEnter={() => setHoveredOption('receive')}
          onMouseLeave={() => setHoveredOption(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: hoveredOption === 'receive' ? '#ffffff' : '#f4f0e8',
            fontSize: '1.5rem',
            fontFamily: 'Georgia, "Times New Roman", serif',
            cursor: 'pointer',
            padding: '1rem 2rem',
            opacity: hoveredOption === 'receive' ? 1 : 0.8,
            transition: 'all 0.3s ease',
            transform: hoveredOption === 'receive' ? 'scale(1.02)' : 'scale(1)',
            textShadow: hoveredOption === 'receive' ? '0 0 20px rgba(244,240,232,0.3)' : 'none'
          }}
        >
          Someone sent me a message
        </button>
      </div>
      
      {/* Footer hint */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        color: '#f4f0e8',
        opacity: 0.4,
        fontSize: '0.9rem',
        fontStyle: 'italic'
      }}>
        Speak the words
      </div>
    </div>
  );
}

export default Landing;
