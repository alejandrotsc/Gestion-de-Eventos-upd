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


// CLIENTE
router.get("/mis-inscripciones", auth, requireRole("CLIENTE"), misInscripciones);

router.post("/:eventoId", auth, requireRole("CLIENTE"), inscribir);

router.delete("/:eventoId", auth, requireRole("CLIENTE"), cancelar);


// ADMIN
router.get("/evento/:eventoId", auth, requireRole("ADMIN"), inscritosPorEvento);

router.get("/exportar/excel/:eventoId", auth, requireRole("ADMIN"), exportarInscritosExcel);

router.get("/exportar/csv/:eventoId", auth, requireRole("ADMIN"), exportarInscritosCSV);


module.exports = router;