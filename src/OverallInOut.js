import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useDebtors } from "./DebtorContext";
import './App.css';

export const OverallInOut = () => {
  const { debtors } = useDebtors();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [totals, setTotals] = useState({ debt: 0, interest: 0, principal: 0 });
  const [loading, setLoading] = useState(true);

  const monthOrder = useMemo(() => [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ], []);

  useEffect(() => {
    if (debtors.length === 0) {
      setLoading(false);
      return;
    }

    const processTransactions = () => {
      let all = [];
      let monthSet = new Set();

      debtors.forEach((debtor) => {
        const date = new Date(debtor.currentDate);
        const monthYear = date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });

        monthSet.add(monthYear);
        all.push({
          id: debtor.id,
          name: debtor.name,
          address: debtor.address,
          amount: parseFloat(debtor.debtAmount || 0),
          date,
          formattedDate: date.toLocaleDateString("en-GB"),
          monthYear,
          type: "Debt Given",
          interestPaidMonth: "-",
          order: 1,
        });

        const interestMap = {};
        (debtor.interestPaidMonths || []).forEach((item) => {
          const d = new Date(item.date);
          const key = d.toDateString();
          const mY = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
          monthSet.add(mY);

          if (!interestMap[key]) {
            interestMap[key] = {
              id: debtor.id,
              name: debtor.name,
              address: debtor.address,
              amount: 0,
              date: d,
              formattedDate: d.toLocaleDateString("en-GB"),
              monthYear: mY,
              type: "Interest Paid",
              interestPaidMonths: [],
              order: 2,
            };
          }

          interestMap[key].amount += parseFloat(item.amount);
          interestMap[key].interestPaidMonths.push(item.month);
        });

        all.push(...Object.values(interestMap).map((i) => ({
          ...i,
          interestPaidMonth: i.interestPaidMonths.join(", "),
        })));

        (debtor.paymentHistory || []).forEach((p) => {
          const d = new Date(p.date);
          const mY = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
          monthSet.add(mY);

          all.push({
            id: debtor.id,
            name: debtor.name,
            address: debtor.address,
            amount: parseFloat(p.amount),
            date: d,
            formattedDate: d.toLocaleDateString("en-GB"),
            monthYear: mY,
            type: "Principal Paid",
            interestPaidMonth: "-",
            order: 3,
          });
        });
      });

      all.sort((a, b) => new Date(a.date) - new Date(b.date));
      const sortedMonths = [...monthSet].sort((a, b) => {
        const [monthA, yearA] = a.split(" ");
        const [monthB, yearB] = b.split(" ");
        const fullYearA = parseInt("20" + yearA);
        const fullYearB = parseInt("20" + yearB);
        if (fullYearA !== fullYearB) return fullYearA - fullYearB;
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
      });

      const todayMonth = new Date().toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      });

      setTransactions(all);
      setAvailableMonths(sortedMonths);
      setSelectedMonth(sortedMonths.includes(todayMonth) ? todayMonth : sortedMonths.at(-1) || "");
      setLoading(false);
    };

    processTransactions();
  }, [debtors, monthOrder]);

  useEffect(() => {
    const filtered = transactions.filter((txn) => txn.monthYear === selectedMonth);
    setFilteredTransactions(filtered);

    const total = { debt: 0, interest: 0, principal: 0 };
    filtered.forEach((txn) => {
      if (txn.type === "Debt Given") total.debt += txn.amount;
      else if (txn.type === "Interest Paid") total.interest += txn.amount;
      else if (txn.type === "Principal Paid") total.principal += txn.amount;
    });

    setTotals(total);
  }, [transactions, selectedMonth]);

  const toBase64 = (url) =>
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    });


