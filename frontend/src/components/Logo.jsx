import React from 'react';

export const Logo = () => {
  return (
    <div style={{
      width: '100%',
      height: '60px',
      backgroundColor: '#e3f6f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <img 
          src="https://api.iconify.design/fluent:brain-circuit-24-filled.svg" 
          alt="Logo" 
          style={{
            width: '32px',
            height: '32px',
            color: '#272343',
            // filter: 'invert(1)'
          }}
        />
        <span style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#272343',
          fontFamily: 'Inter, sans-serif'
        }}>
          Bits to Brain
        </span>
      </div>
    </div>
  );
}; 