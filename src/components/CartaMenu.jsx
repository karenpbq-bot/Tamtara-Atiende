import React, { useState, useEffect } from 'react';
import { supabase } from '../clientes';

export default function CartaMenu({ idCliente }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  // Estados para el formulario de nuevo producto / edición
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [categoria, setCategoria] = useState('Principal');
  const [codigoCorto, setCodigoCorto] = useState('');

  useEffect(() => {
    if (idCliente) {
      cargarProductos();
    }
  }, [idCliente]);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id_cliente', idCliente)
        .order('id', { ascending: true });

      if (error) throw error;
      if (data) setProductos(data);
    } catch (err) {
      console.error('Error cargando la carta:', err.message);
    } finally {
      setCargando(false);
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setMensaje('');

    try {
      const payload = {
        id_cliente: idCliente,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        precio_venta: Number(precioVenta),
        categoria: categoria,
        codigo_corto: codigoCorto.trim().toUpperCase() || null,
        vigente: true,
        es_combo: false
      };

      const { error } = await supabase.from('productos').insert([payload]);

      if (error) throw error;

      setMensaje('✅ ¡Producto agregado a la carta con éxito!');
      setNombre('');
      setDescripcion('');
      setPrecioVenta('');
      setCodigoCorto('');
      cargarProductos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje('❌ Error al guardar producto: ' + err.message);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <h3 style={estilos.subSubTitulo}>Gestión de Carta y Menú</h3>
      <p style={estilos.textoInstruccion}>Agrega y administra los platos, bebidas y snacks disponibles para tu local.</p>

      {mensaje && <p style={estilos.mensajeFeedback}>{mensaje}</p>}

      <div style={estilos.gridModulo}>
        {/* Formulario de Registro */}
        <form onSubmit={guardarProducto} style={estilos.formulario}>
          <h4 style={estilos.tituloForm}>Nuevo Ítem para la Carta</h4>

          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Nombre del Producto</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej. Burger Clásica"
              style={estilos.input}
              required 
            />
          </div>

          <div style={estilos.filaInputs}>
            <div style={estilos.grupoInput}>
              <label style={estilos.label}>Precio de Venta ($ / S/)</label>
              <input 
                type="number" 
                step="0.01" 
                value={precioVenta} 
                onChange={(e) => setPrecioVenta(e.target.value)} 
                placeholder="24.90"
                style={estilos.input}
                required 
              />
            </div>
            <div style={estilos.grupoInput}>
              <label style={estilos.label}>Categoría</label>
              <select 
                value={categoria} 
                onChange={(e) => setCategoria(e.target.value)}
                style={estilos.input}
              >
                <option value="Principal">Principal</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Adicionales">Adicionales</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
          </div>

          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Código Corto (Opcional)</label>
            <input 
              type="text" 
              value={codigoCorto} 
              onChange={(e) => setCodigoCorto(e.target.value)} 
              placeholder="Ej. B200"
              style={estilos.input}
            />
          </div>

          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Descripción o Ingredientes</label>
            <textarea 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              placeholder="Detalle breve del plato..."
              style={estilos.textarea}
            />
          </div>

          <button type="submit" style={estilos.botonGuardar}>
            💾 Agregar a la Carta
          </button>
        </form>

        {/* Listado de Productos Actuales */}
        <div style={estilos.listaContainer}>
          <h4 style={estilos.tituloForm}>Productos Registrados ({productos.length})</h4>
          
          {cargando ? (
            <p style={estilos.textoVacio}>Cargando productos...</p>
          ) : productos.length === 0 ? (
            <p style={estilos.textoVacio}>Aún no hay productos registrados en tu carta.</p>
          ) : (
            <div style={estilos.gridProductos}>
              {productos.map(p => (
                <div key={p.id} style={estilos.cardProducto}>
                  <div style={estilos.cardHeader}>
                    <span style={estilos.badgeCategoria}>{p.categoria}</span>
                    <span style={estilos.precioProducto}>$ {Number(p.precio_venta).toFixed(2)}</span>
                  </div>
                  <h5 style={estilos.nombreProducto}>{p.nombre}</h5>
                  <p style={estilos.descProducto}>{p.descripcion || 'Sin descripción.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const estilos = {
  contenedor: { fontFamily: 'sans-serif', boxSizing: 'border-box' },
  subSubTitulo: { fontSize: '1.05rem', color: '#333', marginBottom: '4px', fontWeight: 'bold' },
  textoInstruccion: { fontSize: '0.8rem', color: '#666', marginBottom: '15px' },
  mensajeFeedback: { fontSize: '0.8rem', color: '#00796B', backgroundColor: '#E0F2F1', padding: '8px', borderRadius: '6px', textAlign: 'center', marginBottom: '12px', fontWeight: 'bold', border: '1px solid #B2DFDB' },
  gridModulo: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px', alignItems: 'start' },
  formulario: { backgroundColor: '#FFF', padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' },
  tituloForm: { fontSize: '0.9rem', color: '#00796B', marginBottom: '6px', borderBottom: '2px solid #E0F2F1', paddingBottom: '4px' },
  grupoInput: { display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left' },
  label: { fontSize: '0.75rem', fontWeight: 'bold', color: '#475569' },
  input: { padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#FAFAFA', boxSizing: 'border-box', width: '100%' },
  textarea: { padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#FAFAFA', boxSizing: 'border-box', width: '100%', minHeight: '60px', resize: 'vertical' },
  filaInputs: { display: 'flex', gap: '10px' },
  botonGuardar: { padding: '10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #00A89F 0%, #00796B 100%)', color: '#FFF', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' },
  
  listaContainer: { backgroundColor: '#FFF', padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0', minHeight: '300px' },
  textoVacio: { fontSize: '0.8rem', color: '#64748B', textAlign: 'center', padding: '30px' },
  gridProductos: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' },
  cardProducto: { backgroundColor: '#FAFAFA', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  badgeCategoria: { backgroundColor: '#E0F2F1', color: '#00796B', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' },
  precioProducto: { fontSize: '0.85rem', fontWeight: 'bold', color: '#1E293B' },
  nombreProducto: { fontSize: '0.9rem', color: '#0F172A', margin: '0 0 2px 0', fontWeight: 'bold' },
  descProducto: { fontSize: '0.75rem', color: '#64748B', margin: 0 }
};
