import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_empresa: '',
    codigo_invitacion_5d: '', // Ajustado a tu columna real de 7 dígitos/código
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

  const generarCodigo7D = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 7; i++) {
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
      alert('¡Cliente y código de acceso creados con éxito!');
      setNuevoCliente({ nombre_empresa: '', codigo_invitacion_5d: '', tipo_plan: 'Mensual', costo_plan: '', vigencia_plan: '', estado_suscripcion: true });
      fetchClientes();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Panel Master: Gestión de Clientes y Suscripciones</h2>
      <p>Control centralizado de planes, costos, vigencias y códigos de aislamiento.</p>

      <form onSubmit={handleCrearCliente} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'grid', gap: '10px', maxWidth: '600px' }}>
        <h3>Registrar Nuevo Inquilino</h3>
        <input 
          type="text" 
          placeholder="Nombre de la Empresa" 
          value={nuevoCliente.nombre_empresa} 
          onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_empresa: e.target.value })} 
          required 
          style={{ padding: '8px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Código Único (7D)" 
            value={nuevoCliente.codigo_invitacion_5d} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, codigo_invitacion_5d: e.target.value.toUpperCase() })} 
            maxLength={7}
            required 
            style={{ padding: '8px', flex: 1 }}
          />
          <button type="button" onClick={generarCodigo7D} style={{ padding: '8px 12px', background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            Generar
          </button>
        </div>

        <select 
          value={nuevoCliente.tipo_plan} 
          onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_plan: e.target.value })}
          style={{ padding: '8px' }}
        >
          <option value="Mensual">Plan Mensual</option>
          <option value="Semestral">Plan Semestral</option>
          <option value="Anual">Plan Anual</option>
        </select>

        <input 
          type="number" 
          placeholder="Costo del Plan" 
          value={nuevoCliente.costo_plan} 
          onChange={(e) => setNuevoCliente({ ...nuevoCliente, costo_plan: e.target.value })} 
          required 
          style={{ padding: '8px' }}
        />

        <label style={{ fontSize: '14px', color: '#555' }}>Vigencia de la Suscripción:</label>
        <input 
          type="date" 
          value={nuevoCliente.vigencia_plan} 
          onChange={(e) => setNuevoCliente({ ...nuevoCliente, vigencia_plan: e.target.value })} 
          required 
          style={{ padding: '8px' }}
        />

        <button type="submit" style={{ padding: '10px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
          Guardar Cliente
        </button>
      </form>

      <h3>Empresas y Clientes Registrados</h3>
      {loading ? <p>Cargando...</p> : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th>Empresa</th>
              <th>Código</th>
              <th>Plan</th>
              <th>Costo</th>
              <th>Vigencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id_cliente}>
                <td>{c.nombre_empresa}</td>
                <td><strong>{c.codigo_invitacion_5d}</strong></td>
                <td>{c.tipo_plan}</td>
                <td>${c.costo_plan}</td>
                <td>{c.vigencia_plan}</td>
                <td>{c.estado_suscripcion ? '🟢 Activo' : '🔴 Inactivo'}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No hay clientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
