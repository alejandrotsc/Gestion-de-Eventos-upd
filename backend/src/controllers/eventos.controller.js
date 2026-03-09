const pool = require("../config/db");

// CREATE (ADMIN)
async function crearEvento(req, res) {
  try {
    const { titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, cupo } = req.body;

    if (!titulo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ ok: false, msg: "titulo, fecha_inicio y fecha_fin son requeridos" });
    }

    const [result] = await pool.query(
      `INSERT INTO eventos
       (titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, cupo, created_by)
       VALUES (?,?,?,?,?,?,?)`,
      [titulo, descripcion || null, ubicacion || null, fecha_inicio, fecha_fin, Number(cupo || 0), req.user.id]
    );

    return res.status(201).json({ ok: true, msg: "Evento creado", id: result.insertId });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error creando evento", error: err.message });
  }
}

// READ LIST (público)
async function listarEventos(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.id, e.titulo, e.descripcion, e.ubicacion,
        e.fecha_inicio, e.fecha_fin, e.cupo, e.estado, e.created_by, e.created_at,
        IFNULL(x.inscritos_activos, 0) AS cupo_usado,
        CASE 
          WHEN e.cupo = 0 THEN NULL
          ELSE GREATEST(e.cupo - IFNULL(x.inscritos_activos, 0), 0)
        END AS cupo_disponible,
        CASE
          WHEN e.cupo = 0 THEN NULL
          ELSE ROUND((IFNULL(x.inscritos_activos, 0) / e.cupo) * 100, 2)
        END AS porcentaje_ocupado
      FROM eventos e
      LEFT JOIN (
        SELECT evento_id, COUNT(*) AS inscritos_activos
        FROM inscripciones
        WHERE estado='ACTIVA'
        GROUP BY evento_id
      ) x ON x.evento_id = e.id
      ORDER BY e.fecha_inicio ASC
    `);

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error listando eventos", error: err.message });
  }
}

// READ ONE (público)
async function obtenerEvento(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM eventos WHERE id=?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ ok: false, msg: "Evento no encontrado" });
    return res.json({ ok: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error obteniendo evento", error: err.message });
  }
}

// UPDATE (ADMIN)
async function actualizarEvento(req, res) {
  try {
    const { titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, cupo, estado } = req.body;

    const [exist] = await pool.query("SELECT id FROM eventos WHERE id=?", [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ ok: false, msg: "Evento no encontrado" });

    await pool.query(
      `UPDATE eventos SET
        titulo = COALESCE(?, titulo),
        descripcion = COALESCE(?, descripcion),
        ubicacion = COALESCE(?, ubicacion),
        fecha_inicio = COALESCE(?, fecha_inicio),
        fecha_fin = COALESCE(?, fecha_fin),
        cupo = COALESCE(?, cupo),
        estado = COALESCE(?, estado)
      WHERE id=?`,
      [
        titulo ?? null,
        descripcion ?? null,
        ubicacion ?? null,
        fecha_inicio ?? null,
        fecha_fin ?? null,
        cupo !== undefined ? Number(cupo) : null,
        estado ?? null,
        req.params.id,
      ]
    );

    return res.json({ ok: true, msg: "Evento actualizado" });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error actualizando evento", error: err.message });
  }
}

// DELETE (ADMIN)
async function eliminarEvento(req, res) {
  try {
    const [exist] = await pool.query("SELECT id FROM eventos WHERE id=?", [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ ok: false, msg: "Evento no encontrado" });

    await pool.query("DELETE FROM eventos WHERE id=?", [req.params.id]);
    return res.json({ ok: true, msg: "Evento eliminado" });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error eliminando evento", error: err.message });
  }
}

module.exports = { crearEvento, listarEventos, obtenerEvento, actualizarEvento, eliminarEvento };
