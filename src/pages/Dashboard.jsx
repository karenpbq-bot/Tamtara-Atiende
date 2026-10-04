import React from 'react';

export default function Dashboard({ usuarioData }) {
  return (
    <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h2 style={{ color: '#0f766e', marginTop: 0 }}>
          👋 ¡Bienvenido, {usuarioData?.nombre || usuarioData?.correo || 'Administrador'}!
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.5' }}>
          Selecciona un módulo en el menú lateral izquierdo (Terminal de Pedidos, Tracking Kanban, Carta, etc.) para comenzar a operar de manera rápida y segura.
        </p>
        <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
          <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 'bold' }}>
            🏢 ID de Inquilino Activo: {usuarioData?.id_cliente || 'N/D'}
          </span>
        </div>
      </div>
    </div>
  );
}
