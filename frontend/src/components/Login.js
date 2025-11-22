import React, { useState } from 'react';
import api from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError(''); // Reset error on new attempt
    api.post('/api/login', { username, password })
      .then(response => {
        if (response.data.success) {
          onLogin();
        } else {
          // This case might not be reached if the server sends a 401, but included for safety.
          setError('Credenciales inválidas.');
        }
      })
      .catch((error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx (e.g., 401 Unauthorized)
          setError('Credenciales inválidas. Por favor, verifique su usuario y contraseña.');
        } else if (error.request) {
          // The request was made but no response was received.
          // This is a network error (e.g., backend is down, wrong API URL, CORS issue)
          setError('Error de red. No se pudo conectar al servidor. Verifique la configuración de la API.');
        } else {
          // Something happened in setting up the request that triggered an Error
          setError(`Un error ocurrió: ${error.message}`);
        }
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
                <button type="submit" className="btn btn-primary w-100">Iniciar Sesión</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
