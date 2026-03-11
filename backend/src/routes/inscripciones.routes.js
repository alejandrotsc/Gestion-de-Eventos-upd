const router = require("express").Router();
const { auth, requireRole } = require("../middleware/auth");

const {
  inscribir,
  cancelar,
  misInscripciones,
  inscritosPorEvento,
  exportarInscritosExcel,
  exportarInscritosCSV
} = require("../controllers/inscripciones.controller");

/**
 * @swagger
 * tags:
 *   name: Inscripciones
 *   description: Gestión de inscripciones a eventos
 * 
 * /api/inscripciones/mis-inscripciones:
 *   get:
 *     summary: Obtener las inscripciones del usuario actual (Solo CLIENTE)
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de inscripciones del usuario
 * 
 * /api/inscripciones/{eventoId}:
 *   post:
 *     summary: Inscribirse a un evento (Solo CLIENTE)
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Inscripción exitosa
 *       400:
 *         description: Cupo lleno o evento inactivo
 *   delete:
 *     summary: Cancelar inscripción a un evento (Solo CLIENTE)
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inscripción cancelada
 * 
 * /api/inscripciones/evento/{eventoId}:
 *   get:
 *     summary: Ver usuarios inscritos en un evento (Solo ADMIN)
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de usuarios inscritos
 */


// CLIENTE
router.get("/mis-inscripciones", auth, requireRole("CLIENTE"), misInscripciones);

router.post("/:eventoId", auth, requireRole("CLIENTE"), inscribir);

router.delete("/:eventoId", auth, requireRole("CLIENTE"), cancelar);


// ADMIN
router.get("/evento/:eventoId", auth, requireRole("ADMIN"), inscritosPorEvento);

router.get("/exportar/excel/:eventoId", auth, requireRole("ADMIN"), exportarInscritosExcel);

router.get("/exportar/csv/:eventoId", auth, requireRole("ADMIN"), exportarInscritosCSV);


module.exports = router;