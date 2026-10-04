import React, { useState } from 'react';
import tamtaraLogo from '../tamtara.png';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSession, setKeepSession] = useState(false);
  // Nuevo estado para controlar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);

  const clientLogoUrl = null; 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin(email, password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f4f6fb',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    card: {
      backgroundColor: 'white',
      padding: '40px 30px',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      width: '100%',
      maxWidth: '350px',
      textAlign: 'center'
    },
    logoContainer: {
      marginBottom: '20px',
      minHeight: '60px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    logoPlaceholder: {
      fontSize: '50px',
      color: '#7fa9f5'
    },
    clientImage: {
      maxHeight: '70px',
      maxWidth: '100%',
      objectFit: 'contain'
    },
    subtitle: {
      color: '#555',
      fontSize: '13px',
      marginBottom: '25px'
    },
    formGroup: {
      textAlign: 'left',
      marginBottom: '18px'
    },
    label: {
      display: 'block',
      color: '#5c6370',
      fontSize: '12px',
      marginBottom: '6px',
      fontWeight: '600'
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      borderRadius: '25px',
      border: '1px solid #d1d9e6',
      backgroundColor: '#ebf0f7',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    // Nuevos estilos para el contenedor de la contraseña y el botón
    passwordWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    passwordInput: {
      width: '100%',
      padding: '12px 40px 12px 15px', // Mayor padding a la derecha para que el texto no pise el ícono
      borderRadius: '25px',
      border: '1px solid #d1d9e6',
      backgroundColor: '#ebf0f7',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    toggleButton: {
      position: 'absolute',
      right: '15px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      color: '#5c6370'
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'left',
      marginBottom: '25px',
      fontSize: '12px',
      color: '#666'
    },
    checkbox: {
      marginRight: '8px',
      accentColor: '#1cb35b'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#1cb35b',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      fontSize: '15px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginBottom: '25px'
    },
    dividerLine: {
      borderBottom: '1px solid #e8eaf2',
      margin: '15px 0'
    },
    appName: {
      fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
      fontSize: '24px',
      color: '#3d2b56',
      margin: '15px 0',
      fontWeight: 'normal'
    },
    footer: {
      fontSize: '9px',
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginTop: '15px'
    },
    poweredLogo: {
      display: 'block',
      margin: '8px auto 0',
      height: '35px',
      objectFit: 'contain'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.logoContainer}>
          {clientLogoUrl ? (
            <img src={clientLogoUrl} alt="Logo Cliente" style={styles.clientImage} />
          ) : (
            <div style={styles.logoPlaceholder}>🏢👤</div>
          )}
        </div>
        
        <p style={styles.subtitle}>Ingrese sus credenciales para acceder</p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.passwordInput}
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                style={styles.toggleButton}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <div style={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="keepSession"
              checked={keepSession}
              onChange={(e) => setKeepSession(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="keepSession">Mantener sesión abierta</label>
          </div>
          
          <button type="submit" style={styles.button}>Ingresar</button>
        </form>

        <div style={styles.dividerLine}></div>
        <h2 style={styles.appName}>Atender App</h2>
        <div style={styles.dividerLine}></div>
        
        <div style={styles.footer}>
          POWERED BY
          <img src={tamtaraLogo} alt="Logo Tamtara" style={styles.poweredLogo} />
        </div>
      </div>
    </div>
  );
};

export default Login;
