// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./App.css";
import { DebtorProvider } from "./DebtorContext" 
import Navbar from "./Navbar";
import ProtectedRoute from "./ProtectedRoute";

import { Admin } from "./Admin";
import { Login } from "./Login";
import { User } from "./User";
import { PayPrincipal } from "./PayPrincipal";
import { FullDetails } from "./FullDetails";
import { InterestPaid } from "./InterestPaid";
import { OverallInOut } from "./OverallInOut";
import CreateUser from "./CreateUser";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("role");
    } else {
      localStorage.setItem("isAuthenticated", "true");
    }
  }, [isAuthenticated]);

  return (
    <DebtorProvider>
    <Router>
      <div className="container py-4">
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/user" element={<User />} />
            <Route path="/interestpaid" element={<InterestPaid />} />
            <Route path="/monthlyinandout" element={<OverallInOut />} />
            <Route path="/pay-principal" element={<PayPrincipal />} />
            <Route path="/full-details/:id" element={<FullDetails />} />
            <Route path="/create-user" element={<CreateUser />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
    
    </DebtorProvider>
  
  );
}

export default App;

