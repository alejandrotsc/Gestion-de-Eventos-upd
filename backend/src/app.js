const express = require("express");
const cors = require("cors");
const morgan = require("morgan"); 
const rateLimit = require("express-rate-limit"); 
const swaggerUi = require("swagger-ui-express"); 
const swaggerJsDoc = require("swagger-jsdoc");

const authRoutes = require("./routes/auth.routes");
const eventosRoutes = require("./routes/eventos.routes");
const inscripcionesRoutes = require("./routes/inscripciones.routes");
const adminRoutes = require("./routes/admin.routes");
const recursosRoutes = require("./routes/recursos.routes");

const app = express();

//SEGURIDAD: Limitar peticiones (Rate Limiting) para evitar ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { ok: false, msg: "Demasiadas peticiones desde esta IP, intenta más tarde." }
});

// MIDDLEWARES GLOBALES
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/", limiter); 

//CONFIGURACIÓN DE SWAGGER (Documentación)
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Gestión de Eventos",
      version: "1.0.0",
      description: "Documentación interactiva de la API REST - Grupo 4",
    },
    servers:[
      { url: "http://localhost:3000", description: "Servidor Local" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); 

//RUTAS DE LA API
app.get("/", (req, res) => res.json({ ok: true, msg: "API Gestión de Eventos" }));

app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/inscripciones", inscripcionesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recursos", recursosRoutes);

//MANEJO DE RUTAS INEXISTENTES (404)
app.use((req, res) => res.status(404).json({ ok: false, msg: "Ruta no encontrada" }));

module.exports = app;