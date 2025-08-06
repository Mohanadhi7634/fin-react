import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useDebtors } from "./DebtorContext";

export const PayPrincipal = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("debtorId");
  const { getDebtorById, payPrincipal } = useDebtors();

  const [debtor, setDebtor] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDebtor = async () => {
      try {
        const result = await getDebtorById(id);
        setDebtor(result);

        // Set default payment date:
        if (result?.paymentHistory?.length > 0) {
          const lastPayment = result.paymentHistory[result.paymentHistory.length - 1];
          if (lastPayment?.date) {
            const formattedLast = new Date(lastPayment.date).toISOString().split("T")[0];
            setPaymentDate(formattedLast);
          }
        } else if (result?.debtDate) {
          const formatted = new Date(result.debtDate).toISOString().split("T")[0];
          setPaymentDate(formatted);
        }
      } catch (error) {
        console.error("Error fetching debtor details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDebtor();
  }, [id, getDebtorById]);

  const handlePayment = async () => {
    const amountNumber = parseFloat(amount);
    const today = new Date().toISOString().split("T")[0];

    if (!amount || amountNumber <= 0 || isNaN(amountNumber)) {
      alert("Enter a valid amount.");
      return;
    }

    if (!paymentDate) {
      alert("Select a payment date.");
      return;
    }

    if (paymentDate > today) {
      alert("Payment date cannot be in the future.");
      return;
    }

    if (!window.confirm(`Confirm payment of ₹${amountNumber} via ${paymentMethod}?`)) {
      return;
    }

    try {
      setProcessing(true);
      await payPrincipal({
        id,
        amount: amountNumber,
        paymentDate,
        paymentMethod,
      });

      navigate(`/full-details/${id}`);
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to process payment.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p>Loading debtor details...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const minDate = debtor?.debtDate ? new Date(debtor.debtDate).toISOString().split("T")[0] : "";
  const isFullyPaid = parseFloat(debtor?.remainingBalance || 0) === 0;

  // Extract last payment date if available
  const lastPayment = debtor?.paymentHistory?.length
    ? debtor.paymentHistory[debtor.paymentHistory.length - 1]
    : null;

  return (
    <div className="container mt-4 position-relative " style={{ maxWidth: "800px" }}>
      {processing && (
        <div className="spinner-overlay">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      )}

      <h2 className="text-center mb-4">Pay Principal for {debtor?.name}</h2>

      {isFullyPaid ? (
        <div className="alert alert-success text-center fw-bold">
          Balance is already cleared. No payment needed.
        </div>
      ) : (
        <div className="card p-4 shadow-sm">
          <label className="form-label fw-bold">Enter Amount (₹)</label>
          <input
            type="number"
            className="form-control mb-3"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
          />

          <label className="form-label fw-bold">Payment Date</label>
          <input
            type="date"
            className="form-control mb-1"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            min={minDate}
            max={today}
          />

          {lastPayment?.date && (
            <div className="mb-3 text-muted text-end">
              Last Principal Payment:{" "}
              {new Date(lastPayment.date).toLocaleDateString("en-GB")}
            </div>
          )}

          <label className="form-label fw-bold">Payment Method</label>
          <select
            className="form-control mb-3"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="GPay">GPay</option>
          </select>

          <button
            className="btn btn-success w-100"
            onClick={handlePayment}
            disabled={processing}
          >
            Submit Payment
          </button>
        </div>
      )}

      <style>
        {`
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
        `}
      </style>
    </div>
  );
};