const exportPDF = async () => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();

  const getFullMonthName = (shortMonthYear) => {
    const [shortMonth, shortYear] = shortMonthYear.split(" ");
    const shortToIndex = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const monthIndex = shortToIndex[shortMonth];
    const fullYear = 2000 + parseInt(shortYear);
    const date = new Date(fullYear, monthIndex);
    return date.toLocaleString("en-GB", { month: "long", year: "numeric" });
  };

  const fullMonthName = getFullMonthName(selectedMonth);

  let imageHeight = 0;
  try {
    const imgData = await toBase64(`${process.env.PUBLIC_URL}/015-05.jpg`);
    const img = new Image();
    img.src = imgData;

    await new Promise((resolve) => {
      img.onload = () => {
        const maxWidth = 40;
        const maxHeight = 20;
        let width = maxWidth;
        let height = (img.height / img.width) * width;
        if (height > maxHeight) {
          height = maxHeight;
          width = (img.width / img.height) * height;
        }
        imageHeight = height;
        pdf.addImage(imgData, "JPEG", 10, 8, width, height);
        resolve();
      };
    });
  } catch (error) {
    console.error("Image load failed:", error);
  }

  pdf.setFontSize(15);
  pdf.setTextColor(40, 40, 150);
  pdf.setFont(undefined, "bold");
  pdf.text(`${fullMonthName} Overall In & Out Summary`, 60, 15);

  pdf.setFontSize(9);
  pdf.setTextColor(90);
  const generatedText = `Generated on: ${new Date().toLocaleString("en-GB")}`;
  const textWidth = pdf.getTextWidth(generatedText);
  pdf.text(generatedText, pageWidth - textWidth - 10, 8 + imageHeight);

  const tableColumn = ["ID", "Date", "Name", "Address", "Interest Month", "Type", "Amount"];
  const tableRows = filteredTransactions.map((txn) => [
    txn.id,
    txn.formattedDate,
    txn.name,
    txn.address,
    txn.interestPaidMonth,
    txn.type,
    `Rs.${txn.amount.toFixed()}/-`
  ]);

  autoTable(pdf, {
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      halign: "center",
      valign: "middle",
      textColor: [0, 0, 0],
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [220, 230, 255],
      textColor: 20,
      fontStyle: "bold",
    },
    theme: "grid",
    margin: { top: 20, left: 10, right: 10 },
    didDrawPage: (data) => {
      const pageCount = pdf.internal.getNumberOfPages();
      pdf.setFontSize(8);
      pdf.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pdf.internal.pageSize.getWidth() - 30,
        pdf.internal.pageSize.getHeight() - 10
      );
    },
  });


  
const finalY = pdf.lastAutoTable.finalY + 10;
const fontSize = 9;

// Box background settings
const boxY = finalY - 5;         // slightly above text line
const boxHeight = 8;
const boxWidth = pdf.internal.pageSize.getWidth() - 20; // full width with margin
const boxX = 10;

pdf.setFillColor(220, 230, 255); // Light blue-gray background
pdf.rect(boxX, boxY, boxWidth, boxHeight, "F"); // "F" = filled rectangle


const label1X = 14;
const label2X = 80;
const label3X = 150;
const y = finalY;

pdf.setFontSize(fontSize);
pdf.setTextColor(0);

// 1. Total Debt
pdf.setFont(undefined, "bold");
pdf.text("Total Debt Given:", label1X, y);
pdf.setFont(undefined, "bold");
pdf.text(`Rs.${totals.debt.toFixed()} /-`, label1X + 30, y);

// 2. Total Principal
pdf.setFont(undefined, "bold");
pdf.text("Total Principal Paid:", label2X, y);
pdf.setFont(undefined, "bold");
pdf.text(`Rs.${totals.principal.toFixed()} /-`, label2X + 35, y);

// 3. Total Interest
pdf.setFont(undefined, "bold");
pdf.text("Total Interest Paid:", label3X, y);
pdf.setFont(undefined, "bold");
pdf.text(`Rs.${totals.interest.toFixed()} /-`, label3X + 33, y);

  pdf.save(`transactions_${fullMonthName.replace(" ", "_")}.pdf`);
};


 



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading overall data...</p>
        </div>
      </div>
    );
  }

  const getFullMonthName = (shortMonthYear) => {
  if (!shortMonthYear) return "";
  const [shortMonth, shortYear] = shortMonthYear.split(" ");
  const shortToIndex = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const monthIndex = shortToIndex[shortMonth];
  const fullYear = 2000 + parseInt(shortYear);
  const date = new Date(fullYear, monthIndex);
  return date.toLocaleString("en-GB", { month: "long", year: "numeric" });
};


  const noDebtors = debtors.length === 0;

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
<h4 className="text-primary m-0">
  {getFullMonthName(selectedMonth)} Overall In & Out Summary
