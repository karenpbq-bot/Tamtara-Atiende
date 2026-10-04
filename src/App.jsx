import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificamos si hay una sesión activa guardada
    const sesionGuardada = localStorage.getItem('atiende_sesion_activa');
    if (sesionGuardada) {
      try {
        setUsuarioActual(JSON.parse(sesionGuardada));
      } catch (e) {
        localStorage.removeItem('atiende_sesion_activa');
      }
    }
    setCargando(false);
  }, []);

  const manejarLoginExitoso = (datosUsuario) => {
    setUsuarioActual(datosUsuario);
    localStorage.setItem('atiende_sesion_activa', JSON.stringify(datosUsuario));
  };

  const manejarCerrarSesion = () => {
    setUsuarioActual(null);
    localStorage.removeItem('atiende_sesion_activa');
  };

  if (cargando) return null;

  return (
    <div>
      {usuarioActual ? (
        <Dashboard usuarioData={usuarioActual} onCerrarSesion={manejarCerrarSesion} />
      ) : (
        <Login onLoginExitoso={manejarLoginExitoso} />
      )}
    </div>
  );
}
