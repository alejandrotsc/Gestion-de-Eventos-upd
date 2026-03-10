import { useEffect, useState } from "react";
import { api } from "../api";

export default function Eventos({ user }) {
  const [eventos, setEventos] = useState([]);
  const [msg, setMsg] = useState("");
  
  // --- NUEVOS ESTADOS PARA FILTROS ---
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  const [recursosPorEvento, setRecursosPorEvento] = useState({});
  const [openEventoId, setOpenEventoId] = useState(null);

  // Modificamos cargar para que envíe los filtros al backend
  const cargar = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroTexto) params.append("buscar", filtroTexto);
      if (filtroEstado) params.append("estado", filtroEstado);
      if (soloDisponibles) params.append("soloDisponibles", "true");

      const { data } = await api.get(`/eventos?${params.toString()}`);
      setEventos(data.data || []);
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || err.message));
    }
  };

  // Se ejecuta cada vez que un filtro cambia
  useEffect(() => {
    const timer = setTimeout(() => {
      cargar();
    }, 300); // Pequeño retraso (debounce) para no saturar el server al escribir
    return () => clearTimeout(timer);
  }, [filtroTexto, filtroEstado, soloDisponibles]);

  const inscribirme = async (eventoId) => {
    setMsg("");
    try {
      const { data } = await api.post(`/inscripciones/${eventoId}`);
      setMsg("✅ " + data.msg);
      await cargar();
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || err.message));
    }
  };

  const toggleRecursos = async (eventoId) => {
    if (openEventoId === eventoId) {
      setOpenEventoId(null);
      return;
    }
    setOpenEventoId(eventoId);
    if (recursosPorEvento[eventoId]) return;
    try {
      const { data } = await api.get(`/recursos/evento/${eventoId}`);
      setRecursosPorEvento((prev) => ({ ...prev, [eventoId]: data.data || [] }));
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Gestión de Eventos</h3>
        <button onClick={cargar} className="btn-secondary" style={{ padding: "8px 16px" }}>
          🔄 Actualizar
        </button>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div style={{ 
        background: "rgba(255,255,255,0.05)", 
        padding: 20, 
        borderRadius: 12, 
        marginBottom: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 15,
        alignItems: "center",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ flex: 1, minWidth: "250px" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "#aaa" }}>Buscar por título</label>
          <input 
            type="text" 
            placeholder="Ej: Conferencia TI..." 
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "#aaa" }}>Estado</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ padding: "10px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff" }}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
          <input 
            type="checkbox" 
            id="checkCupo"
            checked={soloDisponibles}
            onChange={(e) => setSoloDisponibles(e.target.checked)}
          />
          <label htmlFor="checkCupo" style={{ fontSize: 14, cursor: "pointer" }}>Solo con cupo disponible</label>
        </div>
      </div>

      {msg && <p style={{ background: "rgba(255,255,255,0.1)", padding: 10, borderRadius: 8 }}>{msg}</p>}

      {eventos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
          🔍 No se encontraron eventos con esos filtros.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {eventos.map((e) => (
            <div key={e.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h4 style={{ margin: 0, color: "#646cff" }}>{e.titulo}</h4>
                <span style={{ 
                  fontSize: 10, 
                  padding: "2px 8px", 
                  borderRadius: 10, 
                  background: e.estado === 'ACTIVO' ? '#1b4332' : '#4a0e0e',
                  color: e.estado === 'ACTIVO' ? '#8fecbb' : '#ff9b9b'
                }}>
                  {e.estado}
                </span>
              </div>

              <p style={{ margin: "10px 0", fontSize: 14, color: "#ccc" }}>{e.descripcion}</p>

              <p style={{ margin: "6px 0", fontSize: 13 }}>
                📍 <b>{e.ubicacion || "Sin ubicación"}</b>
              </p>

              <div style={{ margin: "12px 0", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 12 }}>
                📅 <b>Inicio:</b> {new Date(e.fecha_inicio).toLocaleString()} <br />
                🏁 <b>Fin:</b> {new Date(e.fecha_fin).toLocaleString()}
              </div>

              <div style={{ marginBottom: 15 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span>Cupo: {e.cupo === 0 ? "Ilimitado" : e.cupo}</span>
                  <span>{e.porcentaje_ocupado || 0}% lleno</span>
                </div>
                {e.cupo > 0 && (
                  <div style={{ width: "100%", height: 6, background: "#333", borderRadius: 3 }}>
                    <div style={{ 
                      width: `${e.porcentaje_ocupado}%`, 
                      height: "100%", 
                      background: e.porcentaje_ocupado > 80 ? "#ff4646" : "#646cff", 
                      borderRadius: 3 
                    }}></div>
                  </div>
                )}
              </div>

              {user.rol === "CLIENTE" && e.estado === 'ACTIVO' && (e.cupo_disponible > 0 || e.cupo === 0) && (
                <button onClick={() => inscribirme(e.id)} style={{ padding: 10, width: "100%", marginBottom: 8 }}>
                  Inscribirme Ahora
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={() => toggleRecursos(e.id)}
                style={{ padding: 8, width: "100%", fontSize: 12 }}
              >
                {openEventoId === e.id ? "🔼 Ocultar Recursos" : "📦 Ver Recursos Asignados"}
              </button>

              {openEventoId === e.id && (
                <div style={{ marginTop: 10, borderTop: "1px solid #333", paddingTop: 10 }}>
                  {(recursosPorEvento[e.id] || []).length === 0 ? (
                    <div className="muted" style={{ fontSize: 11 }}>No hay recursos asignados.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 5 }}>
                      {recursosPorEvento[e.id].map((r) => (
                        <div key={r.id} style={{ fontSize: 12, padding: "4px 8px", background: "#1a1a1a", borderRadius: 4 }}>
                          • {r.nombre} <span style={{ color: "#888" }}>(x{r.cantidad})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}