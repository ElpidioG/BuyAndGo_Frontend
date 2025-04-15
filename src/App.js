import './App.scss';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavbarNav from './components/Navbar';
import Slidebar from './components/Slidebar';
import Departamentos from './pages/Departamentos';
import UnidadesMedida from './pages/UnidadesMedida';
import Home from './pages/Home';
import Articulos from './pages/Articulos';
import Proveedores from './pages/Proveedores';
import OrdenCompra from './pages/OrdenCompra';
import AsientosContables from './pages/AsientosContables';
import AuthForm from './pages/AuthForm';
import { useState } from 'react';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        console.log(isLoggedIn);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        sessionStorage.removeItem('token');
    };

    const PrivateRoute = ({ element, ...rest }) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            return <Navigate to="/login" replace />;
        }

        return (
            <div className="app-container"> {/* Contenedor principal */}
                <Slidebar />
                <div className="content w-100">
                    <NavbarNav onLogout={handleLogout} />
                    {element}
                </div>
            </div>
        );
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<AuthForm onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/" element={<PrivateRoute element={<Home />} />} />
                <Route path="/departamentos" element={<PrivateRoute element={<Departamentos />} />} />
                <Route path="/unidadesMedida" element={<PrivateRoute element={<UnidadesMedida />} />} />
                <Route path="/articulos" element={<PrivateRoute element={<Articulos />} />} />
                <Route path="/proveedores" element={<PrivateRoute element={<Proveedores />} />} />
                <Route path="/ordenCompra" element={<PrivateRoute element={<OrdenCompra />} />} />
                <Route path="/AsientosContables" element={<PrivateRoute element={<AsientosContables />} />} />
            </Routes>
        </Router>
    );
}

export default App;