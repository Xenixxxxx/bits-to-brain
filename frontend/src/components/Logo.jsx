import React from 'react';

export const Logo = () => {
  return (
    <div style={{
      width: '100%',
      height: '60px',
      backgroundColor: 'rgb(61,60,61)',
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
            filter: 'invert(1)'
          }}
        />
        <span style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'rgb(248,234,212)'
        }}>
          Bits to Brain
        </span>
      </div>
    </div>
  );
}; 