import React from 'react';

export default function QuantToolkit() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src={`${window.location.origin}/quant-toolkit.html`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          flex: 1,
          background: '#0a0a0f',
        }}
        title="Quant Toolkit"
      />
    </div>
  );
}
