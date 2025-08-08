import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // 👈 make sure this is imported
import { useDebtors } from "./DebtorContext";

export const Login = ({ setIsAuthenticated }) => {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useDebtors();

  const handleLogin = async () => {
    if (!userID || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser(userID, password);
      const { id, username, role } = data.user;

      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("role", role);
      localStorage.setItem("userID", id);
      localStorage.setItem("username", username.toLowerCase());
      localStorage.setItem("lastLogin", new Date().toLocaleString());

      navigate("/user");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 position-relative">
      {/* 🔄 Loading Spinner */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75"
          style={{ zIndex: 9999 }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
            <div className="mt-3 fw-bold text-primary">Authenticating...</div>
          </div>
        </div>
      )}

      <div className="card p-4 mx-auto shadow" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-3">Login</h2>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="User ID"
            value={userID}
            onChange={(e) => setUserID(e.target.value.trim())}
            disabled={loading}
          />
        </div>

        {/* 👁️ Password with toggle */}
<div className="mb-3 position-relative">
  <input
    type={showPassword ? "text" : "password"}
    className="form-control"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") handleLogin();
    }}
    disabled={loading}
  />
  <i
    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} position-absolute top-50 end-0 translate-middle-y me-3`}
    style={{ cursor: "pointer" }}
    onClick={() => setShowPassword(!showPassword)}
  ></i>
</div>


        <button
          className="btn btn-primary w-100"
          onClick={handleLogin}
          disabled={loading}
        >
          Login
        </button>
      </div>
    </div>
  );
};
