import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function KardexInventarios({ idCliente }) {
  const [insumos, setInsumos] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState('catalogo');
  
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Materia Prima');
  const [unidad, setUnidad] = useState('Unidades');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [stockActual, setStockActual] = useState('');

  useEffect(() => {
    if (idCliente) {
      cargarInsumos();
    }
  }, [idCliente]);

  const cargarInsumos = async () => {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('id_cliente', idCliente)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error cargando insumos:', error.message);
    } else {
      setInsumos(data || []);
    }
  };

  const guardarInsumo = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const { error } = await supabase.from('insumos').insert([{
      id_cliente: idCliente,
      nombre: nombre.trim(),
      tipo: tipo,
      unidad_medida: unidad,
      costo_unitario: Number(costoUnitario) || 0.0,
      stock_actual: Number(stockActual) || 0.0
    }]);

    if (error) {
      alert('Error al guardar insumo: ' + error.message);
    } else {
      alert('✅ Insumo guardado con éxito.');
      setNombre('');
      setCostoUnitario('');
      setStockActual('');
      cargarInsumos();
    }
  };

  return (
    <div style={{ padding: '10px 20px', fontFamily: 'sans-serif' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#111827' }}>📦 Kardex y Control de Inventarios</h3>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px' }}>Gestión de materia prima, insumos elaborados y niveles de stock.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPestanaActiva('catalogo')} style={btnTab(pestanaActiva === 'catalogo')}>📖 Catálogo de Insumos</button>
        <button onClick={() => setPestanaActiva('stock')} style={btnTab(pestanaActiva === 'stock')}>📊 Stock Actual</button>
      </div>

      {pestanaActiva === 'catalogo' && (
        <div>
          <form onSubmit={guardarInsumo} style={formStyle}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#00796B' }}>Registrar Nuevo Insumo</h4>
            <input type="text" placeholder="Nombre del insumo" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="Materia Prima">Materia Prima</option>
                <option value="Elaborado">Elaborado</option>
              </select>
              <select value={unidad} onChange={e => setUnidad(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="Unidades">Unidades</option>
                <option value="Kilogramos">Kilogramos</option>
                <option value="Gramos">Gramos</option>
                <option value="Litros">Litros</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" step="0.01" placeholder="Costo Unitario" value={costoUnitario} onChange={e => setCostoUnitario(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input type="number" step="0.01" placeholder="Stock Inicial" value={stockActual} onChange={e => setStockActual(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <button type="submit" style={btnSubmit}>Guardar Insumo</button>
          </form>

          <h4 style={{ fontSize: '1rem', color: '#111827', marginTop: '20px' }}>Insumos Registrados ({insumos.length})</h4>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Unidad</th>
                  <th style={thStyle}>Costo Unit.</th>
                  <th style={thStyle}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map(i => (
                  <tr key={i.id}>
                    <td style={tdStyle}><strong>{i.nombre}</strong></td>
                    <td style={tdStyle}>{i.tipo}</td>
                    <td style={tdStyle}>{i.unidad_medida}</td>
                    <td style={tdStyle}>S/. {Number(i.costo_unitario || 0).toFixed(2)}</td>
                    <td style={tdStyle}>{Number(i.stock_actual || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {insumos.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No hay insumos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestanaActiva === 'stock' && (
        <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h4>Niveles de Inventario</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={thStyle}>Insumo / Producto</th>
                <th style={thStyle}>Clasificación</th>
                <th style={thStyle}>Stock Actual</th>
                <th style={thStyle}>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map(i => (
                <tr key={i.id}>
                  <td style={tdStyle}>{i.nombre}</td>
                  <td style={tdStyle}>{i.tipo}</td>
                  <td style={tdStyle}><strong>{Number(i.stock_actual || 0).toFixed(2)}</strong></td>
                  <td style={tdStyle}>{i.unidad_medida}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const btnTab = (active) => ({ padding: '8px 16px', background: active ? '#00796B' : '#e0e0e0', color: active ? '#fff' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' });
const formStyle = { background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' };
const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' };
const btnSubmit = { padding: '10px', background: '#00796B', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const thStyle = { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: '600' };
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f3f4f6', color: '#4b5563' };
