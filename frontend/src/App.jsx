import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Eventos from "./pages/Eventos";
import DashboardAdmin from "./pages/DashboardAdmin";
import MisInscripciones from "./pages/MisInscripciones";
import InscritosEvento from "./pages/InscritosEvento";
import AdminEventos from "./pages/AdminEventos";
import RecursosAdmin from "./pages/RecursosAdmin";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import { setAuthToken } from "./api";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setAuthToken(token);
      const u = JSON.parse(savedUser);
      setUser(u);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
  };

  if (!user)
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
        }}
      />
    );

  return (
    <>
      <Navbar user={user} logout={logout} />

      <div className="app-layout">
        <Sidebar user={user} />

        <div className="main">
          <Routes>

            <Route
              path="/"
              element={
                <div className="card">
                  <Eventos user={user} />
                </div>
              }
            />

            <Route
              path="/mis"
              element={
                user.rol === "CLIENTE" ? (
                  <div className="card">
                    <MisInscripciones user={user} />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                user.rol === "ADMIN" ? (
                  <div className="card">
                    <DashboardAdmin user={user} />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/admin/eventos"
              element={
                user.rol === "ADMIN" ? (
                  <div className="card">
                    <AdminEventos user={user} />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/admin/inscritos"
              element={
                user.rol === "ADMIN" ? (
                  <div className="card">
                    <InscritosEvento user={user} />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/admin/recursos"
              element={
                user.rol === "ADMIN" ? (
                  <div className="card">
                    <RecursosAdmin user={user} />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

          </Routes>
        </div>
      </div>
    </>
  );
}