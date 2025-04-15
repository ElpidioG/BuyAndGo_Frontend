const express = require("express");
const path = require("path");
const app = express();

// Middleware para servir archivos estáticos desde la carpeta 'build'
app.use(express.static(path.join(__dirname, "build")));

// Redirige todas las rutas al index.html para que React maneje el enrutamiento
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Usa el puerto que Azure proporciona o por defecto el 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor React corriendo en puerto ${PORT}`);
});