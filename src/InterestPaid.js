import React, { useState, useEffect } from "react";
import { useDebtors } from "./DebtorContext";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

export const InterestPaid = () => {
  const {
    filteredDebtors,
    searchQuery,
    setSearchQuery,
    searchDebtorsById,
    selectedDebtor,
    setSelectedDebtor,
    payInterest,
  } = useDebtors();

  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState("");
  const [paidMonths, setPaidMonths] = useState([]);
  const [paidDate, setPaidDate] = useState(""); // Will be set on mount
  const [totalAmount, setTotalAmount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Reset form on component mount
  useEffect(() => {
    setSearchQuery("");
    setSelectedDebtor(null);
    setSelectedYear("");
    setPaidMonths([]);
    setTotalAmount(0);
    setPaidDate(""); // clear paid date
  }, [setSearchQuery, setSelectedDebtor]);

  // Set paidDate when debtor is selected
  useEffect(() => {
    if (!selectedDebtor) return;

    // Get last interest paid date if available
    if (selectedDebtor.interestPaidMonths?.length > 0) {
      const last = selectedDebtor.interestPaidMonths[selectedDebtor.interestPaidMonths.length - 1];
      if (last.date) {
        setPaidDate(new Date(last.date).toISOString().split("T")[0]);
        return;
      }
    }

    // Else, fallback to debt date
    if (selectedDebtor.debtDate) {
      setPaidDate(new Date(selectedDebtor.debtDate).toISOString().split("T")[0]);
    }
  }, [selectedDebtor]);

  const allYears = [2024, 2025, 2026];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getFormattedMonthsForYear = (year) => {
    return monthNames.map((month, index) => {
      const label = `${month}-${year.toString().slice(2)}`;
      const dateObj = new Date(year, index, 1);
      return { label, dateObj };
    });
  };

  const getDebtStartDate = () => {
    if (!selectedDebtor?.debtDate) return null;
    const debtDate = new Date(selectedDebtor.debtDate);
    return new Date(debtDate.getFullYear(), debtDate.getMonth(), 1);
  };

  const handleMonthChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setPaidMonths(selectedOptions);
    if (selectedDebtor) {
      setTotalAmount(selectedOptions.length * selectedDebtor.interestAmount);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedDebtor?.remainingBalance === 0) {
      alert("User balance is ₹0. No need to pay interest.");
      return;
    }

    if (!selectedDebtor || paidMonths.length === 0 || !paidDate) {
      alert("Please select a debtor, one or more months, and a paid date.");
      return;
    }

    const alreadyPaid = paidMonths.filter((month) =>
      selectedDebtor.interestPaidMonths?.some((entry) => entry.month === month)
    );

    if (alreadyPaid.length > 0) {
      alert(`Interest already paid for: ${alreadyPaid.join(", ")}`);
      return;
    }

    try {
      setProcessing(true);

      await payInterest({
        debtorId: selectedDebtor.id,
        paidMonths,
        paidDate,
        amount: selectedDebtor.interestAmount,
      });

      alert("✅ Interest paid successfully!");
      setSearchQuery("");
      setSelectedDebtor(null);
      setSelectedYear("");
      setPaidMonths([]);
      setTotalAmount(0);
      setPaidDate("");

      setTimeout(() => {
        navigate(`/full-details/${selectedDebtor.id}`);
      }, 500);
    } catch (err) {
      alert("❌ Failed to record interest payment.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Extract last interest paid date for display
  const lastInterestDate = selectedDebtor?.interestPaidMonths?.length
    ? selectedDebtor.interestPaidMonths[selectedDebtor.interestPaidMonths.length - 1].date
    : null;

  return (
    <div className="container mt-4 position-relative"  style={{ maxWidth: "800px" }} >
      {processing && (
        <div className="spinner-overlay">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      )}

      <h2 className="mb-4">Interest Paid</h2>

      <form onSubmit={handleSubmit} className="card p-4 shadow">
        {/* Search Input */}
        <div className="mb-3 position-relative">
          <label htmlFor="searchDebtor" className="form-label fw-bold">Search User by ID</label>
          <input
            id="searchDebtor"
            type="text"
            className="form-control"
            placeholder="Enter Unique ID"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchDebtorsById(e);
              setShowDropdown(true);
            }}
            onFocus={() => {
              searchDebtorsById({ target: { value: "" } });
              setShowDropdown(true);
            }}
          />
          {showDropdown && filteredDebtors.length > 0 && (
            <ul
              className="list-group position-absolute w-100"
              style={{ zIndex: 10, maxHeight: "200px", overflowY: "auto" }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {filteredDebtors.map((debtor) => (
                <li
                  key={debtor.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => {
                    setSelectedDebtor(debtor);
                    setSearchQuery(`${debtor.id} - ${debtor.name}`);
                    setShowDropdown(false);
                    setSelectedYear("");
                    setPaidMonths([]);
                    setTotalAmount(0);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {debtor.id} - {debtor.name} - ₹{debtor.interestAmount}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Year and Month Selection */}
        <div className="mb-3">
          <label htmlFor="yearSelect" className="form-label fw-bold">Select Year</label>
          <select
            id="yearSelect"
            className="form-control mb-2"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPaidMonths([]);
              setTotalAmount(0);
              setShowDropdown(false);
            }}
          >
            <option value="">-- Select Year --</option>
            {allYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {selectedYear && (
            <>
              <label htmlFor="monthSelect" className="form-label fw-bold">Select Months</label>
              <select
                id="monthSelect"
                multiple
                className="form-control"
                value={paidMonths}
                onChange={handleMonthChange}
                style={{ height: "200px" }}
              >
                {getFormattedMonthsForYear(selectedYear).map(({ label, dateObj }, index) => {
                  const debtStart = getDebtStartDate();
                  const isBeforeDebt = debtStart && dateObj < debtStart;
                  const alreadyPaid = selectedDebtor?.interestPaidMonths?.some(
                    (entry) => entry.month === label
                  );
                  return (
                    <option
                      key={index}
                      value={label}
                      disabled={isBeforeDebt || alreadyPaid}
                    >
                      {label} {alreadyPaid ? "(Paid)" : isBeforeDebt ? "(Before Debt)" : ""}
                    </option>
                  );
                })}
              </select>
              <div className="mt-2">
                <strong>Total Interest:</strong> ₹{totalAmount}
              </div>
            </>
          )}
        </div>

        {/* Paid Date */}
        <div className="mb-3">
          <label htmlFor="paidDate" className="form-label fw-bold">Interest Paid Date</label>
          <input
            id="paidDate"
            type="date"
            className="form-control"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
          {lastInterestDate && (
            <div className="mt-1 text-muted text-end">
              Last Interest Paid: {new Date(lastInterestDate).toLocaleDateString("en-GB")}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={processing}>
          Save Interest Payment
        </button>
      </form>

      {/* Debtor Details */}
      {selectedDebtor && (
        selectedDebtor.remainingBalance === 0 ? (
          <div className="card mt-4 p-3 shadow text-center bg-light">
            <h5 className="text-success fw-bold">✅ He has cleared all debt amount.</h5>
          </div>
        ) : (
          <div className="card mt-4 p-3 shadow">
            <h5>Selected Debtor Details:</h5>
            <p><strong>ID:</strong> {selectedDebtor.id}</p>
            <p><strong>Name:</strong> {selectedDebtor.name}</p>
            <p><strong>Interest Amount per Month:</strong> ₹{selectedDebtor.interestAmount}</p>
            <p><strong>Already Paid Months:</strong></p>
            <ul>
              {selectedDebtor.interestPaidMonths?.length > 0 ? (
                selectedDebtor.interestPaidMonths.map((item, index) => (
                  <li key={index}>
                    {item.month} - Paid on {item.date} - ₹{item.amount}
                  </li>
                ))
              ) : (
                <li>No months paid yet</li>
              )}
            </ul>
          </div>
        )
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


