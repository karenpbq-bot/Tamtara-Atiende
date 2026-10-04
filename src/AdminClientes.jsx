import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de gestión de usuarios del cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [usuariosCliente, setUsuariosCliente] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    correo: '',
    password: '',
    nombres_apellidos: '',
    rol: 'admin'
  });

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_empresa: '',
    nombre_marca: '',
    tipo_especialidad: 'Restaurante / Cafetería',
    codigo_invitacion_5d: '',
    tipo_plan: 'Mensual',
    costo_plan: '',
    vigencia_plan: '',
    estado: true,
    estado_suscripcion: true
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('uni_clientes').select('*');
    if (error) {
      console.error('Error al cargar clientes:', error.message);
    } else {
      setClientes(data || []);
    }
    setLoading(false);
  };

  const generarCodigo5D = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNuevoCliente({ ...nuevoCliente, codigo_invitacion_5d: codigo });
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('uni_clientes').insert([nuevoCliente]);
    if (error) {
      alert('Error al registrar cliente: ' + error.message);
    } else {
      alert('¡Cliente y código de acceso de 5 dígitos creados con éxito!');
      setNuevoCliente({
        nombre_empresa: '',
        nombre_marca: '',
        tipo_especialidad: 'Restaurante / Cafetería',
        codigo_invitacion_5d: '',
        tipo_plan: 'Mensual',
        costo_plan: '',
        vigencia_plan: '',
        estado: true,
        estado_suscripcion: true
      });
      fetchClientes();
    }
  };

  // Cargar los usuarios asociados al código del cliente seleccionado
  const abrirGestionUsuarios = async (cliente) => {
    setClienteSeleccionado(cliente);
    const { data, error } = await supabase
      .from('uni_usuarios')
      .select('*')
      .eq('codigo_7d', cliente.codigo_invitacion_5d);
    
    if (error) {
      console.error('Error al cargar usuarios:', error.message);
      setUsuariosCliente([]);
    } else {
      setUsuariosCliente(data || []);
    }
  };

  const handleCrearUsuarioCliente = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;

    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: nuevoUsuario.correo,
      password: nuevoUsuario.password,
      options: {
        data: {
          nombres_apellidos: nuevoUsuario.nombres_apellidos,
          rol: nuevoUsuario.rol,
          codigo_7d: clienteSeleccionado.codigo_invitacion_5d
        }
      }
    });

    if (authError) {
      alert('Error al registrar credenciales de Auth: ' + authError.message);
      return;
    }

    // 2. Registrar en la tabla uni_usuarios vinculando el código del cliente
    const { error: dbError } = await supabase.from('uni_usuarios').insert([{
      correo: nuevoUsuario.correo,
      nombres_apellidos: nuevoUsuario.nombres_apellidos,
      rol: nuevoUsuario.rol,
      codigo_7d: clienteSeleccionado.codigo_invitacion_5d,
      estado: true,
      password_hash: 'gestionado_por_supabase'
    }]);

    if (dbError) {
      alert('Error al registrar en uni_usuarios: ' + dbError.message);
    } else {
      alert(`¡Usuario ${nuevoUsuario.rol} creado con éxito para ${clienteSeleccionado.nombre_marca}!`);
      setNuevoUsuario({ correo: '', password: '', nombres_apellidos: '', rol: 'admin' });
      abrirGestionUsuarios(clienteSeleccionado); // Recargar lista
    }
  };

  const styles = {
    container: {
      padding: '10px 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#1f2937'
    },
    header: { marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '6px' },
    subtitle: { fontSize: '14px', color: '#6b7280' },
    card: {
      background: '#ffffff',
      padding: '28px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      marginBottom: '36px',
      maxWidth: '750px',
      border: '1px solid #e5e7eb'
    },
    formTitle: { fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' },
    inputGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#4b5563' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb' },
    rowFlex: { display: 'flex', gap: '12px' },
    buttonGen: { padding: '0 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    buttonSubmit: { padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
    buttonAction: { padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    tableContainer: { background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
    th: { background: '#f9fafb', padding: '14px 16px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '14px 16px', borderBottom: '1px solid #f3f4f6', color: '#4b5563' },
    badge: (active) => ({
      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      backgroundColor: active ? '#d1fae5' : '#fee2e2', color: active ? '#065f46' : '#991b1b'
    }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', padding: '30px', borderRadius: '12px', width: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Gestión de Clientes y Suscripciones</h2>
        <p style={styles.subtitle}>Panel maestro para el control de inquilinos, planes, costos y asignación de usuarios administradores.</p>
      </div>

      <div style={styles.card}>
        <div style={styles.formTitle}>Registrar Nuevo Inquilino</div>
        <form onSubmit={handleCrearCliente} style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div style={styles.rowFlex}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Razón Social / Empresa</label>
              <input type="text" placeholder="Ej. Inversiones EIRL" value={nuevoCliente.nombre_empresa} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_empresa: e.target.value })} required style={styles.input} />
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Nombre Comercial / Marca</label>
              <input type="text" placeholder="Ej. La Exacta" value={nuevoCliente.nombre_marca} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_marca: e.target.value })} required style={styles.input} />
            </div>
          </div>

          <div style={styles.rowFlex}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Tipo de Especialidad</label>
              <input type="text" placeholder="Ej. Restaurante / Cafetería" value={nuevoCliente.tipo_especialidad} onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_especialidad: e.target.value })} required style={styles.input} />
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Código Administrador (5D)</label>
              <div style={styles.rowFlex}>
                <input type="text" placeholder="Ej. AB34K" value={nuevoCliente.codigo_invitacion_5d} onChange={(e) => setNuevoCliente({ ...nuevoCliente, codigo_invitacion_5d: e.target.value.toUpperCase() })} maxLength={5} required style={{ ...styles.input, flex: 1, letterSpacing: '2px', fontWeight: 'bold' }} />
                <button type="button" onClick={generarCodigo5D} style={styles.buttonGen}>Generar</button>
              </div>
            </div>
          </div>

          <div style={styles.rowFlex}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Tipo de Plan</label>
              <select value={nuevoCliente.tipo_plan} onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_plan: e.target.value })} style={styles.input}>
                <option value="Mensual">Plan Mensual</option>
                <option value="Semestral">Plan Semestral</option>
                <option value="Anual">Plan Anual</option>
              </select>
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Costo del Plan ($)</label>
              <input type="number" placeholder="0.00" value={nuevoCliente.costo_plan} onChange={(e) => setNuevoCliente({ ...nuevoCliente, costo_plan: e.target.value })} required style={styles.input} />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Vigencia de la Suscripción</label>
            <input type="date" value={nuevoCliente.vigencia_plan} onChange={(e) => setNuevoCliente({ ...nuevoCliente, vigencia_plan: e.target.value })} required style={styles.input} />
          </div>

          <button type="submit" style={styles.buttonSubmit}>Guardar e Iniciar Inquilino</button>
        </form>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Empresas y Clientes Registrados</div>

      <div style={styles.tableContainer}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Cargando registros...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Empresa / Marca</th>
                <th style={styles.th}>Código (5D)</th>
                <th style={styles.th}>Plan & Costo</th>
                <th style={styles.th}>Vigencia</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id_cliente}>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#111827' }}>
                    {c.nombre_marca} <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}><br/>({c.nombre_empresa})</span>
                  </td>
                  <td style={styles.td}><code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#4f46e5' }}>{c.codigo_invitacion_5d}</code></td>
                  <td style={styles.td}>{c.tipo_plan} (${c.costo_plan})</td>
                  <td style={styles.td}>{c.vigencia_plan}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(c.estado_suscripcion)}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.estado_suscripcion ? '#10b981' : '#ef4444' }}></span>
                      {c.estado_suscripcion ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => abrirGestionUsuarios(c)} style={styles.buttonAction}>
                      👥 Usuarios ({c.codigo_invitacion_5d})
                    </button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No hay clientes registrados todavía.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE GESTIÓN DE USUARIOS DEL CLIENTE */}
      {clienteSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>Usuarios para: {clienteSeleccionado.nombre_marca}</h3>
              <button onClick={() => setClienteSeleccionado(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              Código de aislamiento vinculado: <strong>{clienteSeleccionado.codigo_invitacion_5d}</strong>
            </p>

            {/* Formulario para crear usuario */}
            <form onSubmit={handleCrearUsuarioCliente} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>Crear Nuevo Usuario (Admin o Personal)</h4>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombres y Apellidos</label>
                <input type="text" placeholder="Ej. Juan Pérez" value={nuevoUsuario.nombres_apellidos} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombres_apellidos: e.target.value })} required style={styles.input} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input type="email" placeholder="correo@negocio.com" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })} required style={styles.input} />
              </div>

              <div style={styles.rowFlex}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Contraseña Temporal</label>
                  <input type="password" placeholder="******" value={nuevoUsuario.password} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })} required style={styles.input} />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Rol / Tipo de Perfil</label>
                  <select value={nuevoUsuario.rol} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })} style={styles.input}>
                    <option value="admin">Administrador (Total)</option>
                    <option value="caja">Caja / Ventas</option>
                    <option value="cocina">Cocina / Producción</option>
                  </select>
                </div>
              </div>

              <button type="submit" style={{ ...styles.buttonSubmit, width: '100%', marginTop: '5px' }}>Crear Usuario Vinculado</button>
            </form>

            {/* Lista de usuarios creados para este cliente */}
            <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '10px' }}>Usuarios Asignados a este Inquilino</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Correo</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuariosCliente.map((u, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{u.nombres_apellidos}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{u.correo}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{u.rol}</span>
                    </td>
                  </tr>
                ))}
                {usuariosCliente.length === 0 && (
                  <tr><td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: '#9ca3af' }}>No hay usuarios creados para este cliente todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
