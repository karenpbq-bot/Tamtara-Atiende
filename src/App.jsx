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

  // Función corregida para recibir email y password desde Login.jsx
  const manejarLogin = (email, password) => {
    // SIMULACIÓN TEMPORAL: Esto permite pasar al Dashboard.
    // En el siguiente paso reemplazaremos esto con la validación real de Supabase.
    const datosUsuario = { correo: email };
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
        {/* Nombre de la propiedad corregido a "onLogin" */}
        <Login onLogin={manejarLogin} />
      )}
    </div>
  );
}
