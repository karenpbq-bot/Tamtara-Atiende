import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Reportes({ idCliente, usuarioData }) {
  const clienteIdFinal = idCliente || usuarioData?.id_cliente;

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('graficos'); // Por defecto iniciamos en gráficos
  
  // Filtros de fecha (Por defecto: mes actual)
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const diaActual = hoy.toISOString().split('T')[0];
  
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(diaActual);

  // Agrupación para el gráfico de tendencia
  const [agrupacionTiempo, setAgrupacionTiempo] = useState('dia'); // 'dia', 'semana', 'mes'

  useEffect(() => {
    if (clienteIdFinal) {
      cargarDatos();
    }
  }, [clienteIdFinal, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id_cliente', Number(clienteIdFinal))
        .eq('estado_pago', 'Pagado')
        .gte('created_at', `${fechaInicio}T00:00:00.000Z`)
        .lte('created_at', `${fechaFin}T23:59:59.999Z`);

      if (error) throw error;
      setPedidos(data || []);
    } catch (err) {
      console.error('Error al cargar reportes:', err.message);
    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // LÓGICA DE AGRUPACIÓN Y CÁLCULOS
  // ==========================================
  const totalIngresos = pedidos.reduce((sum, p) => sum + Number(p.monto_total), 0);

  // 1. TENDENCIA DE INGRESOS (Con relleno de vacíos y agrupación)
  const generarDataTendencia = () => {
    if (pedidos.length === 0) return [];
    
    // Crear mapa de ventas en bruto
    const ventasPorFechaExacta = pedidos.reduce((acc, p) => {
      const fecha = p.created_at.split('T')[0];
      acc[fecha] = (acc[fecha] || 0) + Number(p.monto_total);
      return acc;
    }, {});

    const resultados = {};
    let actual = new Date(`${fechaInicio}T12:00:00Z`);
    const fin = new Date(`${fechaFin}T12:00:00Z`);

    while (actual <= fin) {
      const fechaStr = actual.toISOString().split('T')[0];
      const montoDia = ventasPorFechaExacta[fechaStr] || 0;

      let claveAgrupacion = fechaStr; // Por defecto: Día

      if (agrupacionTiempo === 'semana') {
        // Cálculo simple de semana del año
        const d = new Date(Date.UTC(actual.getFullYear(), actual.getMonth(), actual.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        claveAgrupacion = `Semana ${weekNo} (${d.getUTCFullYear()})`;
      } else if (agrupacionTiempo === 'mes') {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        claveAgrupacion = `${meses[actual.getMonth()]} ${actual.getFullYear()}`;
      }

      resultados[claveAgrupacion] = (resultados[claveAgrupacion] || 0) + montoDia;
      actual.setDate(actual.getDate() + 1); // Avanzamos 1 día
    }

    return Object.keys(resultados).map(clave => ({
      etiqueta: agrupacionTiempo === 'dia' ? clave.substring(5) : clave, // Mostrar MM-DD para día
      total: resultados[clave]
    }));
  };
  const dataTendencia = generarDataTendencia();

  // 2. VENTAS POR MÉTODO DE PAGO
  const ventasPorPago = pedidos.reduce((acc, p) => {
    const metodo = p.metodo_pago || 'Desconocido';
    acc[metodo] = (acc[metodo] || 0) + Number(p.monto_total);
    return acc;
  }, {});
  const dataPagos = Object.keys(ventasPorPago).map(m => ({ metodo: m, total: ventasPorPago[m] })).sort((a,b) => b.total - a.total);

  // 3. TENDENCIAS POR TIPO/NOMBRE DE PRODUCTO
  const ventasPorProducto = {};
  pedidos.forEach(p => {
    if (p.items && Array.isArray(p.items)) {
      p.items.forEach(item => {
        const nombre = item.nombre;
        const subTotalAdicionales = (item.adicionales || []).reduce((s, ad) => s + Number(ad.precio), 0);
        const ingresoBruto = (Number(item.precio_base) + subTotalAdicionales) * Number(item.cantidad);
        
        if (!ventasPorProducto[nombre]) {
          ventasPorProducto[nombre] = { cantidad: 0, ingresos: 0 };
        }
        ventasPorProducto[nombre].cantidad += Number(item.cantidad);
        ventasPorProducto[nombre].ingresos += ingresoBruto;
      });
    }
  });
  const dataProductos = Object.keys(ventasPorProducto)
    .map(prod => ({ nombre: prod, ...ventasPorProducto[prod] }))
    .sort((a,b) => b.ingresos - a.ingresos);

  // ==========================================
  // EXPORTACIONES
  // ==========================================
  const descargarCSV = (nombreArchivo, cabeceras, filas) => {
    const csvContent = [cabeceras.join(","), ...filas.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${nombreArchivo}_${fechaInicio}_al_${fechaFin}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarMaestroPedidos = () => {
    const cabeceras = ["ID Ticket", "Fecha", "Cliente", "Tipo Entrega", "Metodo Pago", "Monto Total", "Cortesía"];
    const filas = pedidos.map(p => [
      p.codigo_exacta || p.id,
      p.created_at.split('T')[0],
      `"${p.cliente}"`,
      p.tipo_entrega,
      p.metodo_pago,
      p.monto_total,
      p.cortesia || 'No'
    ]);
    descargarCSV("Maestro_Pedidos", cabeceras, filas);
  };

  const exportarResumenProductos = () => {
    const cabeceras = ["Producto", "Cantidad Vendida", "Ingresos Generados (S/.)"];
    const filas = dataProductos.map(p => [`"${p.nombre}"`, p.cantidad, p.ingresos.toFixed(2)]);
    descargarCSV("Reporte_Productos", cabeceras, filas);
  };

  return (
    <div style={styles.container} className="modulo-reportes">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .modulo-reportes, .modulo-reportes * { visibility: visible; }
            .modulo-reportes { position: absolute; left: 0; top: 0; width: 100%; padding: 0; background: white;}
            .no-print { display: none !important; }
            .print-break { page-break-inside: avoid; }
            .scroll-x { overflow: visible !important; display: flex; flex-wrap: wrap; }
          }
          details > summary { list-style: none; cursor: pointer; }
          details > summary::-webkit-details-marker { display: none; }
          .scroll-x::-webkit-scrollbar { height: 8px; }
          .scroll-x::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        `}
      </style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '1.6rem' }}>📊 Dashboard y Reportes</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Análisis de ventas y métricas de rendimiento.</p>
        </div>
        
        {/* Filtros de Fecha */}
        <div style={{ display: 'flex', gap: '10px', background: '#fff', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} className="no-print">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Desde:</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={styles.inputDate} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Hasta:</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={styles.inputDate} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Ingresos Totales (Pagados)</span>
          <span style={styles.kpiValue}>S/. {totalIngresos.toFixed(2)}</span>
        </div>
        <div style={{...styles.kpiCard, borderLeftColor: '#3b82f6'}}>
          <span style={styles.kpiTitle}>Total de Pedidos Completados</span>
          <span style={{...styles.kpiValue, color: '#3b82f6'}}>{pedidos.length}</span>
        </div>
        <div style={{...styles.kpiCard, borderLeftColor: '#8b5cf6'}}>
          <span style={styles.kpiTitle}>Ticket Promedio por Mesa/Cliente</span>
          <span style={{...styles.kpiValue, color: '#8b5cf6'}}>
            S/. {pedidos.length > 0 ? (totalIngresos / pedidos.length).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }} className="no-print">
        <button onClick={() => setPestanaActiva('graficos')} style={styles.tabBtn(pestanaActiva === 'graficos')}>📈 Gráficos Visuales</button>
        <button onClick={() => setPestanaActiva('datos')} style={styles.tabBtn(pestanaActiva === 'datos')}>📑 Tablas de Datos</button>
        <button onClick={() => setPestanaActiva('exportar')} style={styles.tabBtn(pestanaActiva === 'exportar')}>💾 Exportar e Imprimir</button>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Calculando métricas y construyendo el dashboard...</p>
      ) : (
        <>
          {/* ================= TAB 1: GRÁFICOS VISUALES ================= */}
          {pestanaActiva === 'graficos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
              
              {/* Gráfico 1: Tendencia de Ingresos */}
              <div style={styles.chartCard} className="print-break">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Tendencia de Ingresos por Día</h3>
                  <div style={{ display: 'flex', gap: '5px' }} className="no-print">
                    <button onClick={() => setAgrupacionTiempo('dia')} style={styles.filterBtn(agrupacionTiempo === 'dia')}>Día</button>
                    <button onClick={() => setAgrupacionTiempo('semana')} style={styles.filterBtn(agrupacionTiempo === 'semana')}>Semana</button>
                    <button onClick={() => setAgrupacionTiempo('mes')} style={styles.filterBtn(agrupacionTiempo === 'mes')}>Mes</button>
                  </div>
                </div>
                
                <div className="scroll-x" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '250px', paddingBottom: '30px', overflowX: 'auto', paddingTop: '20px' }}>
                  {dataTendencia.map((f, idx) => {
                    const maxValor = Math.max(...dataTendencia.map(d => d.total)) || 1;
                    const altura = (f.total / maxValor) * 100;
                    return (
                      <div key={idx} style={{ flex: '0 0 auto', width: agrupacionTiempo === 'dia' ? '35px' : '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        {f.total > 0 && <span style={{ fontSize: '0.65rem', color: '#0f766e', fontWeight: 'bold', marginBottom: '4px' }}>{f.total.toFixed(0)}</span>}
                        <div style={{ width: '100%', height: `${Math.max(altura, 1)}%`, backgroundColor: f.total > 0 ? '#2dd4bf' : '#f1f5f9', borderRadius: '4px 4px 0 0' }}></div>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '8px', transform: agrupacionTiempo === 'dia' ? 'rotate(-45deg)' : 'none', whiteSpace: 'nowrap' }}>{f.etiqueta}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico 2 y 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div style={styles.chartCard} className="print-break">
                  <h3 style={styles.chartTitle}>Tendencia de Ventas por Producto</h3>
                  <div style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                    {dataProductos.length === 0 && <p style={{color:'#94a3b8', fontSize:'0.85rem'}}>No hay datos de productos.</p>}
                    {dataProductos.map((p, idx) => {
                      const maxValor = dataProductos[0]?.ingresos || 1;
                      const porcentaje = (p.ingresos / maxValor) * 100;
                      return (
                        <div key={idx} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#334155' }}>
                            <span>{p.nombre} ({p.cantidad} und.)</span>
                            <strong>S/. {p.ingresos.toFixed(2)}</strong>
                          </div>
                          <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                            <div style={{ width: `${porcentaje}%`, backgroundColor: '#3b82f6', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.chartCard} className="print-break">
                  <h3 style={styles.chartTitle}>Distribución por Métodos de Pago</h3>
                  <div style={{ marginTop: '15px' }}>
                    {dataPagos.length === 0 && <p style={{color:'#94a3b8', fontSize:'0.85rem'}}>No hay pagos registrados.</p>}
                    {dataPagos.map((p, idx) => {
                      const porcentaje = totalIngresos > 0 ? (p.total / totalIngresos) * 100 : 0;
                      const colores = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b'];
                      return (
                        <div key={idx} style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#334155' }}>
                            <span>{p.metodo}</span>
                            <strong>{porcentaje.toFixed(1)}% (S/. {p.total.toFixed(2)})</strong>
                          </div>
                          <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', height: '10px' }}>
                            <div style={{ width: `${porcentaje}%`, backgroundColor: colores[idx % colores.length], height: '100%', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: TABLAS DESPLEGABLES ================= */}
          {pestanaActiva === 'datos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <details style={styles.detailsBlock} open>
                <summary style={styles.summaryBlock}>📅 Detalle Diario de Ingresos <span>▼</span></summary>
                <div style={styles.detailsContent}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Fecha Exacta</th><th style={{...styles.th, textAlign:'right'}}>Total Ingresos Recaudados</th></tr></thead>
                    <tbody>
                      {dataTendencia.map((item, idx) => (
                        <tr key={idx}><td style={styles.td}>{item.etiqueta}</td><td style={{...styles.td, textAlign:'right', fontWeight:'bold', color: item.total > 0 ? '#0d9488' : '#94a3b8'}}>S/. {item.total.toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              <details style={styles.detailsBlock}>
                <summary style={styles.summaryBlock}>💳 Resumen por Método de Pago <span>▼</span></summary>
                <div style={styles.detailsContent}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Método Registrado</th><th style={{...styles.th, textAlign:'right'}}>Monto Total</th></tr></thead>
                    <tbody>
                      {dataPagos.map((item, idx) => (
                        <tr key={idx}><td style={styles.td}>{item.metodo}</td><td style={{...styles.td, textAlign:'right', fontWeight:'bold'}}>S/. {item.total.toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              <details style={styles.detailsBlock}>
                <summary style={styles.summaryBlock}>🍔 Ventas Detalladas por Producto <span>▼</span></summary>
                <div style={styles.detailsContent}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Nombre del Producto</th><th style={{...styles.th, textAlign:'center'}}>Unidades Vendidas</th><th style={{...styles.th, textAlign:'right'}}>Ingreso Bruto</th></tr></thead>
                    <tbody>
                      {dataProductos.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.td}>{item.nombre}</td>
                          <td style={{...styles.td, textAlign:'center'}}>{item.cantidad}</td>
                          <td style={{...styles.td, textAlign:'right', color:'#0f766e', fontWeight:'bold'}}>S/. {item.ingresos.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

            </div>
          )}

          {/* ================= TAB 3: EXPORTACIÓN Y PDF ================= */}
          {pestanaActiva === 'exportar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              <div style={styles.exportCard}>
                <div style={styles.exportIcon}>📄</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Maestro de Pedidos (Excel/CSV)</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Descarga la base de datos cruda de todos los tickets emitidos y cobrados en las fechas indicadas.</p>
                <button onClick={exportarMaestroPedidos} style={styles.btnExportar}>📥 Descargar Maestro CSV</button>
              </div>

              <div style={styles.exportCard}>
                <div style={styles.exportIcon}>🍔</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Reporte de Productos (Excel/CSV)</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Obtén el detalle consolidado del volumen de ventas y los ingresos generados por cada ítem de tu carta.</p>
                <button onClick={exportarResumenProductos} style={{...styles.btnExportar, background: '#3b82f6'}}>📥 Descargar Productos CSV</button>
              </div>

              <div style={styles.exportCard}>
                <div style={styles.exportIcon}>🖨️</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Imprimir Dashboard (PDF)</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Convierte los gráficos visuales y KPIs actuales en un documento PDF profesional listo para gerencia.</p>
                <button onClick={() => { setPestanaActiva('graficos'); setTimeout(() => window.print(), 500); }} style={{...styles.btnExportar, background: '#8b5cf6'}}>🖨️ Generar PDF Gerencial</button>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6fb', minHeight: '100vh', padding: '24px' },
  inputDate: { padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', background: '#f8fafc', cursor: 'pointer' },
  filterBtn: (activo) => ({ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '20px', border: '1px solid #0d9488', background: activo ? '#0d9488' : 'transparent', color: activo ? '#fff' : '#0d9488', cursor: 'pointer', fontWeight: 'bold' }),
  kpiCard: { background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #0d9488', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  kpiTitle: { display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  kpiValue: { display: 'block', fontSize: '2rem', fontWeight: 'bold', color: '#0d9488' },
  tabBtn: (activo) => ({ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activo ? '3px solid #0d9488' : '3px solid transparent', color: activo ? '#0d9488' : '#64748b', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }),
  detailsBlock: { background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  summaryBlock: { background: '#f8fafc', padding: '15px 20px', fontWeight: 'bold', color: '#1e293b', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailsContent: { padding: '0', maxHeight: '400px', overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { background: '#f1f5f9', padding: '12px 20px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0 },
  td: { padding: '12px 20px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  chartCard: { background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  chartTitle: { margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
  exportCard: { background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  exportIcon: { fontSize: '3rem', marginBottom: '15px' },
  btnExportar: { width: '100%', padding: '12px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }
};
