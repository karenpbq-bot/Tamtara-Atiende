import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import { AdminClientes } from './AdminClientes';
import CartaMenu from './components/CartaMenu';
import TerminalPedidos from './components/TerminalPedidos';
import KardexInventarios from './components/KardexInventarios';
import TrackingKanban from './components/TrackingKanban';
import RecetasCostos from './components/RecetasCostos';
import { supabase } from './supabase'; 

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargando, setCargando] = useState(true);
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

  const manejarLogin = async (email, password) => {
    try {
      const emailLimpio = email.trim().toLowerCase();

      // 1. ACCESO DIRECTO INMEDIATO PARA LA EXACTA (Evita bloqueos de la tabla)
      if (emailLimpio === 'laexacta2807@gmail.com') {
        const datosCompletos = {
          correo: emailLimpio,
          rol: 'admin',
          nombre: 'Administrador La Exacta',
          codigo_7d: 'EXACT',
          id_cliente: 2 // ⬅️ Forzamos directamente el ID 2 de La Exacta
        };
        setUsuarioActual(datosCompletos);
        localStorage.setItem('atiende_sesion_activa', JSON.stringify(datosCompletos));
        setModuloActivo('dashboard');
        return;
      }

      let perfilData = null;

      // 2. Intentar consultar el usuario en la tabla 'uni_usuarios' para los demás
      const { data } = await supabase
        .from('uni_usuarios')
        .select('*')
        .eq('correo', emailLimpio)
        .maybeSingle();

      perfilData = data;

      if (!perfilData) {
        throw new Error("Usuario no registrado en la base de datos.");
      }

      if (perfilData.estado === false) {
        alert("Esta cuenta está desactivada.");
        return;
      }

      // 3. Validación de contraseña
      if (perfilData.rol === 'superadmin') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (authError) throw authError;
      } else {
        if (perfilData.password_hash && perfilData.password_hash !== password) {
          alert('Error al iniciar sesión: Credenciales incorrectas.');
          return;
        }
      }

      // 4. Determinar el id_cliente asociado
      const idClienteAsociado = (email.toLowerCase().includes('laexacta') || perfilData.rol === 'superadmin') 
        ? 2 
        : (perfilData.id_cliente || 2);

      const datosCompletos = {
        correo: email,
        rol: perfilData.rol, 
        nombre: perfilData.nombres_apellidos,
        codigo_7d: perfilData.codigo_7d,
        id_cliente: idClienteAsociado
      };

      setUsuarioActual(datosCompletos);
      localStorage.setItem('atiende_sesion_activa', JSON.stringify(datosCompletos));
      setModuloActivo('dashboard');

    } catch (error) {
      alert('Error al iniciar sesión: ' + (error.message || 'Credenciales incorrectas.'));
      console.error("Detalle del error en login:", error);
    }
  };

  const manejarCerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuarioActual(null);
    localStorage.removeItem('atiende_sesion_activa');
  };

  const renderizarModulo = () => {
    switch (moduloActivo) {
      case 'dashboard':
        return <Dashboard usuarioData={usuarioActual} />;
      case 'admin_clientes':
        return <AdminClientes />;
      case 'terminal':
        return <TerminalPedidos idCliente={usuarioActual?.id_cliente} />;
      case 'kanban':
        return <TrackingKanban idCliente={usuarioActual?.id_cliente} />;
      case 'carta':
        return <CartaMenu idCliente={usuarioActual?.id_cliente} />;
      case 'kardex':
        return <KardexInventarios idCliente={usuarioActual?.id_cliente} />;
      case 'recetas':
        return <RecetasCostos idCliente={usuarioActual?.id_cliente} />;
      default:
        return <Dashboard usuarioData={usuarioActual} />;
    }
  };

  if (cargando) return null;

  if (!usuarioActual) {
    return <Login onLogin={manejarLogin} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6fb' }}>
      <Sidebar 
        usuarioData={usuarioActual} 
        moduloActivo={moduloActivo} 
        setModuloActivo={setModuloActivo} 
        onCerrarSesion={manejarCerrarSesion} 
      />
      <main style={{ marginLeft: '260px', flex: 1, padding: '30px', overflowY: 'auto' }}>
        {renderizarModulo()}
      </main>
    </div>
  );
}
