import React, { useState } from 'react';
import api from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    api.post('/login', { username, password })
      .then(response => {
        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          onLogin();
        } else {
          setError('Credenciales inválidas.');
        }
      })
      .catch((error) => {
        if (error.response) {
          setError('Credenciales inválidas. Por favor, verifique su usuario y contraseña.');
        } else if (error.request) {
          setError('Error de red. No se pudo conectar al servidor. Verifique la configuración de la API.');
        } else {
          setError(`Un error ocurrió: ${error.message}`);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h1 className="card-title text-center">Iniciar Sesión</h1>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100" 
                  disabled={loading}
                  style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
