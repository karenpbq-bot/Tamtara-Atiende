import React, { useState } from 'react';
import { supabase } from '../clientes';

export default function Login({ onLoginExitoso }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const manejarIngreso = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');

    try {
      // Validamos credenciales en la tabla universal uni_usuarios
      const { data, error } = await supabase
        .from('uni_usuarios')
        .select('*')
        .eq('correo', correo.trim())
        .single();

      if (error || !data) {
        setMensaje('⚠️ Correo no registrado o acceso no autorizado.');
        setCargando(false);
        return;
      }

      if (!data.estado) {
        setMensaje('🚫 Tu cuenta se encuentra suspendida. Contacta al administrador.');
        setCargando(false);
        return;
      }

      if (data.password_hash !== password) {
        setMensaje('❌ Contraseña incorrecta.');
        setCargando(false);
        return;
      }

      // Éxito: Enviamos los datos del usuario (incluyendo su id_cliente) al componente principal
      onLoginExitoso(data);

    } catch (err) {
      setMensaje('🚨 Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.tarjeta}>
        <h2 style={estilos.subtitulo}>Sistema de Gestión y Pedidos</h2>
        <h1 style={estilos.tituloLogo}>Tamtara-Atiende</h1>
        
        <form onSubmit={manejarIngreso} style={estilos.formulario}>
          <div style={estilos.grupoInput}>
            <label style={estilos.etiqueta}>Correo Electrónico</label>
            <input 
              type="email" 
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@restaurante.com"
              style={estilos.input}
              required
            />
          </div>

          <div style={estilos.grupoInput}>
            <label style={estilos.etiqueta}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={estilos.input}
              required
            />
          </div>

          {mensaje && <p style={estilos.mensaje}>{mensaje}</p>}

          <button type="submit" disabled={cargando} style={estilos.boton}>
            {cargando ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

const estilos = {
  contenedor: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#EBF5F7', fontFamily: 'sans-serif', padding: '20px' },
  tarjeta: { backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 168, 159, 0.08)', width: '100%', maxWidth: '420px', textAlign: 'center' },
  subtitulo: { fontSize: '0.95rem', color: '#666666', fontWeight: 'normal', marginBottom: '5px' },
  tituloLogo: { fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 25px 0', background: 'linear-gradient(90deg, #00A89F 0%, #88D84D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  formulario: { display: 'flex', flexDirection: 'column', gap: '15px' },
  grupoInput: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  etiqueta: { fontSize: '0.85rem', marginBottom: '6px', color: '#444444', fontWeight: '500' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #CCCCCC', backgroundColor: '#FAFAFA', color: '#333333', fontSize: '0.95rem', outline: 'none' },
  mensaje: { fontSize: '0.85rem', color: '#D32F2F', fontWeight: '500', margin: '0', padding: '8px', backgroundColor: '#FFEBEE', borderRadius: '4px', textAlign: 'left' },
  boton: { padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #00A89F 0%, #88D84D 100%)', color: '#FFFFFF', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }
};
