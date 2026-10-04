import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import { AdminClientes } from './AdminClientes';
import CartaMenu from './components/CartaMenu';
import TerminalPedidos from './components/TerminalPedidos';
import KardexInventarios from './components/KardexInventarios';
import TrackingKanban from './components/TrackingKanban';
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
      // 1. Consultar directamente el perfil y credenciales en la tabla unificada 'uni_usuarios'
      const { data: perfilData, error: perfilError } = await supabase
        .from('uni_usuarios')
        .select('*')
        .eq('correo', email)
        .single();

      if (perfilError || !perfilData) {
        throw new Error("Usuario no registrado en la base de datos.");
      }

      // 2. Validar si la cuenta está activa
      if (perfilData.estado === false) {
        alert("Esta cuenta está desactivada.");
        return;
      }

      // 3. Validar contraseña según el rol
      if (perfilData.rol === 'superadmin') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (authError) throw authError;
      } else {
        if (perfilData.password_hash !== password) {
          alert('Error al iniciar sesión: Credenciales incorrectas.');
          return;
        }
      }

      // 4. Obtener el id_cliente asociado al código del usuario (si no es superadmin)
      let idClienteAsociado = null;
      if (perfilData.codigo_7d) {
        const { data: clienteData } = await supabase
          .from('uni_clientes')
          .select('id_cliente')
          .eq('codigo_invitacion_5d', perfilData.codigo_7d)
          .single();
        
        if (clienteData) {
          idClienteAsociado = clienteData.id_cliente;
        }
      }

      // 5. Guardar la sesión activa con su respectivo id_cliente y código de aislamiento
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
      alert('Error al iniciar sesión: Credenciales incorrectas o usuario no registrado.');
      console.error(error);
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
        return <h2>Módulo: Recetas y Costos (En construcción)</h2>;
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
