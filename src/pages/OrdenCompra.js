import React, { useState, useEffect, Fragment } from "react";
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { Col, Container, Row } from "react-bootstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import "bootstrap-icons/font/bootstrap-icons.css";
import * as FaIcons from "react-icons/fa";

const OrdenCompra = () => {


  // Estados para listado y modales
  const [data, setData] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const [asientoCreadoParaOrden, setAsientoCreadoParaOrden] = useState([]);
  //Filtros

  const [filterFecha, setFilterFecha] = useState('');
const [filterProveedor, setFilterProveedor] = useState('');
const [filterEstado, setFilterEstado] = useState('');

const filteredData = data.filter(item => {
  const matchesFecha = filterFecha ? item.fecha.includes(filterFecha) : true;
  const matchesProveedor = filterProveedor ? item.proveedorNombre.includes(filterProveedor) : true;
  const matchesEstado = filterEstado ? item.estado.toString() === filterEstado : true;
  
  return matchesFecha && matchesProveedor && matchesEstado;
});

  // Estados para crear orden
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); // Establecer la fecha actual como valor por defecto
  const [idProveedor, setIdProveedor] = useState('');
  const [estado, setEstado] = useState('true'); // como string para el select
  const [proveedores, setProveedores] = useState([]);
const [articulos, setArticulos] = useState([]);
const [unidadesMedida, setUnidadesMedida] = useState([]);
  // Estado para detalles de la orden en creación
  const [detalles, setDetalles] = useState([]);
  // Estados para los inputs de un nuevo detalle
  const [newDetalleArticulo, setNewDetalleArticulo] = useState('');
  const [newDetalleCantidad, setNewDetalleCantidad] = useState('');
  const [newDetalleUnidadMedida, setNewDetalleUnidadMedida] = useState('');
  const [newDetalleCostoUnitario, setNewDetalleCostoUnitario] = useState('');

  // Estados para editar (solo datos de orden, sin detalle)
  const [editId, setEditId] = useState(null);

  const [detallesEliminados, setDetallesEliminados] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;
  useEffect(() => {

    getData();
    getProveedores();
  getArticulos();
  getUnidadesMedida();
  }, []);

  

  const getProveedores = () => {
    axios.get(`${apiUrl}/Proveedores`)
      .then(response => setProveedores(response.data))
      .catch(() => toast.error("Error al obtener proveedores"));

  };
  
  const getArticulos = () => {
    axios.get(`${apiUrl}/Articulos`)
      .then(response => setArticulos(response.data))
      .catch(() => toast.error("Error al obtener artículos"));
  };
  
  const getUnidadesMedida = () => {
    axios.get(`${apiUrl}/UnidadesMedidas`)
      .then(response => setUnidadesMedida(response.data))
      .catch(() => toast.error("Error al obtener unidades de medida"));
  };

  // Obtener listado de órdenes
  const getData = async () => {
    try {
      const result = await axios.get(`${apiUrl}/OrdenCompras/`);
      setData(result.data);
      // Al cargar las órdenes, también verificamos si tienen asientos creados
      result.data.forEach(orden => {
        verificarAsientoExistente(orden.id);
      });
    } catch (error) {
      toast.error("Error al obtener las órdenes de compra");
    }
  };


  const verificarAsientoExistente = async (idOrdenCompra) => {
    try {
      // Ajusta la URL de tu API para verificar si existe un asiento para la orden
      const response = await axios.get(`${apiUrl}/AsientosContables/orden/${idOrdenCompra}`);
      // Si la respuesta es exitosa (status 200) y contiene datos, asumimos que existe un asiento
      if (response.status === 200 && response.data.length > 0) {
        setAsientoCreadoParaOrden(prev => [...prev, idOrdenCompra]);
      } else if (response.status === 204) {
        // 204 No Content significa que no se encontraron asientos para esta orden
        setAsientoCreadoParaOrden(prev => prev.filter(id => id !== idOrdenCompra));
      }
    } catch (error) {
      console.error("Error al verificar el asiento contable:", error);
      // En caso de error, no marcamos la orden como con asiento creado para permitir reintentar
    }
  };

  // Función para agregar un detalle a la orden en creación
  const addDetalle = () => {
    if (
      newDetalleArticulo === '' ||
      newDetalleCantidad === '' ||
      newDetalleUnidadMedida === '' ||
      newDetalleCostoUnitario === ''
    ) {
      toast.error("Debe llenar todos los campos del detalle");
      return;
    }
    const cantidad = parseFloat(newDetalleCantidad);
    const costoUnitario = parseFloat(newDetalleCostoUnitario);
    const costoTotal = parseFloat(cantidad * costoUnitario);
    const nuevoDetalle = {
      idArticulo: parseInt(newDetalleArticulo, 10),
      cantidad,
      idUnidadMedida: parseInt(newDetalleUnidadMedida, 10),
      costoUnitario,
      costoTotal
    };
    setDetalles([...detalles, nuevoDetalle]);
    // Limpiar inputs del detalle
    setNewDetalleArticulo('');
    setNewDetalleCantidad('');
    setNewDetalleUnidadMedida('');
    setNewDetalleCostoUnitario('');
  };

  const handleSave = () => {

    let proveedorIdParaEnviar = idProveedor;
    console.log("el que es va a enviar: ", proveedorIdParaEnviar )

    if (editId && !idProveedor && selectedOrder && selectedOrder.proveedor) {
        proveedorIdParaEnviar = selectedOrder.proveedor.id;
        console.log("el que se debe enviar si no modifica: ", proveedorIdParaEnviar )
    }

    if (!proveedorIdParaEnviar) {
        toast.error("Por favor, selecciona un proveedor.");
        return;
    }

    if (detalles.length === 0) {
      toast.error("Por favor, agrega al menos un detalle.");
      return;
    }
  
    // Establecer la fecha actual
    const fechaHoy = new Date().toISOString(); // Fecha de hoy
  
    // Preparación de los datos para la orden de compra
    const orderData = {
      fecha: fechaHoy,
      idProveedor: parseInt(proveedorIdParaEnviar, 10),
      Estado: estado === "true",
    };
  
    if (editId) {
      console.log("Estos son los detalles que se van a eliminar: ", detallesEliminados);

      // Actualizar datos de la orden
      const orderData = {
          id: editId,
          fecha: fecha, // Usar el estado fecha
          idProveedor: parseInt(idProveedor, 10), // Usar el estado idProveedor
          estado: estado === "true" // Usar el estado estado
      };

      axios.put(`${apiUrl}/OrdenCompras/${editId}`, orderData)
          .then(() => {
              // Eliminar detalles eliminados de la base de datos
              Promise.all(detallesEliminados.map(idDetalleEliminado => {
                  return axios.delete(`${apiUrl}/DetalleOrdenCompras/${idDetalleEliminado}`);
              }))
              .then(() => {
                  // Limpiar el array detallesEliminados después de la eliminación
                  setDetallesEliminados([]);

                  // Agregar nuevos detalles
                  const nuevosDetalles = detalles.filter(detalle => !detalle.id);
                  Promise.all(nuevosDetalles.map(detalle => {
                      const detalleParaEnviar = {
                          idOrdenCompra: editId,
                          idArticulo: detalle.idArticulo,
                          cantidad: detalle.cantidad,
                          idUnidadMedida: detalle.idUnidadMedida,
                          costoTotal: detalle.costoTotal
                      };
                      return axios.post(`${apiUrl}/DetalleOrdenCompras/`, [detalleParaEnviar]);
                  }))
                  .then(() => {
                      // Continuar con la actualización de la orden y los detalles restantes
                      toast.success("Orden y detalles actualizados exitosamente");
                      setShowCreateModal(false);
                      getData();
                  })
                  .catch((error) => {
                      console.error("Error al guardar detalles:", error);
                      toast.error("Error al guardar detalles");
                  });
              })
              .catch((error) => {
                  console.error("Error al eliminar detalles:", error);
                  toast.error("Error al eliminar detalles");
              });
          })
          .catch((error) => {
              console.error("Error al actualizar la orden:", error);
              toast.error("Error al actualizar la orden");
          });
  }else {
      // Crear una nueva orden de compra
      axios.post(`${apiUrl}/OrdenCompras/`, orderData)
          .then((response) => {
              const ordenCompraId = response.data.id;

              // Crear los detalles de la orden de compra
              const detallesConOrdenId = detalles.map(d => ({
                  idOrdenCompra: ordenCompraId,
                  idArticulo: d.idArticulo,
                  idUnidadMedida: d.idUnidadMedida,
                  cantidad: d.cantidad,
                  costoTotal: d.costoTotal
              }));

              console.log("Detalles a enviar:", detallesConOrdenId);

              axios.post(`${apiUrl}/DetalleOrdenCompras/`, detallesConOrdenId)
                  .then(() => {
                      toast.success("Orden y detalles guardados exitosamente");
                      setShowCreateModal(false);
                      getData();
                  })
                  .catch((error) => {
                      console.error("Error al guardar detalles:", error);
                      toast.error("Error al guardar detalles");
                  });

          })
          .catch((error) => {
              console.error("Error al crear la orden de compra:", error);
              toast.error("Error al crear la orden de compra");
          });
  }};
  const formattedDate = fecha.split('T')[0]; 


