import { useEffect, useState } from "react";
import { api } from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DashboardAdmin({ user, setView }) {
  const[stats, setStats] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const { data } = await api.get("/admin/dashboard");
        setStats(data.data);
      } catch (err) {
        setMsg("❌ Error cargando dashboard: " + (err.response?.data?.msg || err.message));
      }
    };
    if (user.rol === "ADMIN") cargarDashboard();
  }, [user.rol]);

  if (user.rol !== "ADMIN") return null;
  if (!stats) return <p style={{ textAlign: "center", marginTop: "50px", color: "#22D3EE" }}>Cargando métricas del sistema...</p>;

  const chartData =[
    { name: "Eventos Totales", cantidad: stats.total_eventos },
    { name: "Inscripciones Activas", cantidad: stats.total_inscripciones_activas },
  ];

  return (
    <div style={{ marginTop: 10 }}>
      {/* HEADER DEL DASHBOARD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#EAF0FF" }}>Hola, {user.nombre.split(" ")[0]} 👋</h2>
          <p style={{ margin: "4px 0 0 0", color: "rgba(234,240,255,0.6)", fontSize: "14px" }}>
            Aquí tienes el resumen operativo de tu plataforma.
          </p>
        </div>
        
        {/* QUICK ACTIONS */}
        <div className="no-print" style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => window.print()} 
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "13px" }}
          >
            🖨️ Exportar PDF
          </button>
          <button 
            onClick={() => setView("admin_eventos")} 
            style={{ background: "linear-gradient(90deg, #7C5CFF, #22D3EE)", fontSize: "13px", border: "none" }}
          >
            ➕ Nuevo Evento
          </button>
        </div>
      </div>

      {msg && <p>{msg}</p>}

      {/* TARJETAS DE RESUMEN (KPIs) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        
        <div style={{ background: "linear-gradient(135deg, rgba(124,92,255,0.15), rgba(34,211,238,0.15))", border: "1px solid rgba(124,92,255,0.3)", padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ margin: 0, fontWeight: "600", color: "rgba(234,240,255,0.7)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>Total Eventos</p>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "3rem", color: "#22D3EE", lineHeight: "1" }}>{stats.total_eventos}</h2>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))", border: "1px solid rgba(16,185,129,0.3)", padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ margin: 0, fontWeight: "600", color: "rgba(234,240,255,0.7)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>Inscripciones Activas</p>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "3rem", color: "#10b981", lineHeight: "1" }}>{stats.total_inscripciones_activas}</h2>
        </div>

        {stats.evento_mas_inscritos ? (
          <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))", border: "1px solid rgba(245,158,11,0.3)", padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ margin: 0, fontWeight: "600", color: "rgba(234,240,255,0.7)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>Evento Estrella 🌟</p>
            <h3 style={{ margin: "8px 0 4px 0", color: "#f59e0b", fontSize: "1.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {stats.evento_mas_inscritos.titulo}
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#EAF0FF" }}>
              <b>{stats.evento_mas_inscritos.inscritos}</b> usuarios registrados
            </p>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.2)", padding: "24px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="muted" style={{ margin: 0 }}>Sin datos de inscripciones</p>
          </div>
        )}
      </div>

      {/* GRÁFICO Y LISTA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        
        {/* Gráfico de Barras */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "16px" }}>
          <h4 style={{ marginTop: 0, marginBottom: "20px", color: "#EAF0FF", fontWeight: "600" }}>Métricas de Participación</h4>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: "#0B1220", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} 
                  itemStyle={{ color: "#22D3EE", fontWeight: "bold" }}
                />
                <Bar dataKey="cantidad" fill="url(#colorUv)" radius={[6, 6, 0, 0]} barSize={60} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Próximos Eventos */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h4 style={{ margin: 0, color: "#EAF0FF", fontWeight: "600" }}>Próximos Eventos</h4>
            <span style={{ background: "rgba(34,211,238,0.1)", color: "#22D3EE", padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "bold" }}>
              {stats.proximos_eventos.length} programados
            </span>
          </div>
          
          {stats.proximos_eventos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>📭</p>
              <p style={{ margin: 0, fontSize: "14px" }}>No hay eventos a futuro.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {stats.proximos_eventos.map(ev => (
                <div key={ev.id} style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", borderLeft: "4px solid #7C5CFF", transition: "transform 0.2s", cursor: "default" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <b style={{ color: "#EAF0FF", fontSize: "14px" }}>{ev.titulo}</b>
                    <span style={{ fontSize: "10px", background: ev.estado === "ACTIVO" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: ev.estado === "ACTIVO" ? "#10b981" : "#ef4444", padding: "2px 6px", borderRadius: "4px" }}>
                      {ev.estado}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(234,240,255,0.5)", marginTop: "6px", display: "flex", gap: "12px" }}>
                    <span>📅 {new Date(ev.fecha_inicio).toLocaleDateString()}</span>
                    <span>📍 {ev.ubicacion || "TBD"}</span>
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