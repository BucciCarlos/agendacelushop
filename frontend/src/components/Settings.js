import React from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { FaSun, FaMoon } from 'react-icons/fa';

const Settings = ({ show, handleClose, theme, toggleTheme, handleExport, handleImport, isLoading, importMessage, importErrors }) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Configuración</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading && (
          <div className="d-flex justify-content-center mb-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </div>
        )}

        {importMessage && <Alert variant={importMessage.type}>{importMessage.text}</Alert>}

        {importErrors.length > 0 && (
          <Alert variant="danger">
            <h5>Errores de Importación:</h5>
            <ul>
              {importErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="d-grid gap-2">
          <Button variant="secondary" onClick={toggleTheme} disabled={isLoading}>
            {theme === 'light' ? <><FaMoon /> Dark Mode</> : <><FaSun /> Light Mode</>}
          </Button>
          <hr />
          <label htmlFor="import-file" className={`btn btn-primary ${isLoading ? 'disabled' : ''}`}>
            Importar XLSX
          </label>
          <input 
            type="file" 
            id="import-file" 
            style={{ display: 'none' }} 
            onChange={handleImport} 
            accept=".xlsx" 
            disabled={isLoading}
          />
          <Button variant="primary" onClick={handleExport} disabled={isLoading}>Exportar XLSX</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default Settings;