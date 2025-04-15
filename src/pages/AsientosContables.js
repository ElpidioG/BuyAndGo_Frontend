import React, { useState, useEffect, Fragment } from "react";
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from "react-bootstrap/Button";
import { Col, Container, Row } from "react-bootstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import * as FaIcons from "react-icons/fa";
const AsientosContables = () => {
    const [data, setData] = useState([]);
  

    // Filtros (sin cambios por ahora)
    const [filterDescripcion, setFilterDescripcion] = useState('');
    const [filterTipoMovimiento, setFilterTipoMovimiento] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterFechaAsiento, setFilterFechaAsiento] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL;
    useEffect(() => {
        getData();
    }, [filterDescripcion, filterTipoMovimiento, filterEstado, filterFechaAsiento]);

    const getData = () => {
        axios.get(`${apiUrl}/AsientosContables/`)
            .then((result) => {
                let filteredData = result.data;
                if (filterDescripcion) {
                    filteredData = filteredData.filter((item) =>
                        item.descripcion.toLowerCase().includes(filterDescripcion.toLowerCase())
                    );
                }
                if (filterTipoMovimiento) {
                    filteredData = filteredData.filter((item) =>
                        item.tipoMovimiento.toLowerCase() === filterTipoMovimiento.toLowerCase()
                    );
                }
                if (filterEstado !== '') {
                    filteredData = filteredData.filter((item) => item.estado === (filterEstado === 'Pendiente')); // Ajustar a string
                }
                if (filterFechaAsiento) {
                    filteredData = filteredData.filter((item) => {
                        const itemDate = new Date(item.fechaAsiento).toISOString().split('T')[0];
                        return itemDate === filterFechaAsiento;
                    });
                }
                setData(filteredData);
            })
            .catch((error) => {
                if (!error.response) {
                    toast.error('Error de red: No se pudo conectar al servidor');
                } else {
                    toast.error(`Error del servidor: ${error.response.status} - ${error.message}`);
                }
            });
    };


    const handleEnviarContabilidad = async () => {
        const asientosPendientes = data.filter(item => item.estado === true);
        if (asientosPendientes.length === 0) {
            toast.info("No hay asientos pendientes para enviar a contabilidad.");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
      
            const asientosAgrupados = asientosPendientes.reduce((acc, asiento) => {
                if (!acc[asiento.idOrdenCompra]) {
                    acc[asiento.idOrdenCompra] = [];
                }
                acc[asiento.idOrdenCompra].push(asiento);
                return acc;
            }, {});

            for (const idOrdenCompra in asientosAgrupados) {
                const asientos = asientosAgrupados[idOrdenCompra];
                await axios.post(`${apiUrl}/AsientosContables/EnviarAsientos`, asientos, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                
            }
        
            toast.success("Todos los asientos pendientes han sido enviados a contabilidad.");

            // Llamada a la API EntradaContable
           
        } catch (error){
            if (error.response) {
                console.error("Error al crear el asiento:", error.response?.data);
                // El servidor respondió con un código de estado fuera del rango 2xx
                if (error.response.status === 400) {
                    // Manejar errores de validación
                    if (error.response.data && error.response.data.errors) {
                        const errors = error.response.data.errors;
                        let errorMessage = "";
                        for (const key in errors) {
                            errorMessage += `${key}: ${errors[key].join(', ')}\n`;
                        }
                        toast.error(`Error de validación:\n${errorMessage}`);
                    } else if (error.response.data && error.response.data.title === "One or more validation errors occurred."){
                        toast.error("Error de validación: Uno o mas campos son requeridos");
                    }else{
                        toast.error(`Error al enviar asientos: ${error.response.data.message || 'Error desconocido'}`);
                    }
                } else {
                    toast.error(`Error al enviar asientos: ${error.response.data.message || 'Error desconocido'}`);
                }
            } else if (error.request) {
                // La solicitud fue hecha, pero no se recibió respuesta
                toast.error("No se recibió respuesta del servidor.");
            } else {
                // Algo sucedió en la configuración de la solicitud que desencadenó un error
                toast.error(`Error de red: ${error.message}`);
            }
        }

        getData();
    };

    return (
        <Fragment>
            <ToastContainer />
            <Container className="py-4">
                <Row className="align-items-center mb-4">
                    <Col>
                        <h3 className="text-primary"><FaIcons.FaBook className="me-2" /> Entradas Contables Creadas</h3>
                    </Col>
                </Row>

                {/* Filtros */}
                <Row className="mb-4">
                    <Col md={3}>
                        <label>Descripción:</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrar por descripción"
                            value={filterDescripcion}
                            onChange={(e) => setFilterDescripcion(e.target.value)}
                        />
                    </Col>
                    <Col md={3}>
                        <label>Tipo Movimiento:</label>
                        <select
                            className="form-control"
                            value={filterTipoMovimiento}
                            onChange={(e) => setFilterTipoMovimiento(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="DB">DB</option>
                            <option value="CR">CR</option>
                        </select>
                    </Col>
                    <Col md={3}>
                        <label>Estado:</label>
                        <select
                            className="form-control"
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Enviado">Enviado</option>
                        </select>
                    </Col>
                    <Col md={3}>
                        <label>Fecha Asiento:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filterFechaAsiento}
                            onChange={(e) => setFilterFechaAsiento(e.target.value)}
                        />
                    </Col>
                </Row>

                <Row className="mb-4">
                    <Col>
                        <Button variant="primary" onClick={handleEnviarContabilidad}>
                            Enviar Todos a Contabilidad
                        </Button>
                    </Col>
                </Row>

                <Table striped bordered hover responsive className="shadow-sm">
                    <thead className="bg-light">
                        <tr>
                            <th>#</th>                         
                            <th>Orden de Compra</th>
                            <th>Descripción</th>
                            <th>Cuenta Contable</th>
                            <th>Tipo Movimiento</th>
                            <th>Fecha Asiento</th>
                            <th>Monto</th>
                            <th>Estado</th>
                           
                        </tr>
                    </thead>
                    <tbody className='table-group-divider'>
                        {data && data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.id}</td>
                                    <td>{item.idOrdenCompra}</td>
                                    <td>{item.descripcion}</td>
                                 
                                    <td>{item.cuentaContable}</td>
                                    <td>{item.tipoMovimiento}</td>
                                    <td>{new Date(item.fechaAsiento).toLocaleDateString()}</td>
                                    <td>{item.monto}</td>
                                    <td>{item.estado ? "Pendiente" : "Enviado"}</td>
                                 
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center">Cargando...</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Container>
        </Fragment>
    );
};

export default AsientosContables;