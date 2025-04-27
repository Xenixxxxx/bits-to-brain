import React, { useEffect, useRef, useState } from 'react';
import fog from 'vanta/dist/vanta.fog.min';
import * as THREE from 'three';

export const VantaBackground = () => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    if (!vantaEffect) {
      const effect = fog({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0x516396,
        midtoneColor: 0x1a3959,
        lowlightColor: 0x151e2d,
        baseColor: 0x23262a,
        blurFactor: 0.59,
        speed: 1.20,
        zoom: 1
      });
      setVantaEffect(effect);
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [vantaEffect]);

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
    />
  );
}; 