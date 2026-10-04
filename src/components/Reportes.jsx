import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Reportes({ idCliente, usuarioData }) {
  const clienteIdFinal = idCliente || usuarioData?.id_cliente;

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('datos'); // 'datos', 'graficos', 'exportar'
  
  // Filtros de fecha (Por defecto: mes actual)
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const diaActual = hoy.toISOString().split('T')[0];
  
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(diaActual);

  useEffect(() => {
    if (clienteIdFinal) {
      cargarDatos();
    }
  }, [clienteIdFinal, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Traemos solo pedidos cobrados dentro del rango de fechas
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
  
  // 1. Ingresos por Fecha
  const ventasPorFecha = pedidos.reduce((acc, p) => {
    const fecha = p.created_at.split('T')[0];
    acc[fecha] = (acc[fecha] || 0) + Number(p.monto_total);
    return acc;
  }, {});
  const dataFechas = Object.keys(ventasPorFecha).map(f => ({ fecha: f, total: ventasPorFecha[f] })).sort((a,b) => a.fecha.localeCompare(b.fecha));

  // 2. Ventas por Método de Pago
  const ventasPorPago = pedidos.reduce((acc, p) => {
    const metodo = p.metodo_pago || 'Desconocido';
    acc[metodo] = (acc[metodo] || 0) + Number(p.monto_total);
    return acc;
  }, {});
  const dataPagos = Object.keys(ventasPorPago).map(m => ({ metodo: m, total: ventasPorPago[m] })).sort((a,b) => b.total - a.total);

  // 3. Ventas por Producto
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

  const totalIngresos = pedidos.reduce((sum, p) => sum + Number(p.monto_total), 0);

  // ==========================================
  // FUNCIONES DE EXPORTACIÓN (CSV / EXCEL)
  // ==========================================
  const descargarCSV = (nombreArchivo, cabeceras, filas) => {
    const csvContent = [
      cabeceras.join(","),
      ...filas.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${nombreArchivo}_${fechaInicio}_al_${fechaFin}.csv`);
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
    const cabeceras = ["Producto", "Cantidad Vendida", "Ingresos Generados"];
    const filas = dataProductos.map(p => [`"${p.nombre}"`, p.cantidad, p.ingresos.toFixed(2)]);
    descargarCSV("Reporte_Productos", cabeceras, filas);
  };

  const imprimirPDF = () => {
    window.print();
  };

  return (
    <div style={styles.container} className="modulo-reportes">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .modulo-reportes, .modulo-reportes * { visibility: visible; }
            .modulo-reportes { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
            .no-print { display: none !important; }
            .print-break { page-break-inside: avoid; }
          }
          details > summary { list-style: none; cursor: pointer; }
          details > summary::-webkit-details-marker { display: none; }
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

      {/* Tarjetas de Resumen Rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Ingresos Totales (Pagados)</span>
          <span style={styles.kpiValue}>S/. {totalIngresos.toFixed(2)}</span>
        </div>
        <div style={{...styles.kpiCard, borderLeftColor: '#3b82f6'}}>
          <span style={styles.kpiTitle}>Total de Pedidos</span>
          <span style={{...styles.kpiValue, color: '#3b82f6'}}>{pedidos.length}</span>
        </div>
        <div style={{...styles.kpiCard, borderLeftColor: '#8b5cf6'}}>
          <span style={styles.kpiTitle}>Ticket Promedio</span>
          <span style={{...styles.kpiValue, color: '#8b5cf6'}}>
            S/. {pedidos.length > 0 ? (totalIngresos / pedidos.length).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }} className="no-print">
        <button onClick={() => setPestanaActiva('datos')} style={styles.tabBtn(pestanaActiva === 'datos')}>📑 Tablas de Datos</button>
        <button onClick={() => setPestanaActiva('graficos')} style={styles.tabBtn(pestanaActiva === 'graficos')}>📈 Gráficos Visuales</button>
        <button onClick={() => setPestanaActiva('exportar')} style={styles.tabBtn(pestanaActiva === 'exportar')}>💾 Exportar Reportes</button>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Calculando métricas...</p>
      ) : (
        <>
          {/* ================= TAB 1: DATOS (DESPLEGABLES) ================= */}
          {pestanaActiva === 'datos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <details style={styles.detailsBlock} open>
                <summary style={styles.summaryBlock}>📅 Ingresos Diarios por Fecha <span>▼</span></summary>
                <div style={styles.detailsContent}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Fecha</th><th style={{...styles.th, textAlign:'right'}}>Total Ingresos</th></tr></thead>
                    <tbody>
                      {dataFechas.map((item, idx) => (
                        <tr key={idx}><td style={styles.td}>{item.fecha}</td><td style={{...styles.td, textAlign:'right', fontWeight:'bold', color:'#0d9488'}}>S/. {item.total.toFixed(2)}</td></tr>
                      ))}
                      {dataFechas.length === 0 && <tr><td colSpan="2" style={styles.tdEmpty}>No hay datos en este periodo.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </details>

              <details style={styles.detailsBlock}>
                <summary style={styles.summaryBlock}>💳 Ventas por Método de Pago <span>▼</span></summary>
                <div style={styles.detailsContent}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Método de Pago</th><th style={{...styles.th, textAlign:'right'}}>Monto Recaudado</th></tr></thead>
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
                    <thead><tr><th style={styles.th}>Producto</th><th style={{...styles.th, textAlign:'center'}}>Cant. Vendida</th><th style={{...styles.th, textAlign:'right'}}>Ingresos Generados</th></tr></thead>
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

          {/* ================= TAB 2: GRÁFICOS (BARRAS NATIVAS CSS) ================= */}
          {pestanaActiva === 'graficos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
              
              <div style={styles.chartCard} className="print-break">
                <h3 style={styles.chartTitle}>Top Productos Más Vendidos (Por Ingresos)</h3>
                <div style={{ marginTop: '15px' }}>
                  {dataProductos.slice(0, 8).map((p, idx) => {
                    const maxValor = dataProductos[0]?.ingresos || 1;
                    const porcentaje = (p.ingresos / maxValor) * 100;
                    return (
                      <div key={idx} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#334155' }}>
                          <span>{p.nombre} ({p.cantidad} und.)</span>
                          <strong>S/. {p.ingresos.toFixed(2)}</strong>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                          <div style={{ width: `${porcentaje}%`, backgroundColor: '#0d9488', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div style={styles.chartCard} className="print-break">
                  <h3 style={styles.chartTitle}>Distribución por Métodos de Pago</h3>
                  <div style={{ marginTop: '15px' }}>
                    {dataPagos.map((p, idx) => {
                      const porcentaje = totalIngresos > 0 ? (p.total / totalIngresos) * 100 : 0;
                      const colores = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#64748b'];
                      return (
                        <div key={idx} style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#334155' }}>
                            <span>{p.metodo}</span>
                            <strong>{porcentaje.toFixed(1)}% (S/. {p.total.toFixed(2)})</strong>
                          </div>
                          <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', height: '8px' }}>
                            <div style={{ width: `${porcentaje}%`, backgroundColor: colores[idx % colores.length], height: '100%', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.chartCard} className="print-break">
                  <h3 style={styles.chartTitle}>Tendencia Diaria (Últimos días activos)</h3>
                  <div style={{ marginTop: '15px', display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    {dataFechas.slice(-10).map((f, idx) => {
                      const maxValor = Math.max(...dataFechas.map(d => d.total));
                      const altura = maxValor > 0 ? (f.total / maxValor) * 100 : 0;
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                          <span style={{ fontSize: '0.65rem', color: '#0f766e', fontWeight: 'bold', marginBottom: '4px' }}>{f.total.toFixed(0)}</span>
                          <div style={{ width: '100%', maxWidth: '30px', height: `${altura}%`, backgroundColor: '#2dd4bf', borderRadius: '4px 4px 0 0', minHeight: '5px' }}></div>
                          <span style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '6px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{f.fecha.substring(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: EXPORTACIÓN ================= */}
          {pestanaActiva === 'exportar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              <div style={styles.exportCard}>
                <div style={styles.exportIcon}>📄</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Maestro de Pedidos (Excel/CSV)</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Descarga la base de datos completa de todas las ventas realizadas en el rango de fechas seleccionado.</p>
                <button onClick={exportarMaestroPedidos} style={styles.btnExportar}>📥 Descargar Maestro CSV</button>
              </div>

              <div style={styles.exportCard}>
                <div style={styles.exportIcon}>🍔</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Reporte de Productos (Excel/CSV)</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Obtén el detalle consolidado de las cantidades vendidas e ingresos generados por cada ítem de la carta.</p>
                <button onClick={exportarResumenProductos} style={{...styles.btnExportar, background: '#3b82f6'}}>📥 Descargar Productos CSV</button>
              </div>

              <div style={styles.exportCard}>
                <div style={styles.exportIcon}>🖨️</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Dashboard Visual (PDF)</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Genera un reporte gerencial en PDF listo para imprimir con todos los KPI y gráficos en pantalla.</p>
                <button onClick={() => { setPestanaActiva('graficos'); setTimeout(imprimirPDF, 500); }} style={{...styles.btnExportar, background: '#8b5cf6'}}>🖨️ Imprimir / Guardar PDF</button>
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
  inputDate: { padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', background: '#f8fafc' },
  kpiCard: { background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #0d9488', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  kpiTitle: { display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  kpiValue: { display: 'block', fontSize: '2rem', fontWeight: 'bold', color: '#0d9488' },
  tabBtn: (activo) => ({ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activo ? '3px solid #0d9488' : '3px solid transparent', color: activo ? '#0d9488' : '#64748b', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }),
  detailsBlock: { background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  summaryBlock: { background: '#f8fafc', padding: '15px 20px', fontWeight: 'bold', color: '#1e293b', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailsContent: { padding: '0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { background: '#f1f5f9', padding: '12px 20px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '12px 20px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  tdEmpty: { padding: '20px', textAlign: 'center', color: '#94a3b8' },
  chartCard: { background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  chartTitle: { margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
  exportCard: { background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  exportIcon: { fontSize: '3rem', marginBottom: '15px' },
  btnExportar: { width: '100%', padding: '12px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'opacity 0.2s' }
};
