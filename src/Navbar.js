import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Navbar.css";
import { useDebtors } from "./DebtorContext";

const Navbar = ({ isAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useDebtors();
  const [loadingLogout, setLoadingLogout] = useState(false); // ⬅️ Spinner state

  const userRole = localStorage.getItem("role");

  if (!isAuthenticated || location.pathname === "/login") return null;

  const handleLogout = async () => {
    const userId = localStorage.getItem("userID");
    const username = localStorage.getItem("username");

    if (!username || !userId) {
      console.error("Missing username or userId");
      localStorage.clear();
      navigate("/login");
      return;
    }

    try {
      setLoadingLogout(true); // ⬅️ Start spinner
      await logoutUser(userId, username);
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoadingLogout(false); // ⬅️ Stop spinner
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* 🔄 Full screen logout spinner */}
      {loadingLogout && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75"
          style={{ zIndex: 9999 }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-danger"
              role="status"
              style={{ width: "3rem", height: "3rem" }}
            ></div>
            <div className="mt-3 fw-bold text-danger">Logging out...</div>
          </div>
        </div>
      )}

      <nav className="navbar navbar-expand-lg custom-navbar shadow-sm sticky-top">
        <div className="container-fluid px-4">
          <Link className="navbar-brand d-flex align-items-center gap-2 text-brand">
            <i className="bi bi-speedometer2 fs-4"></i>
            <span className="fs-5 fw-bold">Aadhikesavan Finance</span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            title="Toggle navigation"
          >
            <i className="bi bi-list text-white fs-3"></i>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <NavItem to="/user" icon="bi-person" label="User" isActive={isActive("/user")} />

              {userRole === "admin" && (
                <>
                  <NavItem to="/admin" icon="bi-gear" label="Admin" isActive={isActive("/admin")} />
                  <NavItem
                    to="/interestpaid"
                    icon="bi-cash-coin"
                    label="Interest Paid"
                    isActive={isActive("/interestpaid")}
                  />
                </>
              )}

              <NavItem
                to="/monthlyinandout"
                icon="bi-bar-chart-line"
                label="Monthly In & Out"
                isActive={isActive("/monthlyinandout")}
              />

              <li className="nav-item ms-lg-4 mt-2 mt-lg-0">
                <button className="btn btn-danger rounded-pill px-3" onClick={handleLogout} disabled={loadingLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

const NavItem = ({ to, icon, label, isActive }) => (
  <li className="nav-item mx-1">
    <Link className={`nav-link nav-modern ${isActive ? "active-link" : ""}`} to={to}>
      <i className={`bi ${icon} me-2`}></i> {label}
    </Link>
  </li>
);

export default Navbar;
