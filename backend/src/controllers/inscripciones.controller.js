const pool = require("../config/db");
const ExcelJS = require("exceljs");
const { Parser } = require("json2csv");

// =============================
// INSCRIBIR
// =============================
async function inscribir(req, res) {
  const eventoId = Number(req.params.eventoId);
  const userId = req.user.id;

  try {
    const [evRows] = await pool.query(
      "SELECT id, cupo, estado FROM eventos WHERE id=?",
      [eventoId]
    );

    if (evRows.length === 0)
      return res.status(404).json({ ok: false, msg: "Evento no existe" });

    const evento = evRows[0];
    if (evento.estado !== "ACTIVO")
      return res.status(400).json({ ok: false, msg: "Evento no está activo" });

    const [insRows] = await pool.query(
      "SELECT id, estado FROM inscripciones WHERE user_id=? AND evento_id=?",
      [userId, eventoId]
    );

    if (insRows.length > 0) {
      if (insRows[0].estado === "CANCELADA") {
        const [[{ usados }]] = await pool.query(
          "SELECT COUNT(*) AS usados FROM inscripciones WHERE evento_id=? AND estado='ACTIVA'",
          [eventoId]
        );

        if (usados >= evento.cupo)
          return res.status(400).json({ ok: false, msg: "Cupo lleno" });

        await pool.query(
          "UPDATE inscripciones SET estado='ACTIVA' WHERE id=?",
          [insRows[0].id]
        );

        return res.json({ ok: true, msg: "Inscripción reactivada" });
      }
      return res.status(409).json({ ok: false, msg: "Ya estás inscrito" });
    }

    const [[{ usados }]] = await pool.query(
      "SELECT COUNT(*) AS usados FROM inscripciones WHERE evento_id=? AND estado='ACTIVA'",
      [eventoId]
    );

    if (evento.cupo > 0 && usados >= evento.cupo)
      return res.status(400).json({ ok: false, msg: "Cupo lleno" });

    await pool.query(
      "INSERT INTO inscripciones (user_id, evento_id, estado) VALUES (?,?, 'ACTIVA')",
      [userId, eventoId]
    );

    return res.status(201).json({ ok: true, msg: "Inscrito correctamente" });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error al inscribir", error: err.message });
  }
}

// =============================
// CANCELAR
// =============================
async function cancelar(req, res) {
  const eventoId = Number(req.params.eventoId);
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      "SELECT id FROM inscripciones WHERE user_id=? AND evento_id=?",
      [userId, eventoId]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, msg: "No estás inscrito" });

    await pool.query(
      "UPDATE inscripciones SET estado='CANCELADA' WHERE user_id=? AND evento_id=?",
      [userId, eventoId]
    );

    return res.json({ ok: true, msg: "Inscripción cancelada" });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error cancelando", error: err.message });
  }
}

// =============================
// MIS INSCRIPCIONES
// =============================
async function misInscripciones(req, res) {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT i.id,i.estado,i.created_at,
              e.id AS evento_id,e.titulo,e.ubicacion,e.fecha_inicio,e.fecha_fin
       FROM inscripciones i
       INNER JOIN eventos e ON e.id=i.evento_id
       WHERE i.user_id=?
       ORDER BY i.created_at DESC`,
      [userId]
    );

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error listando inscripciones", error: err.message });
  }
}

// =============================
// INSCRITOS POR EVENTO
// =============================
async function inscritosPorEvento(req, res) {
  const eventoId = Number(req.params.eventoId);

  try {
    const [rows] = await pool.query(
      `SELECT i.id,i.estado,i.created_at,
              u.id AS user_id,u.nombre,u.email
       FROM inscripciones i
       INNER JOIN users u ON u.id=i.user_id
       WHERE i.evento_id=?
       ORDER BY i.created_at ASC`,
      [eventoId]
    );

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error listando inscritos", error: err.message });
  }
}

// =============================
// EXPORTAR A EXCEL
// =============================
async function exportarInscritosExcel(req, res) {
  const eventoId = Number(req.params.eventoId);

  try {
    const [[evento]] = await pool.query(
      "SELECT titulo,fecha_inicio FROM eventos WHERE id=?",
      [eventoId]
    );

    if (!evento) return res.status(404).json({ ok: false, msg: "Evento no existe" });

    const [rows] = await pool.query(
      `SELECT u.nombre,u.email,i.estado,i.created_at
       FROM inscripciones i
       INNER JOIN users u ON u.id=i.user_id
       WHERE i.evento_id=?`,
      [eventoId]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte");

    const fecha = new Date();

    // Cabecera
    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = "GESTIÓN DE EVENTOS";
    sheet.getCell("A1").font = { size: 16, bold: true };

    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = "Reporte de Asistencia";
    sheet.getCell("A2").font = { size: 14, bold: true };

    sheet.addRow([]);
    sheet.addRow(["Evento:", evento.titulo]);
    sheet.addRow(["Fecha del evento:", evento.fecha_inicio]);
    sheet.addRow(["Generado:", fecha.toLocaleString()]);
    sheet.addRow([]);

    const header = sheet.addRow(["Nombre", "Email", "Estado", "Fecha Inscripción", "Firma"]);
    header.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
      cell.alignment = { horizontal: "center" };
    });

    rows.forEach(r => {
      sheet.addRow([r.nombre, r.email, r.estado, r.created_at, ""]);
    });

    sheet.columns = [
      { width: 30 },
      { width: 35 },
      { width: 15 },
      { width: 25 },
      { width: 25 }
    ];

    sheet.addRow([]);
    sheet.addRow(["Total inscritos:", rows.length]);

    const nombreEvento = evento.titulo.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_${nombreEvento}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ ok: false, msg: "Error generando Excel", error: err.message });
  }
}

// =============================
// EXPORTAR A CSV
// =============================
async function exportarInscritosCSV(req, res) {
  const eventoId = Number(req.params.eventoId);

  try {
    const [[evento]] = await pool.query(
      "SELECT titulo,fecha_inicio FROM eventos WHERE id=?",
      [eventoId]
    );

    if (!evento) return res.status(404).json({ ok: false, msg: "Evento no existe" });

    const [rows] = await pool.query(
      `SELECT u.nombre,u.email,i.estado,i.created_at
       FROM inscripciones i
       INNER JOIN users u ON u.id=i.user_id
       WHERE i.evento_id=?`,
      [eventoId]
    );

    const parser = new Parser({ fields: ["nombre", "email", "estado", "created_at"] });
    const csv = parser.parse(rows);

    const nombreEvento = evento.titulo.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_${nombreEvento}.csv`
    );

    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, msg: "Error generando CSV", error: err.message });
  }
}

// =============================
// EXPORTS
// =============================
module.exports = {
  inscribir,
  cancelar,
  misInscripciones,
  inscritosPorEvento,
  exportarInscritosExcel,
  exportarInscritosCSV
};