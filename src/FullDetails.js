import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { useDebtors } from "./DebtorContext";

export const FullDetails = () => {
  const [debtor, setDebtor] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [showInterestPaid, setShowInterestPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const { getDebtorById, deleteDebtor } = useDebtors();
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchDebtorData = useCallback(async () => {
    try {
      const data = await getDebtorById(id);
      setDebtor(data);
    } catch (error) {
      console.error("Error fetching debtor data:", error);
    } finally {
      setLoading(false);
    }
  }, [id, getDebtorById]);

  useEffect(() => {
    fetchDebtorData();
  }, [fetchDebtorData]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this debtor?")) return;
    try {
      setDeleting(true);
      await deleteDebtor(id);
      setTimeout(() => {
        setDeleting(false);
        alert("✅ Debtor deleted successfully!");
        navigate(-1);
      }, 500);
    } catch (error) {
      setDeleting(false);
      alert("❌ Failed to delete debtor.");
    }
  };

  const formatMonth = (month) => {
    const [monthName, year] = month.split("-");
    return `${monthName.slice(0, 3)}-${year.slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading debtor details...</p>
        </div>
      </div>
    );
  }

  if (!debtor) {
    return (
      <div className="alert alert-danger text-center mt-5">
        Debtor not found.
      </div>
    );
  }

  const paidPrincipal = debtor.paymentHistory?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const isFullyPaid = parseFloat(debtor.remainingBalance) === 0;


  return (
    <div className="container mt-4 position-relative">
      {deleting && (
        <div className="spinner-overlay">
          <div className="spinner-border text-danger" role="status" />
        </div>
      )}

      {isFullyPaid && (
        <div className="position-absolute top-50 start-50 translate-middle text-center" style={{
          transform: "rotate(-45deg)",
          zIndex: 10,
          fontSize: "clamp(1rem, 4vw, 2rem)",
          fontWeight: "bold",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          textShadow: "1px 1px 3px rgba(237, 228, 228, 0.1)",
        }}>
          <i className="bi bi-check-circle-fill me-2"></i>
          This debtor has fully repaid the loan.
        </div>
      )}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
        <h3 className="text-primary fw-bold m-0">Debtor Details</h3>
        <div className="d-flex flex-wrap gap-2">
          {localStorage.getItem("role") !== "limited" && (
            <>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <i className="bi bi-trash"></i> Delete
              </button>
              <button className="btn btn-success btn-sm" onClick={() => navigate(`/admin?editIndex=${debtor._id}`)}>
                <i className="bi bi-pencil-square"></i> Edit
              </button>
            </>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i> Back
          </button>
        </div>
      </div>

<div className="card shadow-sm p-3 position-relative overflow-hidden" style={isFullyPaid ? { opacity: 0.3 } : {}}>
  <div className="row g-3">
    <div className="col-md-4 text-center">
      {debtor.photo?.url ? (
        <img
          src={debtor.photo.url}
          alt={debtor.name}
          className="img-fluid rounded border bg-light"
          style={{
            maxWidth: "100%",
            maxHeight: "350px",
            objectFit: "contain",
          }}
        />
      ) : (
        <div className="alert alert-secondary">No Photo</div>
      )}
    </div>

    <div className="col-md-8">
      <div className="table-responsive">
<table
  className="table table-bordered table-sm mb-0"
  style={{ borderColor: "black" }}
>
  <tbody>
    {[
      ["Name", debtor.name, "fw-bold text-dark"],
      ["Address", debtor.address],
      ["Mobile", debtor.mobile, "fw-bold text-primary"],
      ["Debt Date", new Date(debtor.debtDate).toLocaleDateString("en-GB"), "text-muted"],
      ["Debt Amount", `₹${parseFloat(debtor.debtAmount)}`, "text-danger fw-bold"],
      ["Paid Principal", `₹${paidPrincipal}`, "text-primary fw-bold"],
      ["Remaining Balance", `₹${debtor.remainingBalance}`, "text-success fw-bold"],
      ["Interest Rate", `${debtor.interestRate}%`],
      ["Interest Amount", `₹${debtor.interestAmount}`],
      [
        "Interest Paid Months",
        debtor.interestPaidMonths?.map(e => formatMonth(e.month)).join(", ") || "None",
        "text-success",
      ],
    ].map(([label, value, className = ""]) => (
      <tr key={label} style={{ border: "1px solid black" }}>
        <th
          className="bg-light"
          style={{
            width: "40%",
            whiteSpace: "nowrap",
            border: "1px solid black",
          }}
        >
          {label}
        </th>
        <td
          className={className}
          style={{
            width: "60%",
            border: "1px solid black",
          }}
        >
          {value}
        </td>
      </tr>
    ))}
  </tbody>
</table>

      </div>
    </div>
  </div>
</div>


      <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
        {localStorage.getItem("role") !== "limited" && (
          <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/pay-principal?debtorId=${debtor._id}`)}>
            Pay Principal
          </button>
        )}
        <button className="btn btn-outline-info btn-sm" onClick={() => {
          setShowHistory(!showHistory);
          setShowCarousel(false);
          setShowInterestPaid(false);
        }}>{showHistory ? "Hide" : "Show"} Principal History</button>

        <button className="btn btn-outline-dark btn-sm" onClick={() => {
          setShowCarousel(!showCarousel);
          setShowHistory(false);
          setShowInterestPaid(false);
        }}>{showCarousel ? "Hide" : "Show"} Documents</button>

        <button className="btn btn-outline-warning btn-sm" onClick={() => {
          setShowInterestPaid(!showInterestPaid);
          setShowCarousel(false);
          setShowHistory(false);
        }}>{showInterestPaid ? "Hide" : "Show"} Interest Paid</button>
      </div>

