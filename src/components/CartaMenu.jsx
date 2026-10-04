import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function CartaMenu({ idCliente }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  // Estados para nuevo producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [categoria, setCategoria] = useState('Principal');
  const [codigoCorto, setCodigoCorto] = useState('');

  // Estados para edición en línea
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editCategoria, setEditCategoria] = useState('Principal');
  const [editCodigo, setEditCodigo] = useState('');

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
        vigente: true
      };

      const { error } = await supabase.from('productos').insert([payload]);
      if (error) throw error;

      setMensaje('✅ ¡Producto agregado a la carta con éxito!');
      setNombre('');
      setDescripcion('');
      setPrecioVenta('');
      setCodigoCorto('');
      setCategoria('Principal');
      cargarProductos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje('❌ Error al guardar producto: ' + err.message);
    }
  };

  const iniciarEdicion = (p) => {
    setEditandoId(p.id);
    setEditNombre(p.nombre);
    setEditDesc(p.descripcion || '');
    setEditPrecio(p.precio_venta);
    setEditCategoria(p.categoria);
    setEditCodigo(p.codigo_corto || '');
  };

  const guardarEdicion = async (id) => {
    try {
      const { error } = await supabase.from('productos').update({
        nombre: editNombre.trim(),
        descripcion: editDesc.trim() || null,
        precio_venta: Number(editPrecio),
        categoria: editCategoria,
        codigo_corto: editCodigo.trim().toUpperCase() || null
      }).eq('id', id);

      if (error) throw error;

      setEditandoId(null);
      setMensaje('✅ ¡Producto actualizado con éxito!');
      cargarProductos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este ítem de la carta?')) return;

    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      setMensaje('🗑️ Producto eliminado correctamente.');
      cargarProductos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <h3 style={estilos.subSubTitulo}>Gestión de Carta y Menú</h3>
      <p style={estilos.textoInstruccion}>Agrega, edita y administra los platos, bebidas, aditivos gratis y porciones adicionales de tu local.</p>

      {mensaje && <p style={estilos.mensajeFeedback}>{mensaje}</p>}

      <div style={estilos.gridModulo}>
        {/* Formulario de Registro */}
        <form onSubmit={guardarProducto} style={estilos.formulario}>
          <h4 style={estilos.tituloForm}>Nuevo Ítem para la Carta</h4>

          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Nombre del Producto / Aditivo</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej. Burger Clásica o Crema de Rocoto"
              style={estilos.input}
              required 
            />
          </div>

          <div style={estilos.filaInputs}>
            <div style={estilos.grupoInput}>
              <label style={estilos.label}>Precio de Venta (S/.)</label>
              <input 
                type="number" 
                step="0.50" 
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
                <option value="Ad Gratis">Ad Gratis</option>
                <option value="Ad Porción">Ad Porción</option>
              </select>
            </div>
          </div>

          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Código Corto (Opcional)</label>
            <input 
              type="text" 
              value={codigoCorto} 
              onChange={(e) => setCodigoCorto(e.target.value)} 
              placeholder="Ej. B200, ROC"
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

        {/* Listado de Productos Actuales con Opción de Edición y Borrado */}
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
                  {editandoId === p.id ? (
                    /* FORMULARIO DE EDICIÓN EN LÍNEA */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={editNombre} 
                        onChange={e => setEditNombre(e.target.value)} 
                        style={estilos.input} 
                        placeholder="Nombre"
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="number" 
                          step="0.50" 
                          value={editPrecio} 
                          onChange={e => setEditPrecio(e.target.value)} 
                          style={{ ...estilos.input, flex: 1 }} 
                          placeholder="Precio"
                        />
                        <input 
                          type="text" 
                          value={editCodigo} 
                          onChange={e => setEditCodigo(e.target.value)} 
                          style={{ ...estilos.input, flex: 1 }} 
                          placeholder="Código"
                        />
                        <select 
                          value={editCategoria} 
                          onChange={e => setEditCategoria(e.target.value)} 
                          style={{ ...estilos.input, flex: 1.2 }}
                        >
                          <option value="Principal">Principal</option>
                          <option value="Bebidas">Bebidas</option>
                          <option value="Ad Gratis">Ad Gratis</option>
                          <option value="Ad Porción">Ad Porción</option>
                        </select>
                      </div>
                      <textarea 
                        value={editDesc} 
                        onChange={e => setEditDesc(e.target.value)} 
                        style={{ ...estilos.textarea, minHeight: '50px' }} 
                        placeholder="Descripción"
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button onClick={() => guardarEdicion(p.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>💾 Guardar</button>
                        <button onClick={() => setEditandoId(null)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>❌ Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    /* VISTA NORMAL DE LA TARJETA */
                    <div>
                      <div style={estilos.cardHeader}>
                        <span style={estilos.badgeCategoria}>{p.categoria}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={estilos.precioProducto}>S/. {Number(p.precio_venta).toFixed(2)}</span>
                          <button onClick={() => iniciarEdicion(p)} style={estilos.btnEditar} title="Editar producto">✏️</button>
                          <button onClick={() => eliminarProducto(p.id)} style={estilos.btnBorrar} title="Eliminar producto">🗑️</button>
                        </div>
                      </div>
                      <h5 style={estilos.nombreProducto}>{p.nombre} {p.codigo_corto ? `[${p.codigo_corto}]` : ''}</h5>
                      <p style={estilos.descProducto}>{p.descripcion || 'Sin descripción.'}</p>
                    </div>
                  )}
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
  gridProductos: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' },
  cardProducto: { backgroundColor: '#FAFAFA', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  badgeCategoria: { backgroundColor: '#E0F2F1', color: '#00796B', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' },
  precioProducto: { fontSize: '0.9rem', fontWeight: 'bold', color: '#1E293B' },
  nombreProducto: { fontSize: '0.9rem', color: '#0F172A', margin: '0 0 2px 0', fontWeight: 'bold' },
  descProducto: { fontSize: '0.75rem', color: '#64748B', margin: 0 },
  btnEditar: { background: '#e0e7ff', border: 'none', color: '#4338ca', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' },
  btnBorrar: { background: '#fee2e2', border: 'none', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }
};
