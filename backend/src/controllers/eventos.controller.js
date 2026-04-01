const pool = require("../config/db");
const { enviarCorreo } = require("../utils/mailer");

// VALIDACIÓN DE FECHAS
function validarFechasEvento(fecha_inicio, fecha_fin) {
  if (!fecha_inicio || !fecha_fin) {
    return "Las fechas son requeridas";
  }

  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);

  if (fin <= inicio) {
    return "La fecha de fin debe ser mayor a la fecha de inicio";
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  inicio.setHours(0, 0, 0, 0);

  if (inicio < hoy) {
    return "La fecha de inicio no puede ser anterior a hoy";
  }

  return null;
}

// VALIDACIÓN DE CUPO
function validarCupo(cupo) {
  if (cupo === undefined || cupo === null) {
    return "El cupo es requerido";
  }

  const cupoNum = Number(cupo);

  if (isNaN(cupoNum)) {
    return "El cupo debe ser un número válido";
  }

  if (cupoNum <= 0) {
    return "El cupo debe ser mayor a 0";
  }

  return null;
}

// CREATE
async function crearEvento(req, res) {
  try {
    const { titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, cupo } = req.body;

    if (!titulo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        ok: false,
        msg: "titulo, fecha_inicio y fecha_fin son requeridos"
      });
    }

    // Validar fechas
    const errorFechas = validarFechasEvento(fecha_inicio, fecha_fin);
    if (errorFechas) {
      return res.status(400).json({ ok: false, msg: errorFechas });
    }

    // Validar cupo
    const errorCupo = validarCupo(cupo);
    if (errorCupo) {
      return res.status(400).json({ ok: false, msg: errorCupo });
    }

    const cupoNum = Number(cupo);

    const [result] = await pool.query(
      `INSERT INTO eventos 
      (titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, cupo, created_by) 
      VALUES (?,?,?,?,?,?,?)`,[
        titulo,
        descripcion || null,
        ubicacion || null,
        fecha_inicio,
        fecha_fin,
        cupoNum,
        req.user.id
      ]
    );

    try {
      const [clientes] = await pool.query("SELECT email FROM users WHERE rol = 'CLIENTE'");
      if (clientes.length > 0) {
        const correos = clientes.map(c => c.email).join(",");
        const asunto = `¡Nuevo Evento: ${titulo}! 🎉`;
const mensaje = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              

              <div style="background: linear-gradient(135deg, #7C5CFF, #22D3EE); padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">¡Nuevo Evento Disponible! 🎉</h1>
              </div>
              

              <div style="padding: 30px 40px; text-align: left; color: #333333;">
                <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hola,</p>
                <p style="font-size: 16px; line-height: 1.6;">Se ha programado un nuevo evento en nuestra plataforma y queremos que seas el primero en enterarte.</p>
                

                <div style="background-color: #f8fafc; border-left: 4px solid #7C5CFF; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                  <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 20px;">${titulo}</h2>
                  <p style="margin: 5px 0; font-size: 15px; color: #475569;"><strong>📅 Fecha:</strong> ${new Date(fecha_inicio).toLocaleString()}</p>
                  <p style="margin: 5px 0; font-size: 15px; color: #475569;"><strong>📍 Ubicación:</strong> ${ubicacion || 'Por definir'}</p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6;">¡Los cupos son limitados! Asegura tu lugar ingresando a la plataforma antes de que se agoten.</p>
                

                <div style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
                  <a href="http://localhost:5173" style="background: #7C5CFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Inscribirme Ahora</a>
                </div>
              </div>
              

              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Gestión de Eventos. Todos los derechos reservados.</p>
              </div>
              
            </div>
          </div>
        `;
        enviarCorreo(correos, asunto, mensaje);
      }
    } catch (mailErr) {
      console.error("Error enviando correos de creación:", mailErr);
    }
    // ---------------------------------------------

    return res.status(201).json({
      ok: true,
      msg: "Evento creado",
      id: result.insertId
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: "Error creando evento",
      error: err.message
    });
  }
}

// READ LIST
async function listarEventos(req, res) {
  try {
    const { buscar, estado, soloDisponibles } = req.query;

    let query = `
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
      WHERE 1=1
    `;

    const params =[];

    if (buscar) {
      query += " AND e.titulo LIKE ?";
      params.push(`%${buscar}%`);
    }

    if (estado) {
      query += " AND e.estado = ?";
      params.push(estado);
    }

    if (soloDisponibles === 'true') {
      query += " AND (e.cupo - IFNULL(x.inscritos_activos, 0)) > 0";
    }

    query += " ORDER BY e.fecha_inicio ASC";

    const[rows] = await pool.query(query, params);

    return res.json({ ok: true, data: rows });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: "Error listando eventos",
      error: err.message
    });
  }
}

// READ ONE
async function obtenerEvento(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM eventos WHERE id=?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Evento no encontrado"
      });
    }

    return res.json({ ok: true, data: rows[0] });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: "Error obteniendo evento",
      error: err.message
    });
  }
}

// UPDATE
async function actualizarEvento(req, res) {
  try {
    const { titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, cupo, estado } = req.body;

    const [exist] = await pool.query(
      "SELECT * FROM eventos WHERE id=?",
      [req.params.id]
    );

    if (exist.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Evento no encontrado"
      });
    }

    const eventoActual = exist[0];

    // Validar fechas
    const nuevaFechaInicio = fecha_inicio || eventoActual.fecha_inicio;
    const nuevaFechaFin = fecha_fin || eventoActual.fecha_fin;

    const errorFechas = validarFechasEvento(nuevaFechaInicio, nuevaFechaFin);
    if (errorFechas) {
      return res.status(400).json({ ok: false, msg: errorFechas });
    }

    // Validar cupo si viene
    if (cupo !== undefined) {
      const errorCupo = validarCupo(cupo);
      if (errorCupo) {
        return res.status(400).json({ ok: false, msg: errorCupo });
      }

      const nuevoCupo = Number(cupo);

      const [inscritos] = await pool.query(
        `SELECT COUNT(*) as total 
         FROM inscripciones 
         WHERE evento_id=? AND estado='ACTIVA'`,
        [req.params.id]
      );

      const inscritosActivos = inscritos[0].total;

      if (nuevoCupo < inscritosActivos) {
        return res.status(400).json({
          ok: false,
          msg: `El cupo no puede ser menor a los inscritos actuales (${inscritosActivos})`
        });
      }
    }

    await pool.query(
      `UPDATE eventos SET 
        titulo = COALESCE(?, titulo), 
        descripcion = COALESCE(?, descripcion), 
        ubicacion = COALESCE(?, ubicacion), 
        fecha_inicio = COALESCE(?, fecha_inicio), 
        fecha_fin = COALESCE(?, fecha_fin), 
        cupo = COALESCE(?, cupo), 
        estado = COALESCE(?, estado) 
      WHERE id=?`,[
        titulo ?? null,
        descripcion ?? null,
        ubicacion ?? null,
        fecha_inicio ?? null,
        fecha_fin ?? null,
        cupo !== undefined ? Number(cupo) : null,
        estado ?? null,
        req.params.id
      ]
    );

    try {
      const [inscritos] = await pool.query(`
        SELECT u.email FROM users u
        INNER JOIN inscripciones i ON u.id = i.user_id
        WHERE i.evento_id = ? AND i.estado = 'ACTIVA'
      `, [req.params.id]);

      if (inscritos.length > 0) {
        const correos = inscritos.map(c => c.email).join(",");
        const asunto = `Actualización importante: Evento modificado ⚠️`;
const mensaje = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              

              <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Actualización de Evento ⚠️</h1>
              </div>
              
   
              <div style="padding: 30px 40px; text-align: left; color: #333333;">
                <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hola,</p>
                <p style="font-size: 16px; line-height: 1.6;">Te informamos que el evento <strong>${titulo || eventoActual.titulo}</strong> al que estás inscrito ha sufrido modificaciones importantes.</p>
                

                <div style="background-color: #fffbeb; padding: 15px 20px; border-radius: 8px; color: #b45309; border: 1px solid #fde68a; margin: 20px 0;">
                  <p style="margin: 0; font-size: 15px; line-height: 1.5;">
                    Los cambios pueden incluir nuevas fechas, cambio de ubicación o modificaciones en el estado del evento.
                  </p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6;">Por favor, ingresa a tu panel para revisar los nuevos detalles y confirmar tu asistencia.</p>
                

                <div style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
                  <a href="http://localhost:5173" style="background: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Revisar Detalles</a>
                </div>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Gestión de Eventos. Todos los derechos reservados.</p>
              </div>
              
            </div>
          </div>
        `;
        enviarCorreo(correos, asunto, mensaje);
      }
    } catch (mailErr) {
      console.error("Error enviando correos de actualización:", mailErr);
    }

    return res.json({ ok: true, msg: "Evento actualizado" });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: "Error actualizando evento",
      error: err.message
    });
  }
}

// DELETE
async function eliminarEvento(req, res) {
  try {
    const [exist] = await pool.query(
      "SELECT id FROM eventos WHERE id=?",
      [req.params.id]
    );

    if (exist.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Evento no encontrado"
      });
    }

    await pool.query(
      "DELETE FROM eventos WHERE id=?",
      [req.params.id]
    );

    return res.json({ ok: true, msg: "Evento eliminado" });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: "Error eliminando evento",
      error: err.message
    });
  }
}

module.exports = {
  crearEvento,
  listarEventos,
  obtenerEvento,
  actualizarEvento,
  eliminarEvento
};