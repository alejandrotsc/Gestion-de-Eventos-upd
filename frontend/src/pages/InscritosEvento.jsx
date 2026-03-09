import { useEffect, useState } from "react";
import { api } from "../api";

export default function InscritosEvento({ user }) {

  const [eventos, setEventos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [msg, setMsg] = useState("");

  const cargarEventos = async () => {
    setMsg("");

    try {

      const { data } = await api.get("/eventos");
      setEventos(data.data || []);

    } catch (err) {

      setMsg("❌ " + (err.response?.data?.msg || err.message));

    }
  };


  const verInscritos = async (evento) => {

    setMsg("");
    setSelected(evento);
    setInscritos([]);

    try {

      const { data } = await api.get(`/inscripciones/evento/${evento.id}`);
      setInscritos(data.data || []);

    } catch (err) {

      setMsg("❌ " + (err.response?.data?.msg || err.message));

    }

  };


  const exportarExcel = async () => {

    if (!selected) return;

    try {

      const response = await api.get(
        `/inscripciones/exportar/excel/${selected.id}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const nombreEvento = selected.titulo
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const link = document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        `reporte_${nombreEvento}.xlsx`
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

    } catch {

      setMsg("❌ Error exportando Excel");

    }

  };


  useEffect(() => {

    if (user.rol === "ADMIN") cargarEventos();

  }, []);


  if (user.rol !== "ADMIN") return null;


  return (

    <div style={{ marginTop: 20 }}>

      <h3>Inscritos por Evento</h3>

      <button
        onClick={cargarEventos}
        style={{ padding: 8, marginBottom: 10 }}
      >
        Recargar eventos
      </button>

      {msg && <p>{msg}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>

          <h4 style={{ marginTop: 0 }}>Eventos</h4>

          {eventos.length === 0 ? (
            <p>No hay eventos.</p>
          ) : (

            <div style={{ display: "grid", gap: 8 }}>

              {eventos.map((e) => (

                <button
                  key={e.id}
                  onClick={() => verInscritos(e)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 12,
                    border: selected?.id === e.id ? "2px solid #4cafef" : "1px solid #444",
                    background: "#1e1e1e",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >

                  <b>{e.titulo}</b>

                  <div style={{ fontSize: 13 }}>
                    ID: {e.id} | {String(e.estado)}
                  </div>

                </button>

              ))}

            </div>

          )}

        </div>


        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>

          <h4 style={{ marginTop: 0 }}>
            {selected ? `Inscritos: ${selected.titulo}` : "Seleccioná un evento"}
          </h4>


          {selected && (

            <button
              onClick={exportarExcel}
              style={{
                marginBottom: 12,
                padding: 8,
                background: "#4cafef",
                border: "none",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Exportar Excel
            </button>

          )}


          {inscritos.map((r) => (

            <div
              key={r.id}
              style={{
                padding: 10,
                border: "1px solid #eee",
                borderRadius: 10,
                marginBottom: 6
              }}
            >

              <b>{r.nombre}</b>

              <div style={{ fontSize: 13 }}>
                {r.email}
              </div>

              <div style={{ fontSize: 13 }}>
                Estado: {r.estado}
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}