const handleDelete = (id) => {
  console.log("ID que se está enviando:", id);  // Verificar que el ID sea correcto
  Swal.fire({
    title: '¿Estás seguro?',
    text: "¡No podrás revertir esto!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
      const url = `${apiUrl}/OrdenCompras/${id}`;
      axios.delete(url)
        .then(() => {
          getData();
          toast.success("Orden de compra eliminada exitosamente");
        })
        .catch(() => {
          toast.error("Error al eliminar la orden de compra");
        });
    }
  });
};

  // Mostrar los detalles de una orden (se asume que el endpoint GET /api/OrdenCompras/{id} devuelve también los detalles)
  const viewDetails = (idOrdenCompra) => {
    axios.get(`${apiUrl}/DetalleOrdenCompras/Orden/${idOrdenCompra}`)
      .then((result) => {
        setDetailOrder({ ...detailOrder, detallesOrden: result.data });
        setShowDetailModal(true);
       
      })
      .catch(() => {
        toast.error("No se encontraron detalles para esta orden");
      });
  
  };



  // Limpiar el formulario de creación
  const clearForm = () => {
   
    setIdProveedor('');
    setEstado('true');
    setDetalles([]);
    setNewDetalleArticulo('');
    setNewDetalleCantidad('');
    setNewDetalleUnidadMedida('');
    setNewDetalleCostoUnitario('');
  };

  const openCreateModal = () => {
    clearForm();
    setEditId(null);
    setShowCreateModal(true);
    

  };

  const GetDataFromOrder = (idOrdenCompra) => {
    axios.get(`${apiUrl}/OrdenCompras/${idOrdenCompra}`)
      .then((result) => {
        setSelectedOrder(result.data)
        
        // Since we are already fetching the order details directly in handleEdit, 
        // this function is only useful if you want to process something with the result later
        // (such as populating selectedOrder or further data processing).
      
      })
      .catch(() => {
        toast.error("Error al obtener la orden de compra");
      });
  };

  const handleEdit = (id) => {
    GetDataFromOrder(id);
    setEditId(id);
  
    const orden = data.find((item) => item.id === id);
    if (orden) {
      // Establecer la fecha actual
      setFecha(new Date().toISOString().split('T')[0]);
  
      // Buscar el proveedor por nombre
      const proveedor = proveedores.find((p) => p.nombreComercial === orden.proveedorNombre);
      if (proveedor) {
        setIdProveedor(proveedor.id);
      } else {
        console.error("No se encontró el proveedor con nombre:", orden.proveedorNombre);
      }
      console.log("al momento de abrir: ", proveedor.id);
      setEstado(orden.estado.toString());
      setDetalles(orden.detalles || []);
  
      axios.get(`${apiUrl}/DetalleOrdenCompras/Orden/${id}`)
        .then((result) => {
          // Verificar los datos recibidos de la API
          console.log("Detalles recibidos de la API:", result.data);
  
          // Asegurarse de que cada detalle tenga un idArticulo
          const detallesConIdArticulo = result.data.map(detalle => ({
            ...detalle,
            idArticulo: detalle.idArticulo // Asegurar que idArticulo está presente
          }));
          setDetalles(detallesConIdArticulo);
        })
        .catch(() => {
          toast.error("Error al obtener los detalles de la orden");
        });
  
      setShowCreateModal(true);
    }
  };
  
  const handleDetalleChange = (index, field, value) => {
    const updatedDetalles = [...detalles];
  
    if (field === 'idArticulo') {
      updatedDetalles[index].idArticulo = parseInt(value, 10); // Actualizar con el ID del artículo
    } else if (field === 'idUnidadMedida') {
      // ... (tu código existente)
    } else {
      updatedDetalles[index][field] = value;
    }
  
    if (field === 'cantidad' || field === 'costoUnitario') {
      updatedDetalles[index].costoTotal = updatedDetalles[index].cantidad * updatedDetalles[index].costoUnitario;
    }
  
    setDetalles(updatedDetalles);
  };
