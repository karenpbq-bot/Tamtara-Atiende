import React, { useEffect } from 'react';
import tamtaraLogo from '../tamtara.png'; // Este se queda con ../ porque está en la carpeta raíz src/
import logoLaExacta from './Laexacta.png'; // Cambiado a ./ porque está en la misma carpeta components/
import logoPrueba from './logo-prueba.png'; // Cambiado a ./ porque está en la misma carpeta components/

const Sidebar = ({ usuarioData, moduloActivo, setModuloActivo, onCerrarSesion }) => {
  
  // Escuchar la orden global para cambiar de módulo automáticamente (ej. desde el Kanban)
  useEffect(() => {
    const handleCambioModulo = (e) => setModuloActivo(e.detail);
    window.addEventListener('cambiarModulo', handleCambioModulo);
    return () => window.removeEventListener('cambiarModulo', handleCambioModulo);
  }, [setModuloActivo]);

  // ==========================================
  // LÓGICA DE LOGOS DINÁMICOS
  // ==========================================
  const obtenerLogo = () => {
    // 1. Si es el dueño del sistema, mostramos Tamtara
    if (usuarioData?.rol === 'superadmin') return tamtaraLogo;

    // 2. Diccionario de clientes: Vincula el código 5D con su archivo de imagen
    const logosPorCliente = {
      '0AZPU': logoLaExacta, // Código de La Exacta
      'ESTJQ': logoPrueba,   // Código del cliente Prueba
    };

    // 3. Devolvemos el logo si existe, si no, devolvemos null
    return logosPorCliente[usuarioData?.codigo_7d] || null;
  };

  const logoUrl = obtenerLogo();

  const menuItems = [
    // Módulo exclusivo para Superadmin
    ...(usuarioData?.rol === 'superadmin' ? [{
      id: 'admin_clientes', label: 'Gestión de Clientes', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      )
    }] : []),
    { id: 'terminal', label: 'Terminal de Pedidos', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
    )},
    { id: 'kanban', label: 'Tracking (Kanban)', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
    )},
    { id: 'carta', label: 'Carta y Menú', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    )},
    { id: 'kardex', label: 'Kardex e Inventarios', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
    )},
    { id: 'recetas', label: 'Recetas y Costos', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
    )},
    { id: 'reportes', label: 'Dashboard y Reportes', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
    )},
  ];

  const styles = {
    sidebar: {
      width: '260px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    logoContainer: {
      padding: '25px 20px',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100px'
    },
    logo: {
      maxWidth: '100%',
      maxHeight: '60px',
      objectFit: 'contain'
    },
    logoPlaceholder: {
      fontFamily: "'Dancing Script', cursive",
      fontSize: '24px',
      color: '#3d2b56',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    menuContainer: {
      flex: 1,
      padding: '20px 15px',
      overflowY: 'auto'
    },
    menuItem: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '12px 15px',
      marginBottom: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: isActive ? '#7c3aed' : 'transparent', // Morado moderno para el activo
      color: isActive ? '#ffffff' : '#6b7280',
      fontWeight: isActive ? '600' : '500',
      transition: 'all 0.2s ease',
    }),
    iconWrapper: {
      marginRight: '12px',
      display: 'flex',
      alignItems: 'center'
    },
    userSection: {
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderTop: '1px solid #e5e7eb'
    },
    userName: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#374151',
      marginBottom: '5px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    roleBadge: {
      display: 'inline-block',
      backgroundColor: '#3b82f6', // Azul para el rol
      color: '#ffffff',
      fontSize: '10px',
      fontWeight: 'bold',
      padding: '4px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '15px'
    },
    actionButton: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      padding: '10px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      color: '#4b5563',
      marginBottom: '10px',
      transition: 'color 0.2s'
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '10px',
      backgroundColor: '#fee2e2', // Fondo rojo claro
      color: '#ef4444', // Texto rojo
      border: '1px solid #f87171',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 'bold',
      transition: 'background-color 0.2s'
    }
  };

  return (
    <aside style={styles.sidebar}>
      {/* Zona 1: Branding y Logo */}
      <div style={styles.logoContainer}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo Cliente" style={styles.logo} />
        ) : (
          <div style={styles.logoPlaceholder}>Tamtara Atiende</div>
        )}
      </div>

      {/* Zona 2: Navegación de Módulos */}
      <div style={styles.menuContainer}>
        {menuItems.map((item) => {
          const isActive = moduloActivo === item.id;
          return (
            <div 
              key={item.id} 
              style={styles.menuItem(isActive)}
              onClick={() => setModuloActivo(item.id)}
            >
              <div style={styles.iconWrapper}>{item.icon}</div>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Zona 3: Gestión de Usuario */}
      <div style={styles.userSection}>
        <div style={styles.userName}>{usuarioData?.nombre || usuarioData?.correo || 'Usuario'}</div>
        <div style={styles.roleBadge}>{usuarioData?.rol || 'USUARIO'}</div>

        <button style={styles.actionButton}>
          <svg style={{marginRight: '8px'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
          Cambiar Contraseña
        </button>

        <button onClick={onCerrarSesion} style={styles.logoutButton}>
          <svg style={{marginRight: '8px'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
