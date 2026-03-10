const router = require("express").Router();
const { auth, requireRole } = require("../middleware/auth");
const {
  crearRecurso, listarRecursos, actualizarRecurso, eliminarRecurso,
  asignarRecursoEvento, recursosDeEvento
} = require("../controllers/recursos.controller");

/**
 * @swagger
 * tags:
 *   name: Recursos
 *   description: Gestión de inventario y recursos físicos
 * 
 * /api/recursos:
 *   get:
 *     summary: Listar todos los recursos (Solo ADMIN)
 *     tags: [Recursos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de recursos
 *   post:
 *     summary: Crear un nuevo recurso (Solo ADMIN)
 *     tags: [Recursos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recurso creado
 * 
 * /api/recursos/{id}:
 *   delete:
 *     summary: Eliminar un recurso (Solo ADMIN)
 *     tags: [Recursos]
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
 *         description: Recurso eliminado
 * 
 * /api/recursos/evento/{eventoId}:
 *   post:
 *     summary: Asignar un recurso a un evento (Solo ADMIN)
 *     tags: [Recursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Recurso asignado al evento
 *   get:
 *     summary: Listar recursos asignados a un evento
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de recursos del evento
 */

// ADMIN recursos
router.get("/", auth, requireRole("ADMIN"), listarRecursos);
router.post("/", auth, requireRole("ADMIN"), crearRecurso);
router.put("/:id", auth, requireRole("ADMIN"), actualizarRecurso);
router.delete("/:id", auth, requireRole("ADMIN"), eliminarRecurso);

// ADMIN asignar a evento
router.post("/evento/:eventoId", auth, requireRole("ADMIN"), asignarRecursoEvento);
router.get("/evento/:eventoId", auth, recursosDeEvento);

module.exports = router;