</h4>

        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-success btn-sm" onClick={exportPDF} disabled={noDebtors}>
            <i className="bi bi-download"></i> Export as PDF
          </button>
          <select
            className="form-select form-select-sm"
            style={{ width: "200px" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={noDebtors}
          >
            {availableMonths.map((month, idx) => (
              <option key={idx} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {noDebtors ? (
        <div className="text-center">
          <p className="fs-5 text-muted">No debtors found.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 text-center">
            <h5 className="fw-semibold">Transactions for {selectedMonth}</h5>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-sm mb-0 text-break align-middle text-center" style={{ borderColor: "black" }}>
              <thead className="thead-gold sticky-top bg-warning-subtle" style={{ top: 0, zIndex: 1, borderColor: "black" }}>
                <tr>
                  {["ID", "Date", "Name", "Address", "Interest Month", "Type", "Amount"].map((header) => (
                    <th key={header} className="text-nowrap" style={{ border: "1px solid black" }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-3">
                      No transactions found for selected month.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn, idx) => {
                    const isPrincipal = txn.type === "Principal Paid";
                    let rowClass = "";
                    if (txn.type === "Debt Given") rowClass = "table-danger";
                    else if (txn.type === "Principal Paid") rowClass = "table-dark";
                    else if (txn.type === "Interest Paid") rowClass = "table-primary";

                    return (
                      <tr key={idx} className={rowClass} style={{ borderColor: "black" }}>
                        <td className={`text-nowrap ${isPrincipal ? "text-white" : ""}`} style={{ border: "1px solid black" }}>{txn.id}</td>
                        <td className={`text-nowrap ${isPrincipal ? "text-white" : ""}`} style={{ border: "1px solid black" }}>{txn.formattedDate}</td>
                        <td className={`fw-bold text-nowrap ${isPrincipal ? "text-white" : "text-dark"}`} style={{ border: "1px solid black" }}>{txn.name}</td>
                        <td className={`${isPrincipal ? "text-white" : ""}`} style={{ border: "1px solid black" }}>{txn.address}</td>
                        <td className={`${isPrincipal ? "text-white" : ""}`} style={{ border: "1px solid black" }}>
                          {(txn.interestPaidMonth || "")
                            .split(", ")
                            .reduce((acc, curr, index) => {
                              const groupIndex = Math.floor(index / 8);
                              if (!acc[groupIndex]) acc[groupIndex] = [];
                              acc[groupIndex].push(curr);
                              return acc;
                            }, [])
                            .map((group, i) => (
                              <div key={i}>{group.join(", ")}</div>
                            ))}
                        </td>
                        <td className={`text-nowrap ${isPrincipal ? "text-white" : ""}`} style={{ border: "1px solid black" }}>{txn.type}</td>
                        <td className={`text-nowrap ${isPrincipal ? "text-white" : ""}`} style={{ border: "1px solid black" }}>₹{txn.amount}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="row text-center mt-4 g-2">
            <div className="col-md-4">
              <div className="p-2 bg-danger-subtle rounded shadow-sm">
                <strong>Total Debt Given:</strong>
                <div className="text-danger fw-bold">₹{totals.debt.toFixed(2)}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-2 bg-dark-subtle rounded shadow-sm">
                <strong>Total Principal Paid:</strong>
                <div className="text-dark fw-bold">₹{totals.principal.toFixed(2)}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-2 bg-primary-subtle rounded shadow-sm">
                <strong>Total Interest Paid:</strong>
                <div className="text-primary fw-bold">₹{totals.interest.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
