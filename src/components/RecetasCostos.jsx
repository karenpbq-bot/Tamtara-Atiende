import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function RecetasCostos({ idCliente }) {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [recetaActual, setRecetaActual] = useState([]);
  const [insumoIngrediente, setInsumoIngrediente] = useState('');
  const [cantidadReq, setCantidadReq] = useState('');

  useEffect(() => {
    if (idCliente) {
      cargarDatosBase();
    }
  }, [idCliente]);

  const cargarDatosBase = async () => {
    const { data: prodData } = await supabase.from('productos').select('*').eq('id_cliente', idCliente);
    const { data: insData } = await supabase.from('insumos').select('*').eq('id_cliente', idCliente);
    if (prodData) setProductos(prodData);
    if (insData) setInsumos(insData);
  };

  useEffect(() => {
    if (productoSeleccionado) {
      cargarReceta(productoSeleccionado);
    }
  }, [productoSeleccionado]);

  const cargaracionalReceta = async (idProd) => {
    const { data } = await supabase
      .from('recetas')
      .select('id, cantidad_requerida, insumos!id_insumo(nombre, costo_unitario, unidad_medida)')
      .eq('id_producto', idProd)
      .eq('id_cliente', idCliente);
    if (data) setRecetaActual(data);
  };

  const cargarReceta = async (idProd) => {
    await cargaracionalReceta(idProd);
  };

  const agregarIngrediente = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado || !insumoIngrediente || !cantidadReq) return;

    const { error } = await supabase.from('recetas').insert([{
      id_cliente: idCliente,
      id_producto: parseInt(productoSeleccionado),
      id_insumo: parseInt(insumoIngrediente),
      cantidad_requerida: parseFloat(cantidadReq)
    }]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setCantidadReq('');
      cargarReceta(productoSeleccionado);
    }
  };

  return (
    <div style={{ padding: '10px 20px', fontFamily: 'sans-serif' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#111827' }}>⚖️ Constructor de Recetas y Costeos</h3>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px' }}>Asocia insumos a tus platos y calcula los costos de producción.</p>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px', maxWidth: '600px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Seleccione el Producto / Plato:</label>
        <select value={productoSeleccionado} onChange={e => setProductoSeleccionado(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '15px' }}>
          <option value="">-- Seleccione --</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} (S/. {p.precio_venta})</option>
          ))}
        </select>

        {productoSeleccionado && (
          <form onSubmit={agregarIngrediente} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Ingrediente / Insumo</label>
              <select value={insumoIngrediente} onChange={e => setInsumoIngrediente(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="">-- Seleccione Insumo --</option>
                {insumos.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Cantidad</label>
              <input type="number" step="0.001" placeholder="0.00" value={cantidadReq} onChange={e => setCantidadReq(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} required />
            </div>
            <button type="submit" style={{ padding: '9px 16px', background: '#00796B', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Añadir</button>
          </form>
        )}
      </div>

      {productoSeleccionado && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '700px' }}>
          <h4 style={{ marginTop: 0, color: '#111827' }}>Composición de la Receta</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Ingrediente</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Cantidad</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Costo Unit.</th>
              </tr>
            </thead>
            <tbody>
              {recetaActual.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>{r.insumos?.nombre}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>{r.cantidad_requerida} {r.insumos?.unidad_medida}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>S/. {Number(r.insumos?.costo_unitario || 0).toFixed(2)}</td>
                </tr>
              ))}
              {recetaActual.length === 0 && (
                <tr><td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: '#9ca3af' }}>Este plato aún no tiene ingredientes vinculados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
