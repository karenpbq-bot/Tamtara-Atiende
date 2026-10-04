import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function KardexInventarios({ idCliente }) {
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState('catalogo');
  
  // Estados para nuevo insumo
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Materia Prima');
  const [unidad, setUnidad] = useState('Unidades');

  // Estados para compras e ingresos
  const [insumoCompra, setInsumoCompra] = useState('');
  const [cantCompra, setCantCompra] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [referencia, setReferencia] = useState('');

  useEffect(() => {
    if (idCliente) {
      cargarDatos();
    }
  }, [idCliente]);

  const cargarDatos = async () => {
    const { data: dataInsumos } = await supabase
      .from('insumos')
      .select('*')
      .eq('id_cliente', idCliente)
      .order('nombre');
    
    const { data: dataMovs } = await supabase
      .from('kardex_movimientos')
      .select('*')
      .eq('id_cliente', idCliente);

    if (dataInsumos) setInsumos(dataInsumos);
    if (dataMovs) setMovimientos(dataMovs);
  };

  const guardarInsumo = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const { error } = await supabase.from('insumos').insert([{
      id_cliente: idCliente,
      nombre: nombre.trim(),
      tipo: tipo,
      unidad_medida: unidad,
      costo_unitario: 0.0,
      stock_actual: 0.0
    }]);

    if (!error) {
      alert('✅ Insumo registrado en el catálogo.');
      setNombre('');
      cargarDatos();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const registrarCompra = async (e) => {
    e.preventDefault();
    if (!insumoCompra || !cantCompra || !costoTotal) return;

    const cantidad = parseFloat(cantCompra);
    const costoT = parseFloat(costoTotal);
    const costoUnitario = cantidad > 0 ? costoT / cantidad : 0;

    const { error } = await supabase.from('kardex_movimientos').insert([{
      id_cliente: idCliente,
      insumo_id: parseInt(insumoCompra),
      tipo_movimiento: 'Ingreso Compra',
      cantidad: cantidad,
      costo_unitario: costoUnitario,
      referencia: referencia.trim() || 'Compra'
    }]);

    if (!error) {
      alert('✅ Ingreso de compra registrado.');
      setCantCompra('');
      setCostoTotal('');
      setReferencia('');
      cargarDatos();
    } else {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h3>📦 Kardex y Control de Inventarios</h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPestanaActiva('catalogo')} style={btnTab(pestanaActiva === 'catalogo')}>📖 Catálogo</button>
        <button onClick={() => setPestanaActiva('ingresos')} style={btnTab(pestanaActiva === 'ingresos')}>📥 Compras</button>
        <button onClick={() => setPestanaActiva('stock')} style={btnTab(pestanaActiva === 'stock')}>📊 Stock Actual</button>
      </div>

      {pestanaActiva === 'catalogo' && (
        <div>
          <form onSubmit={guardarInsumo} style={formStyle}>
            <h4>Registrar Nuevo Insumo / Elaborado</h4>
            <input type="text" placeholder="Nombre del insumo" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} />
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
              <option value="Materia Prima">Materia Prima</option>
              <option value="Elaborado">Elaborado</option>
            </select>
            <select value={unidad} onChange={e => setUnidad(e.target.value)} style={inputStyle}>
              <option value="Unidades">Unidades</option>
              <option value="Kilogramos">Kilogramos</option>
              <option value="Gramos">Gramos</option>
              <option value="Litros">Litros</option>
              <option value="Porcion">Porción</option>
            </select>
            <button type="submit" style={btnSubmit}>Guardar en Catálogo</button>
          </form>

          <h4>Lista de Insumos</h4>
          <ul>
            {insumos.map(i => (
              <li key={i.id}><strong>{i.nombre}</strong> — {i.tipo} ({i.unidad_medida})</li>
            ))}
          </ul>
        </div>
      )}

      {pestanaActiva === 'ingresos' && (
        <form onSubmit={registrarCompra} style={formStyle}>
          <h4>Registrar Compra</h4>
          <select value={insumoCompra} onChange={e => setInsumoCompra(e.target.value)} style={inputStyle} required>
            <option value="">Seleccione Insumo (Materia Prima)</option>
            {insumos.filter(i => i.tipo === 'Materia Prima').map(i => (
              <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>
            ))}
          </select>
          <input type="number" step="0.01" placeholder="Cantidad" value={cantCompra} onChange={e => setCantCompra(e.target.value)} required style={inputStyle} />
          <input type="number" step="0.01" placeholder="Costo Total (S/.)" value={costoTotal} onChange={e => setCostoTotal(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="N° Boleta / Factura" value={referencia} onChange={e => setReferencia(e.target.value)} style={inputStyle} />
          <button type="submit" style={btnSubmit}>Registrar Ingreso</button>
        </form>
      )}

      {pestanaActiva === 'stock' && (
        <div>
          <h4>Stock en Tiempo Real</h4>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f1f1' }}>
                <th>Insumo</th>
                <th>Tipo</th>
                <th>Stock Actual</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map(i => {
                const stock = movimientos.filter(m => m.insumo_id === i.id).reduce((acc, m) => acc + Number(m.cantidad), 0);
                return (
                  <tr key={i.id}>
                    <td>{i.nombre}</td>
                    <td>{i.tipo}</td>
                    <td><strong>{stock.toFixed(2)}</strong></td>
                    <td>{i.unidad_medida}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const btnTab = (active) => ({ padding: '8px 16px', background: active ? '#00796B' : '#e0e0e0', color: active ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' });
const formStyle = { background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' };
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const btnSubmit = { padding: '10px', background: '#00796B', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };
