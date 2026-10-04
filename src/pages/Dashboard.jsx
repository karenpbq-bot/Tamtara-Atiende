import React, { useState, useEffect } from 'react';
import { supabase } from '../clientes';

// Subcomponente modular: Bloque tipo acordeón (Desplegable)
const BloqueDesplegable = ({ titulo, isOpen, onClick, children }) => {
  return (
    <div style={estilos.bloque}>
      <button style={estilos.cabeceraBloque} onClick={onClick}>
        <h3 style={estilos.tituloBloque}>{titulo}</h3>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'none', 
          transition: 'transform 0.3s ease',
          color: '#00A89F',
          fontWeight: 'bold'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={estilos.contenidoBloque}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function Dashboard({ usuarioData, onCerrarSesion }) {
  const [bloqueAbierto, setBloqueAbierto] = useState(null);
  
  // Métricas operativas iniciales para el negocio
  const [metricas, setMetricas] = useState({
    pedidosHoy: 0,
    enCocina: 0,
    entregados: 0
  });

  const rol = usuarioData?.rol || 'Administrador';
  const idCliente = usuarioData?.id_cliente;

  // Cargar métricas al iniciar sesión filtrando por id_cliente
  useEffect(() => {
    if (idCliente) {
      cargarMetricasOperativas();
    }
  }, [idCliente]);

  const cargarMetricasOperativas = async () => {
    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('estado')
        .eq('id_cliente', idCliente);

      if (error) throw error;

      if (pedidos) {
        const total = pedidos.length;
        const cocina = pedidos.filter(p => p.estado === 'En Cocina' || p.estado === 'Pendiente').length;
        const entregados = pedidos.filter(p => p.estado === 'Entregado').length;
        
        setMetricas({
          pedidosHoy: total,
          enCocina: cocina,
          entregados: entregados
        });
      }
    } catch (err) {
      console.error('Error cargando métricas operativas:', err);
    }
  };

  const alternarBloque = (id) => {
    setBloqueAbierto(bloqueAbierto === id ? null : id);
  };

  return (
    <div style={estilos.contenedor}>
      
      {/* Barra de Navegación Superior */}
      <header style={estilos.header}>
        <div style={estilos.logoContenedor}>
          <h1 style={estilos.logo}>Tamtara-Atiende</h1>
        </div>
        <div style={estilos.infoUsuario}>
          <div style={estilos.datosUsuario}>
            <span style={estilos.nombre}>{usuarioData?.nombres_apellidos || usuarioData?.correo}</span>
            <span style={estilos.rolTag}>{rol}</span>
          </div>
          <button onClick={onCerrarSesion} style={estilos.botonSalir}>Salir</button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main style={estilos.main}>
        <div style={estilos.headerPanel}>
          <h2 style={estilos.tituloPrincipal}>Panel de Control Operativo</h2>
          
          {/* Tarjetas de Métricas en Tiempo Real */}
          <div style={estilos.contenedorMetricas}>
            <div style={estilos.cardMetrica}>
              <span style={estilos.labelMetrica}>Pedidos Totales</span>
              <span style={{ ...estilos.valorMetrica, color: '#00796B' }}>{metricas.pedidosHoy}</span>
            </div>
            <div style={estilos.cardMetrica}>
              <span style={estilos.labelMetrica}>En Cocina / Pendientes</span>
              <span style={{ ...estilos.valorMetrica, color: '#D97706' }}>{metricas.enCocina}</span>
            </div>
            <div style={estilos.cardMetrica}>
              <span style={estilos.labelMetrica}>Entregados</span>
              <span style={{ ...estilos.valorMetrica, color: '#16A34A' }}>{metricas.entregados}</span>
            </div>
          </div>
        </div>

        <div style={estilos.contenedorBloques}>
          
          {/* Bloque 1: Terminal de Pedidos */}
          <BloqueDesplegable 
            titulo="Terminal de Pedidos y Ventas" 
            isOpen={bloqueAbierto === 1} 
            onClick={() => alternarBloque(1)}
          >
            <div style={estilos.placeholderMascara}>
              <p>Módulo de Terminal de Pedidos (Caja, Tiketeras y Cobros) se integrará aquí.</p>
            </div>
          </BloqueDesplegable>

          {/* Bloque 2: Tracking de Comandas en Vivo */}
          <BloqueDesplegable 
            titulo="Tracking de Comandas (Kanban)" 
            isOpen={bloqueAbierto === 2} 
            onClick={() => alternarBloque(2)}
          >
            <div style={estilos.placeholderMascara}>
              <p>Tablero en tiempo real para Cocina y Salón se integrará aquí.</p>
            </div>
          </BloqueDesplegable>

          {/* Bloque 3: Gestión de Carta y Menú */}
          <BloqueDesplegable 
            titulo="Carta y Menú (Productos)" 
            isOpen={bloqueAbierto === 3} 
            onClick={() => alternarBloque(3)}
          >
            <div style={estilos.placeholderMascara}>
              <p>Administración de platos, bebidas y precios se integrará aquí.</p>
            </div>
          </BloqueDesplegable>

          {/* Bloque 4: Kardex e Inventario */}
          <BloqueDesplegable 
            titulo="Kardex e Inventarios (Materia Prima)" 
            isOpen={bloqueAbierto === 4} 
            onClick={() => alternarBloque(4)}
          >
            <div style={estilos.placeholderMascara}>
              <p>Control de stock y movimientos de insumos se integrará aquí.</p>
            </div>
          </BloqueDesplegable>

          {/* Bloque 5: Recetas y Costeos */}
          <BloqueDesplegable 
            titulo="Recetas y Costos de Elaboración" 
            isOpen={bloqueAbierto === 5} 
            onClick={() => alternarBloque(5)}
          >
            <div style={estilos.placeholderMascara}>
              <p>Constructor de recetas y análisis de costos se integrará aquí.</p>
            </div>
          </BloqueDesplegable>

          {/* Bloque 6: Información de la Cuenta */}
          <BloqueDesplegable 
            titulo="Información del Local y Suscripción" 
            isOpen={bloqueAbierto === 6} 
            onClick={() => alternarBloque(6)}
          >
            <div style={estilos.placeholderMascara}>
              <p><b>ID de Cliente en sesión:</b> {idCliente || 'N/D'}</p>
              <p>Detalles del plan y datos corporativos del establecimiento.</p>
            </div>
          </BloqueDesplegable>

        </div>
      </main>
    </div>
  );
}

const estilos = {
  contenedor: { minHeight: '100vh', backgroundColor: '#F4F7F6', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '15px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  logoContenedor: { display: 'flex', alignItems: 'center' },
  logo: { margin: 0, fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(90deg, #00A89F 0%, #88D84D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  infoUsuario: { display: 'flex', alignItems: 'center', gap: '20px' },
  datosUsuario: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  nombre: { fontSize: '0.95rem', fontWeight: '600', color: '#333333' },
  rolTag: { fontSize: '0.7rem', backgroundColor: '#EBF5F7', color: '#00A89F', padding: '2px 8px', borderRadius: '12px', marginTop: '4px', fontWeight: 'bold', textTransform: 'uppercase' },
  botonSalir: { backgroundColor: 'transparent', border: '1px solid #DDDDDD', padding: '8px 16px', borderRadius: '6px', color: '#666666', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' },
  main: { maxWidth: '960px', margin: '40px auto', padding: '0 20px' },
  headerPanel: { marginBottom: '30px', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px' },
  tituloPrincipal: { fontSize: '1.8rem', color: '#333333', marginBottom: '15px' },
  contenedorMetricas: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', width: '100%' },
  cardMetrica: { backgroundColor: '#FFFFFF', padding: '12px 15px', borderRadius: '10px', border: '1px solid #CBD5E1', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  labelMetrica: { fontSize: '0.7rem', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' },
  valorMetrica: { fontSize: '1.4rem', fontWeight: 'bold' },
  contenedorBloques: { display: 'flex', flexDirection: 'column', gap: '15px' },
  bloque: { backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0, 168, 159, 0.08)', border: '1px solid #EEEEEE' },
  cabeceraBloque: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', outline: 'none' },
  tituloBloque: { margin: 0, fontSize: '1.1rem', color: '#444444', fontWeight: '600' },
  contenidoBloque: { padding: '20px', backgroundColor: '#FAFAFA', borderTop: '1px solid #EEEEEE' },
  placeholderMascara: { padding: '30px', textAlign: 'center', border: '2px dashed #CCCCCC', borderRadius: '8px', color: '#666666', fontSize: '0.9rem' }
};
