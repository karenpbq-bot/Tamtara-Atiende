import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function TerminalPedidos({ idCliente }) {
  const [productos, setProductos] = useState([]);
  const [cliente, setCliente] = useState('');
  const [destino, setDestino] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [tipoEntrega, setTipoEntrega] = useState('Mesa');

  useEffect(() => {
    if (idCliente) cargarProductos();
  }, [idCliente]);

  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('id_cliente', idCliente);
    if (data) setProductos(data);
  };

  const agregarAlCarrito = (prod) => {
    if (!cliente.trim()) {
      alert('⚠️ Por favor ingrese el nombre del cliente primero.');
      return;
    }
    setCarrito([...carrito, { ...prod, cantidad: 1, adicionales: [] }]);
  };

  const confirmarPedido = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío');
    
    const montoTotal = carrito.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);

    const payload = {
      id_cliente: idCliente,
      cliente: cliente.trim().toUpperCase(),
      tipo_entrega: tipoEntrega,
      destino_entrega: destino.trim().toUpperCase(),
      items: carrito,
      metodo_pago: 'Efectivo',
      monto_total: montoTotal,
      estado: 'En cocina',
      pedido_cerrado: 'No',
      codigo_exacta: `PED-${Math.floor(100 + Math.random() * 900)}`
    };

    const { error } = await supabase.from('pedidos').insert([payload]);
    if (!error) {
      alert('🎉 ¡Pedido registrado y enviado a cocina con éxito!');
      setCarrito([]);
      setCliente('');
      setDestino('');
    } else {
      alert('Error al registrar pedido: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h3>🛒 Terminal de Pedidos</h3>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <input type="text" placeholder="Nombre del Cliente" value={cliente} onChange={e => setCliente(e.target.value)} style={inputSt} />
        <select value={tipoEntrega} onChange={e => setTipoEntrega(e.target.value)} style={inputSt}>
          <option value="Mesa">Mesa / Salón</option>
          <option value="Delivery">Delivery / Llevar</option>
        </select>
        <input type="text" placeholder="N° Mesa o Dirección" value={destino} onChange={e => setDestino(e.target.value)} style={inputSt} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <h4>Menú Disponible</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {productos.map(p => (
              <div key={p.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '6px', background: '#fff' }}>
                <h5>{p.nombre}</h5>
                <p>S/. {p.precio_venta.toFixed(2)}</p>
                <button onClick={() => agregarAlCarrito(p)} style={{ background: '#00796B', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Agregar</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>🛍️ Carrito</h4>
          {carrito.length === 0 ? <p>Vacío</p> : (
            <div>
              {carrito.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>{item.nombre} x{item.cantidad}</span>
                  <span>S/. {(item.precio_venta * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <hr />
              <h4>Total: S/. {carrito.reduce((acc, i) => acc + (i.precio_venta * i.cantidad), 0).toFixed(2)}</h4>
              <button onClick={confirmarPedido} style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Confirmar y Enviar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputSt = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 };
