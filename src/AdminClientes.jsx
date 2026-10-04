import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_empresa: '',
    codigo_invitacion_5d: '',
    tipo_plan: 'Mensual',
    costo_plan: '',
    vigencia_plan: '',
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
      setNuevoCliente({ nombre_empresa: '', codigo_invitacion_5d: '', tipo_plan: 'Mensual', costo_plan: '', vigencia_plan: '', estado_suscripcion: true });
      fetchClientes();
    }
  };

  const styles = {
    container: {
      padding: '10px 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#1f2937'
    },
    header: {
      marginBottom: '24px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '6px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280'
    },
    card: {
      background: '#ffffff',
      padding: '28px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      marginBottom: '36px',
      maxWidth: '650px',
      border: '1px solid #e5e7eb'
    },
    formTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '16px'
    },
    inputGroup: {
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#4b5563'
    },
    input: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: '#f9fafb'
    },
    rowFlex: {
      display: 'flex',
      gap: '10px'
    },
    buttonGen: {
      padding: '0 16px',
      background: '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    buttonSubmit: {
      padding: '12px',
      background: '#10b981',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'background 0.2s'
    },
    tableContainer: {
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: '14px'
    },
    th: {
      background: '#f9fafb',
      padding: '14px 16px',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e5e7eb'
    },
    td: {
      padding: '14px 16px',
      borderBottom: '1px solid #f3f4f6',
      color: '#4b5563'
    },
    badge: (active) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: active ? '#d1fae5' : '#fee2e2',
      color: active ? '#065f46' : '#991b1b'
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Gestión de Clientes y Suscripciones</h2>
        <p style={styles.subtitle}>Panel maestro para el control de inquilinos, planes, costos y códigos de acceso (5D).</p>
      </div>

      <div style={styles.card}>
        <div style={styles.formTitle}>Registrar Nuevo Inquilino</div>
        <form onSubmit={handleCrearCliente} style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre de la Empresa o Negocio</label>
            <input 
              type="text" 
              placeholder="Ej. Restaurante La Exacta" 
              value={nuevoCliente.nombre_empresa} 
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_empresa: e.target.value })} 
              required 
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Código Único de Administrador (5 Dígitos)</label>
            <div style={styles.rowFlex}>
              <input 
                type="text" 
                placeholder="Ej. AB34K" 
                value={nuevoCliente.codigo_invitacion_5d} 
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, codigo_invitacion_5d: e.target.value.toUpperCase() })} 
                maxLength={5}
                required 
                style={{ ...styles.input, flex: 1, letterSpacing: '2px', fontWeight: 'bold' }}
              />
              <button type="button" onClick={generarCodigo5D} style={styles.buttonGen}>
                Generar 5D
              </button>
            </div>
          </div>

          <div style={styles.rowFlex}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Tipo de Plan</label>
              <select 
                value={nuevoCliente.tipo_plan} 
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_plan: e.target.value })}
                style={styles.input}
              >
                <option value="Mensual">Plan Mensual</option>
                <option value="Semestral">Plan Semestral</option>
                <option value="Anual">Plan Anual</option>
              </select>
            </div>

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Costo del Plan ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={nuevoCliente.costo_plan} 
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, costo_plan: e.target.value })} 
                required 
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Vigencia de la Suscripción</label>
            <input 
              type="date" 
              value={nuevoCliente.vigencia_plan} 
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, vigencia_plan: e.target.value })} 
              required 
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.buttonSubmit}>
            Guardar e Iniciar Inquilino
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
        Empresas y Clientes Registrados
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Cargando registros...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Empresa</th>
                <th style={styles.th}>Código (5D)</th>
                <th style={styles.th}>Plan</th>
                <th style={styles.th}>Costo</th>
                <th style={styles.th}>Vigencia</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id_cliente}>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#111827' }}>{c.nombre_empresa}</td>
                  <td style={styles.td}><code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#4f46e5' }}>{c.codigo_invitacion_5d}</code></td>
                  <td style={styles.td}>{c.tipo_plan}</td>
                  <td style={styles.td}>${c.costo_plan}</td>
                  <td style={styles.td}>{c.vigencia_plan}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(c.estado_suscripcion)}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.estado_suscripcion ? '#10b981' : '#ef4444' }}></span>
                      {c.estado_suscripcion ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                    No hay clientes registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
