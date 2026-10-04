import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function TrackingKanban({ idCliente, usuarioData }) {
  const clienteIdFinal = idCliente || usuarioData?.id_cliente;

  const [pestanaActiva, setPestanaActiva] = useState('proceso'); // 'proceso', 'cerrados'
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  useEffect(() => {
    if (clienteIdFinal) {
      cargarPedidos();
    }
  }, [clienteIdFinal]);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      if (!clienteIdFinal) {
        setPedidos([]);
        return;
      }

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id_cliente', Number(clienteIdFinal))
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setPedidos(data);
    } catch (err) {
      console.error('Error cargando pedidos:', err.message);
    } finally {
      setCargando(false);
    }
  };

  // Función general para actualizar estado respetando restricciones de Supabase
  const actualizarEstadoPedido = async (id, nuevoEstado, pedidoCerradoValor = 'No') => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          estado: nuevoEstado, 
          pedido_cerrado: pedidoCerradoValor 
        })
        .eq('id', id)
        .eq('id_cliente', Number(clienteIdFinal));

      if (error) throw error;
      cargarPedidos();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  // Filtrado por buscador inteligente (código, cliente o destino)
  const pedidosFiltrados = pedidos.filter(p => {
    const texto = busqueda.toLowerCase();
    return (
      (p.codigo_exacta && p.codigo_exacta.toLowerCase().includes(texto)) ||
      (p.cliente && p.cliente.toLowerCase().includes(texto)) ||
      (p.destino_entrega && p.destino_entrega.toLowerCase().includes(texto))
    );
  });

  const pedidosEnProceso = pedidosFiltrados.filter(p => p.pedido_cerrado !== 'Sí');
  const pedidosCerrados = pedidosFiltrados.filter(p => p.pedido_cerrado === 'Sí');

  const enCocina = pedidosEnProceso.filter(p => p.estado === 'En cocina' || p.estado === 'Pendiente' || p.estado === 'En Cocina');
  const enBarra = pedidosEnProceso.filter(p => p.estado === 'Listo en barra' || p.estado === 'Listo');
  const enCamino = pedidosEnProceso.filter(p => p.estado === 'En camino' || p.estado === 'En Camino');
  const entregados = pedidosEnProceso.filter(p => p.estado === 'Entregado');

  return (
    <div style={{ padding: '24px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
      
      {/* PESTAÑAS SUPERIORES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => setPestanaActiva('proceso')} 
            style={{ ...tabBtnSt, borderBottom: pestanaActiva === 'proceso' ? '3px solid #0d9488' : '3px solid transparent', color: pestanaActiva === 'proceso' ? '#0d9488' : '#64748b' }}
          >
            🔥 Pedidos en Proceso ({pedidosEnProceso.length})
          </button>
          <button 
            onClick={() => setPestanaActiva('cerrados')} 
            style={{ ...tabBtnSt, borderBottom: pestanaActiva === 'cerrados' ? '3px solid #0d9488' : '3px solid transparent', color: pestanaActiva === 'cerrados' ? '#0d9488' : '#64748b' }}
          >
            📦 Pedidos Cerrados ({pedidosCerrados.length})
          </button>
        </div>
        <button onClick={cargarPedidos} style={{ background: '#e2e8f0', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
          🔄 Actualizar
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA RÁPIDA */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 Filtrar inmediatamente por código, cliente o mesa..." 
          value={busqueda} 
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* KANBAN DE 4 COLUMNAS CON BOTONES BIDIRECCIONALES */}
      {pestanaActiva === 'proceso' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', alignItems: 'start' }}>
          <ColumnaKanban 
            titulo="👨‍🍳 En Cocina" 
            items={enCocina} 
            colorHeader="#f59e0b" 
            onAvanzar={id => actualizarEstadoPedido(id, 'Listo en barra')} 
            onVerDetalle={setPedidoSeleccionado} 
          />
          <ColumnaKanban 
            titulo="🔔 Listo en Barra" 
            items={enBarra} 
            colorHeader="#3b82f6" 
            onRetroceder={id => actualizarEstadoPedido(id, 'En cocina')}
            onAvanzar={id => actualizarEstadoPedido(id, 'En camino')} 
            onVerDetalle={setPedidoSeleccionado} 
          />
          <ColumnaKanban 
            titulo="🛵 En Camino" 
            items={enCamino} 
            colorHeader="#8b5cf6" 
            onRetroceder={id => actualizarEstadoPedido(id, 'Listo en barra')}
            onAvanzar={id => actualizarEstadoPedido(id, 'Entregado')} 
            onVerDetalle={setPedidoSeleccionado} 
          />
          <ColumnaKanban 
            titulo="✅ Entregados" 
            items={entregados} 
            colorHeader="#10b981" 
            onRetroceder={id => actualizarEstadoPedido(id, 'En camino')}
            onCerrar={id => actualizarEstadoPedido(id, 'Entregado', 'Sí')} 
            onVerDetalle={setPedidoSeleccionado} 
          />
        </div>
      )}

      {/* PESTAÑA DE PEDIDOS CERRADOS (CON OPCIÓN DE REACTIVAR/RETROCEDER) */}
      {pestanaActiva === 'cerrados' && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>📦 Historial de Pedidos Cerrados (Haz clic para reactivar o ver detalle)</h4>
          {pedidosCerrados.length === 0 ? <p style={{ color: '#94a3b8' }}>No hay pedidos cerrados registrados.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pedidosCerrados.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div onClick={() => setPedidoSeleccionado(p)} style={{ cursor: 'pointer', flex: 1 }}>
                    <strong>{p.codigo_exacta}</strong> • {p.cliente} ({p.tipo_entrega}) {p.destino_entrega ? `- ${p.destino_entrega}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: 'bold', color: '#0d9488' }}>S/. {Number(p.monto_total).toFixed(2)}</span>
                    <button 
                      onClick={() => actualizarEstadoPedido(p.id, 'Entregado', 'No')}
                      style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      title="Regresar a Pedidos en Proceso"
                    >
                      ⬅️ Reabrir Pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE DETALLE DE VENTA */}
      {pedidoSeleccionado && (
        <div style={modalOverlaySt}>
          <div style={modalContentSt}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>📋 Detalle del Pedido</h3>
              <button onClick={() => setPedidoSeleccionado(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            
            <p><strong>Pedido N°:</strong> {pedidoSeleccionado.codigo_exacta}</p>
            <p><strong>Cliente:</strong> {pedidoSeleccionado.cliente} | <strong>Entrega:</strong> {pedidoSeleccionado.tipo_entrega} {pedidoSeleccionado.destino_entrega ? `(${pedidoSeleccionado.destino_entrega})` : ''}</p>
            <p><strong>Monto Cobrado:</strong> S/. {Number(pedidoSeleccionado.monto_total).toFixed(2)} | <strong>Forma de Pago:</strong> {pedidoSeleccionado.metodo_pago} {pedidoSeleccionado.estado_pago === 'Pendiente' ? '🔴 [PENDIENTE]' : ''}</p>

            <h4 style={{ margin: '15px 0 8px 0', color: '#0f766e' }}>🍔 Productos Consumidos:</h4>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '200px', overflowY: 'auto' }}>
              {pedidoSeleccionado.items && pedidoSeleccionado.items.map((it, idx) => {
                const subAd = (it.adicionales || []).reduce((s, a) => s + a.precio, 0);
                const subTotal = (Number(it.precio_base || it.precio_venta || 0) + subAd) * Number(it.cantidad || 1);
                return (
                  <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>
                    <strong>{it.cantidad}x {it.nombre}</strong> — S/. {subTotal.toFixed(2)}
                    {it.adicionales && it.adicionales.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>└ Adic: {it.adicionales.map(a => a.nombre).join(', ')}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={() => setPedidoSeleccionado(null)} style={{ width: '100%', marginTop: '20px', padding: '10px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function ColumnaKanban({ titulo, items, colorHeader, onRetroceder, onAvanzar, onCerrar, onVerDetalle }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div style={{ backgroundColor: colorHeader, color: '#fff', padding: '10px 14px', fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center' }}>
        {titulo} ({items.length})
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '400px', maxHeight: '550px', overflowY: 'auto' }}>
        {items.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '30px' }}>Sin pedidos</p> : (
          items.map(p => {
            const esPendiente = p.estado_pago === 'Pendiente';
            return (
              <div 
                key={p.id} 
                style={{ 
                  background: '#fff', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  borderLeft: esPendiente ? '5px solid #f97316' : '1px solid #e2e8f0', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div onClick={() => onVerDetalle(p)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{p.codigo_exacta}</strong>
                    <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{p.tipo_entrega}</span>
                  </div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>{p.cliente}</p>
                  {p.destino_entrega && <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: '#64748b' }}>📍 {p.destino_entrega}</p>}
                  
                  <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '4px 6px', borderRadius: '4px', marginBottom: '6px' }}>
                    {p.items && p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                  </div>

                  <p style={{ margin: '0', fontSize: '0.75rem', color: '#0d9488', fontWeight: 'bold' }}>Total: S/. {Number(p.monto_total).toFixed(2)} {esPendiente ? '🔴 [Pendiente]' : ''}</p>
                </div>

                {/* BOTONES BIDIRECCIONALES (RETROCEDER Y AVANZAR) */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  {onRetroceder && (
                    <button onClick={() => onRetroceder(p.id)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }} title="Retroceder estado">
                      ⬅️
                    </button>
                  )}
                  {onAvanzar && (
                    <button onClick={() => onAvanzar(p.id)} style={{ flex: 1, background: '#0d9488', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      Avanzar ➔
                    </button>
                  )}
                  {onCerrar && (
                    <button onClick={() => onCerrar(p.id)} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      Cerrar Venta ✔
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const tabBtnSt = { background: 'none', border: 'none', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' };
const modalOverlaySt = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
const modalContentSt = { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '480px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
