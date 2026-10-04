import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function TrackingKanban({ idCliente }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (idCliente) cargarPedidos();
  }, [idCliente]);

  const cargarPedidos = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_cliente', idCliente)
      .order('id', { ascending: false });
    if (data) setPedidos(data);
  };

  const avanzarEstado = async (id, estadoActual) => {
    let siguiente = 'Listo';
    if (estadoActual === 'En cocina') siguiente = 'Listo';
    else if (estadoActual === 'Listo') siguiente = 'Entregado';
    else if (estadoActual === 'Entregado') {
      await supabase.from('pedidos').update({ pedido_cerrado: 'Sí' }).eq('id', id);
      cargarPedidos();
      return;
    }

    await supabase.from('pedidos').update({ estado: siguiente }).eq('id', id);
    cargarPedidos();
  };

  const enCocina = pedidos.filter(p => p.estado === 'En cocina' && p.pedido_cerrado !== 'Sí');
  const listos = pedidos.filter(p => p.estado === 'Listo' && p.pedido_cerrado !== 'Sí');
  const entregados = pedidos.filter(p => p.estado === 'Entregado' && p.pedido_cerrado !== 'Sí');

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h3>🔥 Tracking de Comandas (Kanban)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
        
        {/* Columna En Cocina */}
        <div style={colStyle}>
          <h4 style={{ background: '#fffae6', padding: '8px' }}>👨‍🍳 En Cocina ({enCocina.length})</h4>
          {enCocina.map(p => (
            <div key={p.id} style={cardStyle}>
              <strong>{p.codigo_exacta}</strong> - {p.cliente} <br/>
              <small>Destino: {p.destino_entrega}</small><br/>
              <button onClick={() => avanzarEstado(p.id, p.estado)} style={btnAvance}>Avanzar ➡️</button>
            </div>
          ))}
        </div>

        {/* Columna Listo */}
        <div style={colStyle}>
          <h4 style={{ background: '#e6f4ea', padding: '8px' }}>🛎️ Listos ({listos.length})</h4>
          {listos.map(p => (
            <div key={p.id} style={cardStyle}>
              <strong>{p.codigo_exacta}</strong> - {p.cliente} <br/>
              <small>Destino: {p.destino_entrega}</small><br/>
              <button onClick={() => avanzarEstado(p.id, p.estado)} style={btnAvance}>Entregar ➡️</button>
            </div>
          ))}
        </div>

        {/* Columna Entregado */}
        <div style={colStyle}>
          <h4 style={{ background: '#e8f0fe', padding: '8px' }}>🏁 Entregados ({entregados.length})</h4>
          {entregados.map(p => (
            <div key={p.id} style={cardStyle}>
              <strong>{p.codigo_exacta}</strong> - {p.cliente} <br/>
              <small>S/. {p.monto_total?.toFixed(2)}</small><br/>
              <button onClick={() => avanzarEstado(p.id, p.estado)} style={{ ...btnAvance, background: '#d9534f' }}>Archivar 🗄️</button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const colStyle = { background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' };
const cardStyle = { background: '#fff', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #eee', fontSize: '14px' };
const btnAvance = { marginTop: '8px', padding: '4px 8px', background: '#00796B', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };
