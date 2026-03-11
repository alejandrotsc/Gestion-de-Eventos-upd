const router = require("express").Router();
const { auth, requireRole } = require("../middleware/auth");
const {
  crearEvento,
  listarEventos,
  obtenerEvento,
  actualizarEvento,
  eliminarEvento,
} = require("../controllers/eventos.controller");

/**
 * @swagger
 * tags:
 *   name: Eventos
 *   description: Gestión de eventos (CRUD)
 * 
 * /api/eventos:
 *   get:
 *     summary: Obtener todos los eventos públicos
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Lista de eventos
 *   post:
 *     summary: Crear un nuevo evento (Solo ADMIN)
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *               cupo:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Evento creado
 * 
 * /api/eventos/{id}:
 *   delete:
 *     summary: Eliminar un evento (Solo ADMIN)
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evento eliminado
 */

// Público
router.get("/", listarEventos);
router.get("/:id", obtenerEvento);

// ADMIN
router.post("/", auth, requireRole("ADMIN"), crearEvento);
router.put("/:id", auth, requireRole("ADMIN"), actualizarEvento);
router.delete("/:id", auth, requireRole("ADMIN"), eliminarEvento);

module.exports = router;
