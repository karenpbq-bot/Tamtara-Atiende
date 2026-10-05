import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function TerminalPedidos({ idCliente }) {
  const [productos, setProductos] = useState([]);
  const [cliente, setCliente] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('Mesa / Salón');
  const [destino, setDestino] = useState('');
  const [telefono, setTelefono] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [pasoPedido, setPasoPedido] = useState(1);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Estados para recuperar/editar pedidos
  const [pedidoEditandoId, setPedidoEditandoId] = useState(null);
  const [codigoExistente, setCodigoExistente] = useState(null);
  const [mostrarModalPendientes, setMostrarModalPendientes] = useState(false);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);

  // Estados de control para desplegar adicionales por producto
  const [mostrarAdGratis, setMostrarAdGratis] = useState({});
  const [mostrarAdPorcion, setMostrarAdPorcion] = useState({});
  const [adicionalesTemp, setAdicionalesTemp] = useState({});

  // Estados de pago (Paso 2)
  const [esCortesia, setEsCortesia] = useState(false);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [numOperacion, setNumOperacion] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');

  useEffect(() => {
    if (idCliente) {
      cargarProductos();
      
      // Auto-cargar pedido si venimos redirigidos desde el Kanban
      const pedidoGuardado = localStorage.getItem('pedidoAEditar');
      if (pedidoGuardado) {
        const pedido = JSON.parse(pedidoGuardado);
        setPedidoEditandoId(pedido.id);
        setCodigoExistente(pedido.codigo_exacta);
        setCliente(pedido.cliente || '');
        setCarrito(pedido.items || []);
        
        const esDelivery = pedido.tipo_entrega?.toLowerCase().includes('delivery');
        setTipoEntrega(esDelivery ? 'Delivery / Llevar' : 'Mesa / Salón');
        setDestino(pedido.destino_entrega || '');
        setTelefono(pedido.telefono_contacto || '');
        setPasoPedido(1);
        
        // Limpiamos la memoria tras cargarlo
        localStorage.removeItem('pedidoAEditar');
      }
    }
  }, [idCliente]);

  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('id_cliente', idCliente);
    if (data) setProductos(data);
  };

  // ==========================================
  // FUNCIONES DE RECUPERACIÓN Y EDICIÓN
  // ==========================================
  const cargarPedidosPendientes = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('id, codigo_exacta, cliente, items, tipo_entrega, destino_entrega, telefono_contacto')
      .eq('id_cliente', Number(idCliente))
      .eq('estado_pago', 'Pendiente')
      .eq('pedido_cerrado', 'No')
      .order('id', { ascending: false });
    
    if (data) {
      setPedidosPendientes(data);
      setMostrarModalPendientes(true);
    }
  };

  const seleccionarPedidoParaEditar = (pedido) => {
    setPedidoEditandoId(pedido.id);
    setCodigoExistente(pedido.codigo_exacta);
    setCliente(pedido.cliente || '');
    setCarrito(pedido.items || []);
    
    const esDelivery = pedido.tipo_entrega?.toLowerCase().includes('delivery');
    setTipoEntrega(esDelivery ? 'Delivery / Llevar' : 'Mesa / Salón');
    setDestino(pedido.destino_entrega || '');
    setTelefono(pedido.telefono_contacto || '');
    
    setPasoPedido(1);
    setMostrarModalPendientes(false);
  };

  const limpiarTerminal = () => {
    setCarrito([]);
    setCliente('');
    setDestino('');
    setTelefono('');
    setNumOperacion('');
    setMontoRecibido('');
    setEsCortesia(false);
    setPasoPedido(1);
    setPedidoEditandoId(null);
    setCodigoExistente(null);
  };

  // ==========================================
  // MANEJO DE CARRITO
  // ==========================================
  const manejarAdicionalChange = (prodId, comp, precio) => {
    setAdicionalesTemp(prev => {
      const current = prev[prodId] || [];
      const exists = current.some(item => item.nombre === comp);
      if (exists) {
        return { ...prev, [prodId]: current.filter(item => item.nombre !== comp) };
      } else {
        return { ...prev, [prodId]: [...current, { nombre: comp, precio: Number(precio) }] };
      }
    });
  };

  const agregarAlCarrito = (p, adicionalesSeleccionados, cantidad) => {
    if (!cliente.trim()) {
      alert('⚠️ Por favor ingrese el nombre del cliente primero.');
      return;
    }

    const nuevoItem = {
      id_producto: p.id,
      nombre: p.nombre,
      codigo: p.codigo_corto || p.nombre.substring(0, 3).toUpperCase(),
      precio_base: Number(p.precio_venta),
      cantidad: Number(cantidad),
      adicionales: adicionalesSeleccionados || []
    };

    setCarrito([...carrito, nuevoItem]);
    setAdicionalesTemp(prev => ({ ...prev, [p.id]: [] }));
  };

  const calcularTotal = () => {
    return carrito.reduce((acc, item) => {
      const pAd = item.adicionales.reduce((sum, a) => sum + a.precio, 0);
      return acc + (item.precio_base + pAd) * item.cantidad;
    }, 0);
  };

  // ==========================================
  // ENVÍO DE DATOS
  // ==========================================
  const confirmarCobroYEmitir = async (estadoPago, estadoCocina) => {
    if (carrito.length === 0) return alert('El carrito está vacío');
    if (!esCortesia && ['Yape / Plin', 'Tarjeta'].includes(metodoPago) && !numOperacion.trim()) {
      alert('⚠️ Ingrese el número de operación bancaria.');
      return;
    }

    const totalCalculado = calcularTotal();
    const montoRec = montoRecibido === '' ? totalCalculado : Number(montoRecibido);
    const vueltoCalc = metodoPago === 'Efectivo' && !esCortesia ? Math.max(0, montoRec - totalCalculado) : 0.0;
    
    // Si estamos editando, mantenemos el código, si no, creamos uno nuevo.
    const codigoTicket = pedidoEditandoId ? codigoExistente : `PED-${Math.floor(100 + Math.random() * 900)}`;
    const tipoEntregaNormalizado = tipoEntrega.includes('Delivery') ? 'Delivery' : 'Mesa';

    // 🕒 SOLUCIÓN AL DESFASE DE FECHA: Forzamos la hora exacta de Perú en formato ISO
    // toLocaleString con sv-SE devuelve "YYYY-MM-DD HH:mm:ss". Reemplazamos el espacio por 'T' para que sea un Timestamp válido
    const fechaPeruISO = new Date().toLocaleString("sv-SE", { timeZone: "America/Lima" }).replace(" ", "T");

    const payload = {
      id_cliente: idCliente,
      cliente: cliente.trim().toUpperCase(),
      tipo_entrega: tipoEntregaNormalizado,
      destino_entrega: destino.trim().toUpperCase(),
      telefono_contacto: telefono.trim(),
      items: carrito,
      metodo_pago: esCortesia ? 'Cortesía' : metodoPago,
      monto_total: totalCalculado,
      num_operacion: numOperacion || null,
      monto_recibido: montoRec,
      vuelto: vueltoCalc,
      estado: estadoCocina,
      estado_pago: estadoPago,
      pedido_cerrado: 'No',
      cortesia: esCortesia ? 'Sí' : 'No',
      codigo_exacta: codigoTicket
    };

    if (pedidoEditandoId) {
      // ✏️ ACTUALIZAR EL PEDIDO EXISTENTE
      const { error } = await supabase.from('pedidos').update(payload).eq('id', pedidoEditandoId);
      if (!error) {
        alert(estadoPago === 'Pagado' ? '🎉 ¡Pedido actualizado y cobrado con éxito!' : '🚀 Pedido actualizado (sigue pendiente).');
        limpiarTerminal();
      } else {
        alert('Error al actualizar pedido: ' + error.message);
      }
    } else {
      // ➕ CREAR PEDIDO NUEVO (Incluimos la fecha de Perú generada arriba)
      payload.created_at = fechaPeruISO;
      const { error } = await supabase.from('pedidos').insert([payload]);
      if (!error) {
        alert(estadoPago === 'Pagado' ? '🎉 ¡Pedido registrado y cobrado con éxito!' : '🚀 Pedido enviado a cocina con cuenta pendiente.');
        limpiarTerminal();
      } else {
        alert('Error al registrar pedido: ' + error.message);
      }
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.vigente !== false && 
    (p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) || 
     (p.codigo_corto && p.codigo_corto.toLowerCase().includes(filtroBusqueda.toLowerCase())))
  );

  const principales = productosFiltrados.filter(p => ['Principal', 'Hamburguesas'].includes(p.categoria));
  const bebidas = productosFiltrados.filter(p => p.categoria === 'Bebidas');
  const adGratis = productos.filter(p => p.categoria === 'Ad Gratis');
  const adPorcion = productos.filter(p => p.categoria === 'Ad Porción');

  return (
    <div style={{ padding: '24px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* CABECERA Y BOTÓN DE RECUPERAR PEDIDO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#1e293b', fontWeight: 'bold' }}>🛒 Terminal de Pedidos</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Caja rápida, selección de adicionales y control de cobros.</p>
        </div>
        <button onClick={cargarPedidosPendientes} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(245,158,11,0.2)' }}>
          📝 Recuperar Pedido Pendiente
        </button>
      </div>
      
      {/* AVISO DE EDICIÓN ACTIVA */}
      {pedidoEditandoId && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>⚠️ Estás editando el pedido {codigoExistente}. Los cambios actualizarán el registro existente.</span>
          <button onClick={limpiarTerminal} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>✕ Cancelar Edición</button>
        </div>
      )}

      {/* IDENTIFICACIÓN Y TIPO DE ENTREGA DINÁMICO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr', gap: '12px', marginBottom: '20px', background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div>
          <label style={labelSt}>👤 Nombre del Cliente:</label>
          <input type="text" placeholder="Ej: Juan Pérez" value={cliente} onChange={e => setCliente(e.target.value)} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>📦 Tipo de Entrega:</label>
          <select value={tipoEntrega} onChange={e => setTipoEntrega(e.target.value)} style={inputSt}>
            <option value="Mesa / Salón">Mesa / Salón</option>
            <option value="Delivery / Llevar">Delivery / Llevar</option>
          </select>
        </div>
        {tipoEntrega === 'Mesa / Salón' ? (
          <div>
            <label style={labelSt}>N° Mesa:</label>
            <input type="text" placeholder="Ej: Mesa 4" value={destino} onChange={e => setDestino(e.target.value)} style={inputSt} />
          </div>
        ) : (
          <>
            <div>
              <label style={labelSt}>Dirección / Referencia:</label>
              <input type="text" placeholder="Ej: Av. Principal 123" value={destino} onChange={e => setDestino(e.target.value)} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Teléfono de Contacto:</label>
              <input type="text" placeholder="Ej: 999888777" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputSt} />
            </div>
          </>
        )}
        <div>
          <label style={labelSt}>🔍 Buscar Producto:</label>
          <input type="text" placeholder="Escribe para buscar..." value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)} style={{ ...inputSt, borderColor: '#0d9488', backgroundColor: '#f0fdfa' }} />
        </div>
      </div>

      {pasoPedido === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
          
          {/* LISTADO VERTICAL DE PRODUCTOS */}
          <div>
            <h4 style={{ color: '#0f766e', fontSize: '1.1rem', marginBottom: '12px', borderBottom: '2px solid #ccfbf1', paddingBottom: '6px' }}>🍔 Carta y Menú Disponible</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...principales, ...bebidas].map(p => {
                const seleccionadosProd = adicionalesTemp[p.id] || [];
                const verGratis = mostrarAdGratis[p.id] || false;
                const verPorcion = mostrarAdPorcion[p.id] || false;

                return (
                  <div key={p.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <h5 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', color: '#1e293b' }}>{p.nombre}</h5>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{p.descripcion || 'Sin descripción.'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0d9488', display: 'block' }}>S/. {Number(p.precio_venta).toFixed(2)}</span>
                        {p.codigo_corto && <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: '#475569' }}>{p.codigo_corto}</code>}
                      </div>
                    </div>

                    {/* BOTONES DESPLEGABLES DE ADICIONALES */}
                    {p.categoria === 'Principal' && (
                      <div style={{ margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {adGratis.length > 0 && (
                            <button onClick={() => setMostrarAdGratis({...mostrarAdGratis, [p.id]: !verGratis})} style={btnToggleSt}>
                              {verGratis ? '▲ Ocultar Adicionales Gratis' : '➕ Adicionales Gratis'}
                            </button>
                          )}
                          {adPorcion.length > 0 && (
                            <button onClick={() => setMostrarAdPorcion({...mostrarAdPorcion, [p.id]: !verPorcion})} style={btnToggleSt}>
                              {verPorcion ? '▲ Ocultar Porciones Extra' : '➕ Porciones Extra'}
                            </button>
                          )}
                        </div>

                        {verGratis && (
                          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {adGratis.map(ag => (
                              <label key={ag.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#334155' }}>
                                <input type="checkbox" onChange={() => manejarAdicionalChange(p.id, ag.nombre, 0)} /> {ag.nombre}
                              </label>
                            ))}
                          </div>
                        )}

                        {verPorcion && (
                          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {adPorcion.map(ap => (
                              <label key={ap.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#334155' }}>
                                <input type="checkbox" onChange={() => manejarAdicionalChange(p.id, ap.nombre, ap.precio_venta)} /> {ap.nombre} (+S/. {Number(ap.precio_venta).toFixed(2)})
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <input type="number" min="1" max="10" defaultValue={1} id={`cant-${p.id}`} style={{ width: '55px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '0.9rem' }} />
                      <button onClick={() => {
                        const inputCant = document.getElementById(`cant-${p.id}`);
                        const cantidad = inputCant ? parseInt(inputCant.value) || 1 : 1;
                        agregarAlCarrito(p, seleccionadosProd, cantidad);
                      }} style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                        🛒 Agregar al Pedido
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RESUMEN DEL CARRITO */}
          <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', height: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>🛍️ Resumen del Pedido</h4>
            {carrito.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>El carrito está vacío.</p> : (
              <div>
                {carrito.map((item, idx) => {
                  const subAd = item.adicionales.reduce((sum, a) => sum + a.precio, 0);
                  const subTotal = (item.precio_base + subAd) * item.cantidad;
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <div>
                        <strong style={{ color: '#334155' }}>{item.cantidad}x {item.nombre}</strong>
                        {item.adicionales.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>└ {item.adicionales.map(a => a.nombre).join(', ')}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#0f766e' }}>S/. {subTotal.toFixed(2)}</span>
                        <button onClick={() => setCarrito(carrito.filter((_, i) => i !== idx))} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#475569' }}>Total a Pagar:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0d9488' }}>S/. {calcularTotal().toFixed(2)}</span>
                </div>
                <button onClick={() => setPasoPedido(2)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                  💳 Ir al Cierre de Caja
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {pasoPedido === 2 && (
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '700px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b' }}>💳 Cierre y Validación del Pago</h4>
          <button onClick={() => setPasoPedido(1)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px', fontWeight: '600', fontSize: '0.85rem' }}>
            ⬅️ Volver al Catálogo
          </button>

          <div style={{ marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#334155' }}>
              <input type="checkbox" checked={esCortesia} onChange={e => setEsCortesia(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0d9488' }} />
              🎁 Marcar como Cortesía (Liberado de Pago)
            </label>
          </div>

          {!esCortesia && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#334155' }}>Forma de Pago Registrada:</label>
              <div style={{ display: 'flex', gap: '25px' }}>
                {['Efectivo', 'Yape / Plin', 'Tarjeta'].map(met => (
                  <label key={met} style={{ cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <input type="radio" name="metodoPago" value={met} checked={metodoPago === met} onChange={e => setMetodoPago(e.target.value)} style={{ accentColor: '#0d9488' }} /> {met}
                  </label>
                ))}
              </div>
            </div>
          )}

          {!esCortesia && ['Yape / Plin', 'Tarjeta'].includes(metodoPago) && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px', color: '#334155' }}>N° de Operación (Bancaria):</label>
              <input type="text" placeholder="Ej: 982731" value={numOperacion} onChange={e => setNumOperacion(e.target.value)} style={inputSt} required />
            </div>
          )}

          {!esCortesia && metodoPago === 'Efectivo' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px', color: '#334155' }}>Monto en Efectivo Recibido:</label>
              <input type="number" step="0.50" placeholder={calcularTotal().toFixed(2)} value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} style={inputSt} />
              <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f766e' }}>
                  💵 Vuelto Exacto: S/. {Math.max(0, (Number(montoRecibido) || calcularTotal()) - calcularTotal()).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div style={{ background: '#f1f5f9', padding: '18px', borderRadius: '8px', margin: '20px 0', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 6px 0', color: '#475569' }}><strong>Cliente:</strong> {cliente}</p>
            <p style={{ margin: '0 0 6px 0', color: '#475569' }}><strong>Destino:</strong> {destino || 'No indicado'} {telefono ? `| Tel: ${telefono}` : ''}</p>
            <h3 style={{ margin: '10px 0 0 0', color: '#0d9488', fontSize: '1.4rem' }}>Total a Pagar: S/. {calcularTotal().toFixed(2)}</h3>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => confirmarCobroYEmitir('Pagado', 'En cocina')} style={{ flex: 1, padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
              {pedidoEditandoId ? '🔥 Guardar Edición y Cobrar' : '🔥 Confirmar Cobro y Enviar'}
            </button>
            <button onClick={() => confirmarCobroYEmitir('Pendiente', 'En cocina')} style={{ flex: 1, padding: '14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
              {pedidoEditandoId ? '⚡ Guardar Edición (Pendiente)' : '⚡ Enviar a Cocina (Pendiente)'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PEDIDOS PENDIENTES */}
      {mostrarModalPendientes && (
        <div style={modalOverlaySt}>
          <div style={modalContentSt}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Seleccionar Pedido Pendiente</h3>
            {pedidosPendientes.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No hay pedidos pendientes de pago en este momento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                {pedidosPendientes.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                    <div>
                      <strong style={{ color: '#0f766e', fontSize: '0.95rem' }}>{p.codigo_exacta}</strong> - <span style={{fontWeight: 'bold', color: '#334155'}}>{p.cliente}</span><br/>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.items?.length || 0} producto(s) | {p.tipo_entrega} {p.destino_entrega ? `(${p.destino_entrega})` : ''}</span>
                    </div>
                    <button onClick={() => seleccionarPedidoParaEditar(p)} style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setMostrarModalPendientes(false)} style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const labelSt = { fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#475569' };
const inputSt = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.9rem', backgroundColor: '#f8fafc', outline: 'none' };
const btnToggleSt = { background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f766e', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' };
const modalOverlaySt = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
const modalContentSt = { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '450px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
