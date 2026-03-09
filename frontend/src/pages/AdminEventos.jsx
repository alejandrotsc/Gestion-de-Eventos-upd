import { useEffect, useState } from "react";
import { api } from "../api";

const emptyForm = {
  id: null,
  titulo: "",
  descripcion: "",
  ubicacion: "",
  fecha_inicio: "", // datetime-local: YYYY-MM-DDTHH:MM
  fecha_fin: "",    // datetime-local: YYYY-MM-DDTHH:MM
  cupo: 0,
  estado: "ACTIVO",
};

function toDatetimeLocal(value) {
  if (!value) return "";

  // Si viene de MySQL: "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
  const s = String(value).replace(" ", "T");
  const d = new Date(s);

  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toMySQL(datetimeLocal) {
  // "YYYY-MM-DDTHH:MM" -> "YYYY-MM-DD HH:MM:SS"
  if (!datetimeLocal) return null;
  return datetimeLocal.replace("T", " ") + ":00";
}

export default function AdminEventos({ user }) {
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    setMsg("");
    try {
      const { data } = await api.get("/eventos");
      setEventos(data.data || []);
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || err.message));
    }
  };

  useEffect(() => {
    if (user.rol === "ADMIN") cargar();
  }, []);

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const limpiar = () => setForm(emptyForm);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        ubicacion: form.ubicacion,
        fecha_inicio: toMySQL(form.fecha_inicio),
        fecha_fin: toMySQL(form.fecha_fin),
        cupo: Number(form.cupo || 0),
        estado: form.estado,
      };

      if (!payload.titulo || !payload.fecha_inicio || !payload.fecha_fin) {
        return setMsg("❌ titulo, fecha_inicio y fecha_fin son requeridos");
      }

      // Validación rápida: fin > inicio
      if (new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
        return setMsg("❌ La fecha fin debe ser mayor que la fecha inicio");
      }

      if (form.id) {
        const { data } = await api.put(`/eventos/${form.id}`, payload);
        setMsg("✅ " + data.msg);
      } else {
        const { data } = await api.post("/eventos", payload);
        setMsg("✅ " + data.msg);
      }

      limpiar();
      await cargar();
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || err.message));
    }
  };

  const eliminar = async (id) => {
    const ok = confirm("¿Eliminar este evento?");
    if (!ok) return;

    setMsg("");
    try {
      const { data } = await api.delete(`/eventos/${id}`);
      setMsg("✅ " + data.msg);
      await cargar();
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || err.message));
    }
  };

  const cargarFormulario = (e) => {
    setForm({
      id: e.id,
      titulo: e.titulo || "",
      descripcion: e.descripcion || "",
      ubicacion: e.ubicacion || "",
      fecha_inicio: toDatetimeLocal(e.fecha_inicio),
      fecha_fin: toDatetimeLocal(e.fecha_fin),
      cupo: e.cupo ?? 0,
      estado: e.estado || "ACTIVO",
    });
    setMsg("✏️ Editando evento ID " + e.id);
  };

  if (user.rol !== "ADMIN") return null;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Panel Eventos</h3>

      <button onClick={cargar} style={{ padding: 8, marginBottom: 10 }}>
        Recargar
      </button>

      {msg && <p>{msg}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Form */}
        <div style={{ border: "1px solid #444", borderRadius: 12, padding: 12 }}>
          <h4 style={{ marginTop: 0 }}>{form.id ? "Editar evento" : "Crear evento"}</h4>

          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Título"
              value={form.titulo}
              onChange={(e) => onChange("titulo", e.target.value)}
            />

            <input
              placeholder="Ubicación"
              value={form.ubicacion}
              onChange={(e) => onChange("ubicacion", e.target.value)}
            />

            <textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => onChange("descripcion", e.target.value)}
              style={{ minHeight: 70 }}
            />

            <label style={{ fontSize: 13, opacity: 0.8 }}>Fecha inicio</label>
            <input
              type="datetime-local"
              value={form.fecha_inicio}
              onChange={(e) => onChange("fecha_inicio", e.target.value)}
            />

            <label style={{ fontSize: 13, opacity: 0.8 }}>Fecha fin</label>
            <input
              type="datetime-local"
              value={form.fecha_fin}
              onChange={(e) => onChange("fecha_fin", e.target.value)}
            />

            <label style={{ fontSize: 13, opacity: 0.8 }}>Cupos</label>
            <input
              type="number"
              placeholder="Cupo"
              value={form.cupo}
              onChange={(e) => onChange("cupo", e.target.value)}
            />
            
            <label style={{ fontSize: 13, opacity: 0.8 }}>Estado</label>
            <select value={form.estado} onChange={(e) => onChange("estado", e.target.value)}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ flex: 1 }}>
                {form.id ? "Guardar cambios" : "Crear"}
              </button>

              <button type="button" onClick={limpiar} className="btn-secondary" style={{ flex: 1 }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Lista */}
        <div style={{ border: "1px solid #444", borderRadius: 12, padding: 12 }}>
          <h4 style={{ marginTop: 0 }}>Eventos</h4>

          {eventos.length === 0 ? (
            <p>No hay eventos.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {eventos.map((e) => (
                <div key={e.id} style={{ border: "1px solid #555", borderRadius: 12, padding: 12 }}>
                  <b>{e.titulo}</b>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    ID: {e.id} | {String(e.estado)}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Cupo: {e.cupo} | Usado: {e.cupo_usado ?? 0}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => cargarFormulario(e)} style={{ flex: 1 }}>
                      Editar
                    </button>
                    <button onClick={() => eliminar(e.id)} className="btn-danger" style={{ flex: 1 }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
