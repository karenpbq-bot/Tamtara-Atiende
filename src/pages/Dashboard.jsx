import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TerminalPedidos from '../components/TerminalPedidos';
import TrackingKanban from '../components/TrackingKanban';
import CartaMenu from '../components/CartaMenu';

export default function Dashboard({ usuarioData, onCerrarSesion }) {
  // Por defecto iniciamos en el terminal de pedidos o en dashboard según prefieras
  const [moduloActivo, setModuloActivo] = useState('terminal');

  const idCliente = usuarioData?.id_cliente;

  return (
    <div style={estilos.layoutPrincipal}>
      
      {/* MENÚ LATERAL PROFESIONAL */}
      <Sidebar 
        usuarioData={usuarioData} 
        moduloActivo={moduloActivo} 
        setModuloActivo={setModuloActivo} 
        onCerrarSesion={onCerrarSesion} 
      />

      {/* CONTENIDO PRINCIPAL SEGÚN EL MÓDULO SELECCIONADO */}
      <main style={estilos.contenidoPrincipal}>
        {moduloActivo === 'dashboard' && (
          <div style={estilos.vistaBienvenida}>
            <h2>👋 ¡Bienvenido al Panel Operativo, {usuarioData?.nombre || usuarioData?.correo}!</h2>
            <p>Selecciona una opción en el menú lateral para comenzar a operar.</p>
          </div>
        )}

        {moduloActivo === 'terminal' && <TerminalPedidos idCliente={idCliente} />}
        
        {moduloActivo === 'kanban' && <TrackingKanban idCliente={idCliente} usuarioData={usuarioData} />}
        
        {moduloActivo === 'carta' && <CartaMenu idCliente={idCliente} />}
        
        {moduloActivo === 'kardex' && (
          <div style={estilos.placeholderModulo}>
            <h3>📦 Módulo de Kardex e Inventarios</h3>
            <p>Control de stock y movimientos de materia prima en desarrollo.</p>
          </div>
        )}
        
        {moduloActivo === 'recetas' && (
          <div style={estilos.placeholderModulo}>
            <h3>🍳 Módulo de Recetas y Costos</h3>
            <p>Estructura de costos de elaboración y escandallo en desarrollo.</p>
          </div>
        )}
      </main>

    </div>
  );
}

const estilos = {
  layoutPrincipal: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Segoe UI', sans-serif",
    overflow: 'hidden'
  },
  contenidoPrincipal: {
    flex: 1,
    marginLeft: '260px', // Deja espacio exacto para el ancho del Sidebar fijo
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: '#f8fafc'
  },
  vistaBienvenida: {
    padding: '40px',
    textAlign: 'center',
    color: '#334155',
    marginTop: '100px'
  },
  placeholderModulo: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748b',
    marginTop: '50px'
  }
};
