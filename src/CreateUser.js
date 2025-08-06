import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const CreateUser = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername("");
    setPassword("");
    setRole("");
  }, []);

  const handleCreate = async () => {
    if (!username || !password || !role) {
      alert("All fields including Role are required.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("https://fin-nodejs.onrender.com/api/users/register", {
        username,
        password,
        role,
      });

      alert("User created successfully!");

      // Reset fields
      setUsername("");
      setPassword("");
      setRole("");
    } catch (err) {
      alert(err.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 position-relative">
      {loading && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(255,255,255,0.6)", zIndex: 1000 }}
        >
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }} />
          <p className="mt-3 fw-bold">Creating user...</p>
        </div>
      )}

      <div className={`card p-4 mx-auto ${loading ? "opacity-50 pointer-events-none" : ""}`} style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Create New User</h2>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">-- Select Role --</option>
              <option value="limited">Limited</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button className="btn btn-success w-100" onClick={handleCreate} disabled={loading}>
            Create User
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