const handleDeleteDetalle = (index, id) => {
  const updatedDetalles = detalles.filter((_, i) => i !== index);
  setDetalles(updatedDetalles);
  if (id) {
    setDetallesEliminados([...detallesEliminados, id]);
  }
};let proveedorSelected = "";

if (editId && selectedOrder && selectedOrder.proveedor && selectedOrder.proveedor.id) {
    proveedorSelected = selectedOrder.proveedor.id.toString();
}

  const handleArticuloSeleccionado = (idArticulo) => {
    setNewDetalleArticulo(idArticulo);
  
    const articulo = articulos.find(a => a.id === parseInt(idArticulo));
    if (articulo) {
      setNewDetalleUnidadMedida(articulo.idUnidadMedidas || '');
      setNewDetalleCostoUnitario(articulo.costoUnitario || '');
    } else {
      setNewDetalleUnidadMedida('');
      setNewDetalleCostoUnitario('');
    }
  };
  const handleCrearAsiento = async (idOrdenCompra) => {
    try {
      const response = await axios.post(`${apiUrl}/OrdenCompras/${idOrdenCompra}/asiento`);
  
      if (response.status === 200) {
        toast.warn('Asiento contable creado exitosamente. La orden no podrá ser eliminada.');
        setAsientoCreadoParaOrden(prev => [...prev, idOrdenCompra]); // Agregar el ID al estado
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Ya existe un asiento contable para esta orden. La orden no podrá ser eliminada.');
        setAsientoCreadoParaOrden(prev => [...prev, idOrdenCompra]); // También marcar como creado si ya existe
      } else {
        toast.error('Error al crear el asiento contable.');
      }
    }
  };
  return (
    <Fragment>
      <ToastContainer />
      <Container className="py-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h3 className="text-primary">
              <FaIcons.FaFileInvoiceDollar className="me-2" /> Gestión de Órdenes de Compra
            </h3>
          </Col>
          <Col className="text-end">
          <button className="btn btn-outline-primary" onClick={openCreateModal}>
  <i className="bi bi-plus-circle"></i> Nueva Orden
</button>
          </Col>
        </Row>
        <div className="mb-3 row">
  <div className="col-md-4">
    <label>Filtrar por Fecha:</label>
    <input 
      type="date" 
      className="form-control"
      value={filterFecha} 
      onChange={(e) => setFilterFecha(e.target.value)} 
    />
  </div>

  <div className="col-md-4">
        <label>Filtrar por Proveedor:</label>
        <select 
          className="form-control" 
          value={filterProveedor}
          onChange={(e) => setFilterProveedor(e.target.value)}
        >
          <option value="">Seleccionar Proveedor</option>
          {proveedores.map((proveedor) => (
            <option key={proveedor.id} value={proveedor.nombreComercial}>
              {proveedor.nombreComercial}  {/* Ajusta el campo 'nombre' al que corresponda en tu API */}
            </option>
          ))}
        </select>
      </div>

  <div className="col-md-4">
    <label>Filtrar por Estado:</label>
    <select 
      className="form-control" 
      value={filterEstado}
      onChange={(e) => setFilterEstado(e.target.value)}
    >
      <option value="">Seleccionar Estado</option>
      <option value="true">Activo</option>
      <option value="false">Inactivo</option>
    </select>
  </div>
</div>

        <Table striped bordered hover responsive>
  <thead>
    <tr>
      <th>#</th>
      <th>Fecha</th>
      <th>Proveedor</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {filteredData.length > 0 ? (
      filteredData.map((item) => (
        <tr key={item.id}>
          <td>{item.id}</td>
          <td>{item.fecha}</td>
          <td>{item.proveedorNombre}</td>
          <td>{item.estado ? "Activo" : "Inactivo"}</td>
          <td>
          <button
  className="btn btn-success me-2"
  onClick={() => handleCrearAsiento(item.id)}
  disabled={asientoCreadoParaOrden.includes(item.id) || !item.estado}
  style={asientoCreadoParaOrden.includes(item.id) || !item.estado ? { backgroundColor: 'gray', borderColor: 'darkgray', color: 'lightgray', cursor: 'not-allowed' } : {}}
>
  <i className="bi bi-plus"></i>  Crear entradas
</button>

            <button className="btn btn-info me-2" onClick={() => viewDetails(item.id)}>
              <i className="bi bi-eye"></i> Ver Detalles
            </button>
           <button
             disabled={asientoCreadoParaOrden.includes(item.id)}
           className="btn btn-warning me-2" onClick={() => {
            // eslint-disable-next-line no-self-compare
    const orden = data.find((item) => item.id === item.id);
    if (orden && orden.idProveedor !== undefined && orden.idProveedor !== null) {
        setIdProveedor(orden.idProveedor.toString()); // Establece el idProveedor antes de abrir el modal
        handleEdit(item.id);
    } else {
        console.error("orden.idProveedor es undefined o null");
        handleEdit(item.id);
    }
}}>
    <i className="bi bi-pencil"></i> Editar
</button>
            <button
              disabled={asientoCreadoParaOrden.includes(item.id)}
            className="btn btn-danger" onClick={() => handleDelete(item.id)}>
              <i className="bi bi-trash"></i> Eliminar
            </button>
         
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="5" className="text-center">No se encontraron resultados</td>
      </tr>
    )}
  </tbody>
</Table>
      </Container>{/* Modal de Crear / Editar Orden */}
<Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>{editId ? "Editar Orden de Compra" : "Crear Orden de Compra"}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {/* Fecha */}
    <div className="mb-3">
      <label>Fecha:</label>
      <input 
        type="date" 
        className="form-control" 
       disabled
        value={formattedDate} 
        onChange={(e) => setFecha(e.target.value)} 
      />
    </div>

    {/* Proveedor */}
    <div className="mb-3">
  <label>Proveedor:</label>
  <select
    className="form-control"
    value={idProveedor || proveedorSelected} // Usa idProveedor si está definido, si no, usa proveedorSelected
    onChange={(e) => setIdProveedor(e.target.value)}
>

  {console.log("El proveedor seleccionado es: ",  proveedorSelected)}
    <option value="">Seleccione un proveedor</option>
    {proveedores.map(proveedor => (
      <option key={proveedor.id} value={proveedor.id}>
        {proveedor.nombreComercial}
      </option>
    ))}
  </select>
</div>

    {/* Estado */}
    <div className="mb-3">
      <label>Estado:</label>
      <select 
        className="form-control" 
        value={estado} 
        onChange={(e) => setEstado(e.target.value)}
      >
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </select>
    </div>

    {/* Sección de detalles de la orden */}
    <h5>Detalles de Orden</h5>
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Artículo</th>
          <th>Cantidad</th>
          <th>Unidad de Medida</th>
          <th>Costo Unitario</th>
          <th>Costo Total</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>

        {detalles.length > 0 ? (
          detalles.map((detalle, index) => (
            
            <tr key={index}>
              {/* Cargar descripción del artículo */}

              <td>
              <select
  className="form-control"
  value={articulos.find(articulo => articulo.descripcion === detalle.articulo)?.id || detalle.idArticulo} // Usar detalle.idArticulo como value
  disabled
  onChange={(e) => handleDetalleChange(index, 'idArticulo', e.target.value)}
>
  {articulos.map(articulo => (
    <option key={articulo.id} value={articulo.id}>
      {articulo.descripcion}
    </option>
  ))}
</select>
              </td>

              {/* Otros campos del detalle */}
              <td>
                <input 
                readOnly
                  type="number" 
                  className="form-control" 
                  value={detalle.cantidad} 
                 
                  onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)} 
                />
              </td>


             
              <td>
  <select
  disabled
    className="form-control"
    value={
      unidadesMedida.find(unidad => unidad.descripcion === detalle.unidadMedida)?.id || detalle.idUnidadMedida
    } // Si existe detalle.unidadMedida, usa su id, si no, usa detalle.idUnidadMedida
    onChange={(e) => handleDetalleChange(index, 'idUnidadMedida', e.target.value)} // Cuando cambia, actualiza el estado
  >
    {unidadesMedida.map(unidad => (
      <option key={unidad.id} value={unidad.id}>
        {unidad.descripcion}
      </option>
    ))}
  </select>
</td>
           
              <td>
                
                <input 
                  readOnly
                  type="number" 
                  className="form-control" 
                  value={detalle.costoUnitario} 
                  onChange={(e) => handleDetalleChange(index, 'costoUnitario', e.target.value)} 
                />
              </td>
              <td>{detalle.costoTotal}</td>
              <td>
              <button className="btn btn-danger" onClick={() => handleDeleteDetalle(index, detalle.id)}>
  Eliminar
</button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center">No se han agregado detalles</td>
          </tr>
        )}
      </tbody>
    </Table>

    {/* Sección para agregar nuevos detalles */}
    <div className="row">
  <div className="col-md-4 mb-3">
    <label>Artículo:</label>
    <select 
      className="form-control" 
      value={newDetalleArticulo} 
      onChange={(e) => handleArticuloSeleccionado(e.target.value)}
    >

      <option value="">Seleccione un artículo</option>
      {articulos.map((a) => (
        <option key={a.id} value={a.id}>{a.descripcion}</option>
      ))}
    </select>
  </div>

  <div className="col-md-2 mb-3">
    <label>Cantidad:</label>
    <input 
     min={1}
      type="number" 
      className="form-control" 
      value={newDetalleCantidad} 
      onChange={(e) => setNewDetalleCantidad(e.target.value)} 
    />
  </div>

  <div className="col-md-3 mb-3">
    <label>Unidad de Medida:</label>
    <input 
      type="text" 
      className="form-control" 
      value={
        unidadesMedida.find(u => u.id === parseInt(newDetalleUnidadMedida))?.descripcion || ''
      }
      disabled
    />
  </div>

  <div className="col-md-3 mb-3">
    <label>Costo Unitario:</label>
    <input 
      type="number" 
      className="form-control" 
      value={newDetalleCostoUnitario} 
      disabled 
    />
  </div>
  <div className="col-auto">
        <button className="btn btn-success" onClick={addDetalle}>
          Agregar Detalle
        </button>
      </div>
</div>




  </Modal.Body>
  <Modal.Footer>

  
    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
      Cerrar
    </Button>
    <Button variant="primary" onClick={() => {
    if (!idProveedor && proveedorSelected) {
      
        setIdProveedor(proveedorSelected); // Actualiza el estado directamente
        console.log("este es el id que se manda: ", idProveedor);
        handleSave(); // Llama a handleSave después de actualizar el estado
    } else {
        handleSave();
    }
}}>
    {editId ? "Actualizar Orden" : "Guardar Orden"}
</Button>
  </Modal.Footer>
</Modal>




      {/* Modal para mostrar detalles de una orden existente */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles de la Orden</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailOrder ? (
            <div>
              {detailOrder?.detallesOrden?.length > 0 ? (
  detailOrder.detallesOrden.map((detalle, index) => (
    <Table striped bordered hover responsive>
            <thead>
            <tr>
        <th>Artículo</th>
        <th>Cantidad</th>
        <th>Unidad de Medida</th>
        <th>Costo Unitario</th>
        <th>Costo Total</th>
      </tr>
  
    </thead>
    <tbody>
    <tr key={index}>
      <td>{detalle.articulo}</td>
      <td>{detalle.cantidad}</td>
      <td>{detalle.unidadMedida}</td>
      <td>{detalle.costoUnitario}</td>
      <td>{detalle.costoTotal}</td>
    </tr>
   
      
    </tbody>
  </Table>
  ))
) : (
  <p>No hay detalles disponibles.</p>
)}
            </div>
          ) : (
            <p>Cargando detalles...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  );
};

export default OrdenCompra;