const router = require("express").Router();
const { auth, requireRole } = require("../middleware/auth");
const { dashboard } = require("../controllers/admin.controller");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Rutas exclusivas de administración
 * 
 * /api/admin/dashboard:
 *   get:
 *     summary: Obtener estadísticas para el Dashboard (Solo ADMIN)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales del sistema (KPIs)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */

router.get("/dashboard", auth, requireRole("ADMIN"), dashboard);

module.exports = router;
