import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ user }) {
  const location = useLocation();

  const itemsBase = [
    { path: "/", label: "📅 Eventos" },
  ];

  const itemsCliente = [
    { path: "/mis", label: "🧾 Mis inscripciones" },
  ];

  const itemsAdmin = [
    { path: "/admin/dashboard", label: "📊 Dashboard" },
    { path: "/admin/inscritos", label: "👥 Inscritos por evento" },
    { path: "/admin/eventos", label: "🛠️ Panel eventos" },
    { path: "/admin/recursos", label: "🧩 Recursos" },
  ];

  const items =
    user.rol === "ADMIN"
      ? [...itemsBase, ...itemsAdmin]
      : [...itemsBase, ...itemsCliente];

  return (
    <div className="card sidebar">
      <div className="side-title">Menú</div>

      <div className="navlist">
        {items.map((it) => (
          <Link
            key={it.path}
            to={it.path}
            className={`navbtn ${
              location.pathname === it.path ? "active" : ""
            }`}
          >
            {it.label}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 12 }} className="muted">
        Rol: <b style={{ color: "white" }}>{user.rol}</b>
      </div>
    </div>
  );
}