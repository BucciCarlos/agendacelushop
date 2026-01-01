import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Table, Button, Modal, Form, Pagination, Container, Row, Col, Card, Collapse } from 'react-bootstrap';
import { FaWhatsapp, FaComment, FaEdit, FaTrash, FaPlusCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import Settings from './Settings';
import * as XLSX from 'xlsx';

function Dashboard({ theme, toggleTheme, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'comments'
  const [currentContact, setCurrentContact] = useState(null);
  const [filters, setFilters] = useState({ name: '', lastname: '', saleNumber: '', dni: '', date: '', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [openComments, setOpenComments] = useState(false);
  const [hasSale, setHasSale] = useState(false);
  const [sales, setSales] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [contactToDeleteId, setContactToDeleteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleHasSaleChange = (e) => {
    const isChecked = e.target.checked;
    setHasSale(isChecked);
    if (isChecked && sales.length === 0) {
      handleAddSale(); // Automatically add the first sale
    }
  };

  const handleAddSale = () => {
    setSales([...sales, { saleNumber: '', date: '' }]);
  };

  const handleRemoveSale = (index) => {
    const newSales = [...sales];
    newSales.splice(index, 1);
    setSales(newSales);
  };

  const handleSaleChange = (index, e) => {
    const { name, value } = e.target;
    const newSales = [...sales];

    if (name === 'saleDate') {
      let formattedValue = value.replace(/[^0-9]/g, '');
      if (formattedValue.length > 2 && formattedValue.length <= 4) {
        formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2)}`;
      } else if (formattedValue.length > 4) {
        formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2, 4)}/${formattedValue.slice(4, 8)}`;
      }
      newSales[index].date = formattedValue;
    } else {
      newSales[index][name] = value;
    }

    setSales(newSales);
  };

  const fetchContacts = useCallback(() => {
    api.get('/contacts', { 
        params: { ...filters, page: pagination.currentPage }
    })
      .then(response => {
        setContacts(response.data.contacts);
        setPagination({ currentPage: response.data.currentPage, totalPages: response.data.totalPages });
      })
      .catch(error => {
        console.error('Hubo un error al obtener los contactos!', error);
      });
  }, [filters, pagination.currentPage]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };



  const handleSearch = () => {
    setPagination({ ...pagination, currentPage: 1 });
    fetchContacts();
  };

  const clearFilters = () => {
    setFilters({ name: '', lastname: '', saleNumber: '', dni: '', date: '', startDate: '', endDate: '' });
    setPagination({ ...pagination, currentPage: 1 });
    fetchContacts();
  };

  const handleShowModal = (type, contact = null) => {
    setModalType(type);
    setCurrentContact(contact);
    setShowModal(true);
    setOpenComments(!!contact?.comments);
    setHasSale(contact?.sales?.length > 0);
    setSales(contact?.sales || []);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentContact(null);
    setOpenComments(false);
    setHasSale(false);
    setSales([]);
  };

  const handleDelete = (id) => {
    setContactToDeleteId(id);
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    api.delete(`/contacts/${contactToDeleteId}`)
      .then(() => {
        fetchContacts();
        setShowConfirmDeleteModal(false);
        setContactToDeleteId(null);
      })
      .catch(error => {
        console.error('Error al eliminar contacto!', error);
        setShowConfirmDeleteModal(false);
        setContactToDeleteId(null);
      });
  };

  const handleCloseConfirmDeleteModal = () => {
    setShowConfirmDeleteModal(false);
    setContactToDeleteId(null);
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setIsSaving(true);

    let contactDate = new Date(); // Default to now
    if (hasSale && sales.length > 0) {
      const saleDates = sales
        .map(sale => {
          const parts = sale.date.split('/');
          if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
          }
          return null;
        })
        .filter(date => date !== null);

      if (saleDates.length > 0) {
        contactDate = new Date(Math.max.apply(null, saleDates));
      }
    }

    const contactData = {
        ...currentContact,
        name: data.name,
        lastname: data.lastname,
        dni: data.dni,
        phones: [
            { type: 'personal', number: data.phone1 },
            { type: 'family', number: data.phone2, relativeName: data.relativeName }
        ],
        sales: hasSale ? sales : [],
        comments: data.comments || (currentContact ? currentContact.comments : ''),
        date: contactDate,
    };

    let request;
    if (modalType === 'add') {
        request = api.post('/contacts', contactData);
    } else if (modalType === 'edit') {
        request = api.put(`/contacts/${currentContact._id}`, contactData);
    } else if (modalType === 'comments') {
        request = api.put(`/contacts/${currentContact._id}/comments`, { comments: data.comments });
    }

    if (request) {
        request
            .then(() => {
                fetchContacts();
                handleCloseModal();
            })
            .catch(error => {
                console.error('Error al guardar:', error);
                // Aquí se podría agregar un estado de error visual si se desea
            })
            .finally(() => {
                setIsSaving(false);
            });
    } else {
        setIsSaving(false);
    }
  };

  const handleExport = () => {
    setIsLoading(true);
    setImportMessage(null);
    setImportErrors([]);
    api.get('/contacts?all=true')
      .then(response => {
        const contactsToExport = (response.data.contacts || []).map(contact => ({
          'Nombre': contact.name,
          'Apellido': contact.lastname,
          'DNI': contact.dni,
          'Telefono Personal': (contact.phones || []).find(p => p.type === 'personal')?.number || '',
          'Telefono Familiar': (contact.phones || []).find(p => p.type === 'family')?.number || '',
          'Nombre del Familiar': (contact.phones || []).find(p => p.type === 'family')?.relativeName || '',
          'N° de Venta': (contact.sales || []).map(s => s.saleNumber).join(', '),
          'Fecha de Venta': (contact.sales || []).map(s => s.date).join(', '),
          'Comentarios': contact.comments,
          'Fecha': new Date(contact.date).toLocaleDateString()
        }));
        const worksheet = XLSX.utils.json_to_sheet(contactsToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Contactos");
        XLSX.writeFile(workbook, "agenda.xlsx");
        setImportMessage({ type: 'success', text: 'Contactos exportados exitosamente!' });
      })
      .catch(error => {
        console.error('Error al exportar contactos!', error);
        setImportMessage({ type: 'danger', text: 'Error al exportar contactos.' });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setImportMessage(null);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        api.post('/contacts/import', json)
          .then(response => {
            fetchContacts();
            setImportMessage({ type: 'success', text: response.data.message || 'Contactos importados exitosamente!' });
            setShowSettings(false);
          })
          .catch(error => {
            console.error('Error al importar contactos!', error);
            const errorMessage = error.response?.data?.message || 'Error al importar contactos.';
            const errorsList = error.response?.data?.errors || [];
            setImportMessage({ type: 'danger', text: errorMessage });
            setImportErrors(errorsList);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Error al leer el archivo XLSX!', error);
        setImportMessage({ type: 'danger', text: 'Error al leer el archivo XLSX. Asegúrate de que sea un archivo válido.' });
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Container fluid className="pt-3">
      <Row className="mb-3 align-items-center">
        <Col>
          <h1>Agenda de Clientes</h1>
        </Col>
        <Col className="d-flex justify-content-end align-items-center">
          <Button onClick={() => handleShowModal('add')} className="rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '50px', height: '50px', padding: '0' }}><FaPlusCircle className="plus-icon" style={{ fontSize: '36px' }} /></Button>
          <Button onClick={() => setShowSettings(true)} className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', padding: '0' }}><FaCog style={{ fontSize: '20px' }} /></Button>
          <Button onClick={onLogout} className="rounded-circle d-flex align-items-center justify-content-center ms-2" variant="danger" style={{ width: '36px', height: '36px', padding: '0' }} title="Cerrar Sesión"><FaSignOutAlt style={{ fontSize: '18px' }} /></Button>
        </Col>
      </Row>

      <Settings 
        show={showSettings} 
        handleClose={() => {
          setShowSettings(false);
          setImportMessage(null);
          setImportErrors([]);
        }} 
        theme={theme} 
        toggleTheme={toggleTheme}
        handleExport={handleExport}
        handleImport={handleImport}
        isLoading={isLoading}
        importMessage={importMessage}
        importErrors={importErrors}
      />

      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Filtros</Card.Title>
          <Form>
            <Row className="mb-3"> 
              <Col md={3}><Form.Control name="name" placeholder="Nombre" value={filters.name} onChange={handleFilterChange} /></Col>
              <Col md={3}><Form.Control name="lastname" placeholder="Apellido" value={filters.lastname} onChange={handleFilterChange} /></Col>
              <Col md={3}><Form.Control name="saleNumber" placeholder="N° de Venta" value={filters.saleNumber} onChange={handleFilterChange} /></Col>
              <Col md={3}><Form.Control name="dni" placeholder="DNI" value={filters.dni} onChange={handleFilterChange} /></Col>
            </Row>
            <Row className="mb-3"> 
              <Col md={3}>
                <Form.Select name="date" value={filters.date} onChange={handleFilterChange}>
                  <option value="">Todas las Fechas</option>
                  <option value="today">Hoy</option>
                  <option value="lastWeek">Última Semana</option>
                  <option value="lastMonth">Último Mes</option>
                  <option value="custom">Personalizado</option>
                </Form.Select>
              </Col>
            </Row>
            {filters.date === 'custom' && (
              <Row className="mt-2">
                <Col md={3}><Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} /></Col>
                <Col md={3}><Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} /></Col>
              </Row>
            )}
            <Row className="mt-2">
                <Col>
                    <Button variant="primary" onClick={handleSearch}>Buscar</Button>{' '}
                    <Button variant="secondary" onClick={clearFilters}>Limpiar Filtros</Button>
                </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>N° de Venta</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>DNI</th>
            <th style={{ width: '210px', whiteSpace: 'nowrap' }}>N° de Teléfono</th>
            <th style={{ width: '200px', whiteSpace: 'nowrap' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(contacts || []).map(contact => (
            <tr key={contact._id}>
              <td>{new Date(contact.date).toLocaleDateString()}</td>
              <td>{contact.sales?.map(s => s.saleNumber).join(', ') || '--'}</td>
              <td>{contact.name}</td>
              <td>{contact.lastname}</td>
              <td>{contact.dni}</td>
              <td style={{ width: '210px', whiteSpace: 'nowrap' }}>{contact.phones?.map(p => p.number).join(' ') || ''}</td>
              <td className="d-flex" style={{ width: '200px', whiteSpace: 'nowrap' }}>
                <Button variant="success" className="me-1" href={`https://wa.me/549${(contact.phones || []).find(p => p.type === 'personal')?.number || (contact.phones || []).find(p => p.type === 'family')?.number || ''}`} target="_blank"><FaWhatsapp /></Button>
                <Button variant={contact.comments ? "success" : "secondary"} className="me-1" onClick={() => handleShowModal('comments', contact)}><FaComment /></Button>
                <Button variant="warning" className="me-1" onClick={() => handleShowModal('edit', contact)}><FaEdit /></Button>
                <Button variant="danger" onClick={() => handleDelete(contact._id)}><FaTrash /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination>
        {[...Array(pagination.totalPages).keys()].map(number => (
            <Pagination.Item key={number + 1} active={number + 1 === pagination.currentPage} onClick={() => setPagination({ ...pagination, currentPage: number + 1})}>
                {number + 1}
            </Pagination.Item>
        ))}
      </Pagination>

      <footer className="mt-4 text-center">
        <p>&copy; {new Date().getFullYear()} Soluciones Bucci. Todos los derechos reservados.</p>
      </footer>

      <Modal show={showConfirmDeleteModal} onHide={handleCloseConfirmDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar este contacto? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseConfirmDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{modalType === 'add' ? 'Agregar Contacto' : (modalType === 'edit' ? 'Editar Contacto' : 'Comentarios')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveChanges}>
            {modalType === 'comments' ? (
                <Form.Group className="mb-3">
                    <Form.Label>Comentarios</Form.Label>
                    <Form.Control as="textarea" rows={3} name="comments" defaultValue={currentContact?.comments} />
                </Form.Group>
            ) : (
                <>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre <span style={{color: 'red'}}>*</span></Form.Label>
                                <Form.Control name="name" defaultValue={currentContact?.name} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Apellido</Form.Label>
                                <Form.Control name="lastname" defaultValue={currentContact?.lastname} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono Personal <span style={{color: 'red'}}>*</span></Form.Label>
                                <Form.Control name="phone1" type="number" defaultValue={currentContact?.phones?.find(p=>p.type==='personal')?.number || ''} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>DNI</Form.Label>
                                <Form.Control name="dni" type="number" defaultValue={currentContact?.dni} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre del Familiar</Form.Label>
                                <Form.Control name="relativeName" defaultValue={currentContact?.phones?.find(p=>p.type==='family')?.relativeName || ''} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono Familiar</Form.Label>
                                <Form.Control name="phone2" type="number" defaultValue={currentContact?.phones?.find(p=>p.type==='family')?.number || ''} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Check 
                            type="checkbox" 
                            label="Comentarios"
                            checked={openComments}
                            onChange={(e) => setOpenComments(e.target.checked)}
                        />
                    </Form.Group>
                    <Collapse in={openComments}>
                        <div>
                            <Form.Group className="mb-3">
                                <Form.Label>Comentarios</Form.Label>
                                <Form.Control as="textarea" rows={3} name="comments" defaultValue={currentContact?.comments} />
                            </Form.Group>
                        </div>
                    </Collapse>
                    <Form.Group className="mb-3">
                        <Form.Check 
                            type="checkbox" 
                            label="Nº Venta"
                            checked={hasSale}
                            onChange={handleHasSaleChange}
                        />
                    </Form.Group>
                    <Collapse in={hasSale}>
                        <div>
                            {sales.map((sale, index) => (
                                <Row key={index} className="mb-2">
                                    <Col>
                                        <Form.Control 
                                            name="saleNumber" 
                                            placeholder="Nº de Venta" 
                                            value={sale.saleNumber} 
                                            onChange={(e) => handleSaleChange(index, e)} 
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Control 
                                            name="saleDate" 
                                            placeholder="Fecha" 
                                            value={sale.date} 
                                            onChange={(e) => handleSaleChange(index, e)} 
                                            maxLength={10}
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Button variant="danger" onClick={() => handleRemoveSale(index)}>
                                            <FaTrash />
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            <Button onClick={handleAddSale} className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', padding: '0' }}><FaPlusCircle className="plus-icon" style={{ fontSize: '20px' }} /></Button>                        </div>
                    </Collapse>
                </>
            )}
            <Button variant="primary" type="submit" className="mt-4" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Dashboard;