{showHistory && (
  <div className="mt-4">
    <h5 className="text-center text-info">Principal Payment History</h5>
    {debtor.paymentHistory?.length > 0 ? (
      <div className="table-responsive mx-auto" style={{ maxWidth: "800px" }}>
        <table
          className="table table-sm table-striped text-center align-middle"
          style={{ border: "1px solid black" }}
        >
          <thead>
            <tr style={{ border: "1px solid black" }}>
              {["Payment Date", "Method", "Amount Paid"].map((label, i) => (
                <th
                  key={i}
                  style={{
                    border: "1px solid black",
                    verticalAlign: "middle",
                    backgroundColor: "#1972caff",
                    color: "#000"
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {debtor.paymentHistory.map((item, idx) => (
              <tr key={idx} style={{ border: "1px solid black" }}>
                <td style={{ border: "1px solid black", verticalAlign: "middle" }}>
                  {new Date(item.date).toLocaleDateString("en-GB")}
                </td>
                <td
                  style={{ border: "1px solid black", verticalAlign: "middle" }}
                  className="text-success"
                >
                  {item.method}
                </td>
                <td style={{ border: "1px solid black", verticalAlign: "middle" }}>
                  ₹{item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="alert alert-light text-center">No principal payments yet.</div>
    )}
  </div>
)}



{showCarousel && (
  <>
    {(!debtor.bondPapers?.length && !debtor.checkLeaves?.length) ? (
      <div className="alert alert-warning text-center mt-4">
        No documents uploaded.
      </div>
    ) : (
      <div id="imageCarousel" className="carousel slide mt-4" data-bs-ride="false">
        <div className="carousel-inner">
          {["bondPapers", "checkLeaves"]
            .flatMap(type => (debtor[type] || []).map((img, idx) => ({
              ...img,
              label: type,
              key: `${type}-${idx}`
            })))
            .map((doc, index) => (
              <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={doc.key}>
                <div className="p-4 bg-light shadow-lg rounded-4 border border-dark-subtle mx-auto"
                  style={{
                    maxWidth: "860px",
                    background: "linear-gradient(to bottom, #ffffff, #f8f9fa)",
                    border: "1px solid #dee2e6",
                    padding: "2rem",
                  }}>
                  <div className="text-center mb-4">
                    <h6 className="fw-bold text-uppercase text-primary">
                      {doc.label === "bondPapers" ? "Bond Paper" : "Check Leaf"}
                    </h6>
                  </div>
                  <img
                    src={doc.url}
                    className="d-block mx-auto mb-3"
                    alt={doc.name}
                    style={{
                      maxHeight: "400px",
                      maxWidth: "100%",
                      objectFit: "contain",
                      borderRadius: "12px",
                      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                    }}
                  />
                  <div className="d-flex flex-column align-items-center gap-2">
                    <a
                      href={doc.url}
                      download={doc.name || "document.jpg"}
                      className="btn btn-success btn-sm px-4 fw-semibold"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="bi bi-download me-1"></i> Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#imageCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" style={{ filter: "invert(1)" }}></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#imageCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" style={{ filter: "invert(1)" }}></span>
        </button>
      </div>
    )}
  </>
)}


{showInterestPaid && (
  <div className="mt-4">
    <h5 className="text-center text-warning">Interest Paid Details</h5>
    {debtor.interestPaidMonths?.length > 0 ? (
      <div className="table-responsive mx-auto" style={{ maxWidth: "800px" }}>
        <table
          className="table table-sm table-striped text-center align-middle"
          style={{ border: "1px solid black" }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid black" }}>Paid Date</th>
              <th style={{ border: "1px solid black" }}>Months</th>
              <th style={{ border: "1px solid black" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              debtor.interestPaidMonths.reduce((acc, curr) => {
                const dateKey = new Date(curr.date).toLocaleDateString("en-GB");
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(curr);
                return acc;
              }, {})
            ).map(([date, entries], idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid black", verticalAlign: "middle" }}>{date}</td>
                <td
                  className="text-success"
                  style={{ border: "1px solid black", verticalAlign: "middle" }}
                >
                  {entries.map((e) => formatMonth(e.month)).join(", ")}
                </td>
                <td
                  className="text-primary"
                  style={{ border: "1px solid black", verticalAlign: "middle" }}
                >
                  ₹{entries.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="alert alert-light text-center">No Interest Paid Yet.</div>
    )}
  </div>
)}


      <style>{`
        .spinner-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
      `}</style>
    </div>
  );
};
