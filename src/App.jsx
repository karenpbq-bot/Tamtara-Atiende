import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import { AdminClientes } from './AdminClientes';
import CartaMenu from './components/CartaMenu';
import TerminalPedidos from './components/TerminalPedidos';
import KardexInventarios from './components/KardexInventarios';
import TrackingKanban from './components/TrackingKanban';
import RecetasCostos from './components/RecetasCostos'; // Módulo de recetas articulado
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
      // 1. Consultar el perfil del usuario en la tabla 'uni_usuarios'
      const { data: perfilData, error: perfilError } = await supabase
        .from('uni_usuarios')
        .select('*')
        .eq('correo', email.trim().toLowerCase())
        .maybeSingle();

      // Si no existe en uni_usuarios pero es el correo de La Exacta o Superadmin, permitimos acceso directo de emergencia
      let rolUsuario = 'admin';
      let nombreUsuario = 'Administrador';
      let idClienteAsociado = 2; // Por defecto asignamos La Exacta (id_cliente = 2)
      let codigo7d = null;

      if (perfilData) {
        if (perfilData.estado === false) {
          alert("Esta cuenta está desactivada.");
          return;
        }

        // Validación de contraseña
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

        rolUsuario = perfilData.rol;
        nombreUsuario = perfilData.nombres_apellidos;
        codigo7d = perfilData.codigo_7d;

        // Buscar el id_cliente real vinculado mediante el código si lo tiene
        if (perfilData.codigo_7d) {
          const { data: clienteData } = await supabase
            .from('uni_clientes')
            .select('id_cliente')
            .eq('codigo_invitacion_5d', perfilData.codigo_7d)
            .maybeSingle();
          
          if (clienteData) {
            idClienteAsociado = clienteData.id_cliente;
          }
        } else if (perfilData.id_cliente) {
          idClienteAsociado = perfilData.id_cliente;
        }
      } else {
        // Fallback operativo para el admin principal si la tabla uni_usuarios tuviera algún desfase
        if (email.toLowerCase() !== 'laexacta2807@gmail.com') {
          throw new Error("Usuario no registrado en la base de datos.");
        }
      }

      // 2. Consolidar la sesión activa con el id_cliente correcto
      const datosCompletos = {
        correo: email,
        rol: rolUsuario, 
        nombre: nombreUsuario,
        codigo_7d: codigo7d,
        id_cliente: idClienteAsociado // ⬅️ Este es el parámetro vital que alimenta las consultas
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
        return <RecetasCostos idCliente={usuarioActual?.id_cliente} />; // ⬅️ Módulo conectado
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
