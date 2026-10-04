import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
// Asegúrate de tener tu archivo de conexión a Supabase creado
import { supabase } from './supabase'; 

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargando, setCargando] = useState(true);
  // Estado para controlar qué módulo del menú lateral se muestra
  const [moduloActivo, setModuloActivo] = useState('dashboard');

  useEffect(() => {
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

  // Iniciar sesión conectándose directamente a tu base de datos Supabase
  const manejarLogin = async (email, password) => {
    try {
      // 1. Validar correo y contraseña en Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Traer los datos del perfil (rol, nombre, empresa) desde uni_usuarios
      const { data: perfilData, error: perfilError } = await supabase
        .from('uni_usuarios')
        .select('rol, nombres_apellidos, codigo_7d, estado')
        .eq('correo', email)
        .single();

      if (perfilError) throw perfilError;

      if (perfilData.estado === false) {
        alert("Esta cuenta está desactivada.");
        await supabase.auth.signOut();
        return;
      }

      // 3. Guardar la sesión
      const datosCompletos = {
        correo: email,
        rol: perfilData.rol, 
        nombre: perfilData.nombres_apellidos,
        codigo_7d: perfilData.codigo_7d
      };

      setUsuarioActual(datosCompletos);
      localStorage.setItem('atiende_sesion_activa', JSON.stringify(datosCompletos));
      setModuloActivo('dashboard'); // Siempre ir al inicio al loguearse

    } catch (error) {
      alert('Error al iniciar sesión: Credenciales incorrectas o usuario no registrado.');
      console.error(error);
    }
  };

  const manejarCerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuarioActual(null);
    localStorage.removeItem('atiende_sesion_activa');
  };

  // Función que decide qué componente renderizar a la derecha
  const renderizarModulo = () => {
    switch (moduloActivo) {
      case 'dashboard':
        return <Dashboard usuarioData={usuarioActual} />;
      case 'terminal':
        return <h2>Módulo: Terminal de Pedidos (En construcción)</h2>;
      case 'kanban':
        return <h2>Módulo: Tracking de Comandas (En construcción)</h2>;
      case 'carta':
        return <h2>Módulo: Carta y Menú (En construcción)</h2>;
      case 'kardex':
        return <h2>Módulo: Kardex e Inventarios (En construcción)</h2>;
      case 'recetas':
        return <h2>Módulo: Recetas y Costos (En construcción)</h2>;
      default:
        return <Dashboard usuarioData={usuarioActual} />;
    }
  };

  if (cargando) return null;

  // Si no hay usuario, mostramos el Login ocupando toda la pantalla
  if (!usuarioActual) {
    return <Login onLogin={manejarLogin} />;
  }

  // Si hay usuario, renderizamos la estructura de Siderbar + Contenido Dinámico
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6fb' }}>
      
      {/* El menú lateral siempre visible a la izquierda */}
      <Sidebar 
        usuarioData={usuarioActual} 
        moduloActivo={moduloActivo} 
        setModuloActivo={setModuloActivo} 
        onCerrarSesion={manejarCerrarSesion} 
      />

      {/* Contenedor principal a la derecha (Margen de 260px para que el Sidebar no lo tape) */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '30px', overflowY: 'auto' }}>
        {renderizarModulo()}
      </main>

    </div>
  );
}
