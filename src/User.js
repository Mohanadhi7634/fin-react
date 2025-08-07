import React, { useEffect, useMemo, useCallback,useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useDebtors } from "./DebtorContext";
import "./App.css";

export const User = () => {
  const { debtors, loading, getAllDebtors ,  fetchAdminLastLogout, lastLogout } = useDebtors();
  const [blurTotals, setBlurTotals] = useState(false);


  const navigate = useNavigate();



useEffect(() => {
  getAllDebtors();
  fetchAdminLastLogout("mohan"); // always fetch 'mohan' admin's logout
}, [getAllDebtors, fetchAdminLastLogout]);



  const handleNavigateToDetails = useCallback(
    (id) => navigate(`/full-details/${id}`),
    [navigate]
  );



  const totalRemainingBalance = useMemo(
    () =>
      debtors.reduce(
        (total, debtor) =>
          total +
          (isNaN(parseFloat(debtor.remainingBalance))
            ? isNaN(parseFloat(debtor.debtAmount))
              ? 0
              : parseFloat(debtor.debtAmount)
            : parseFloat(debtor.remainingBalance)),
        0
      ),
    [debtors]
  );

  const totalInterestAmount = useMemo(
    () =>
      debtors.reduce(
        (total, debtor) =>
          total + (isNaN(parseFloat(debtor.interestAmount)) ? 0 : parseFloat(debtor.interestAmount)),
        0
      ),
    [debtors]
  );

const toBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject("Failed to convert image to base64.");
    });
  } catch (error) {
    console.warn("Image fetch failed:", error);
    return null; // Return null if image fails to load
  }
};


const exportPDF = async () => {
  const pdf = new jsPDF("landscape", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Load and place image on top-left
   // Optional: Image
  const imgData = await toBase64(`${process.env.PUBLIC_URL}/015-05.jpg`);
  if (imgData) {
    const img = new Image();
    img.src = imgData;

    await new Promise((resolve) => {
      img.onload = () => {
        const maxWidth = 50, maxHeight = 25;
        let imgWidth = maxWidth;
        let imgHeight = (img.height / img.width) * imgWidth;
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (img.width / img.height) * imgHeight;
        }
        pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
        resolve();
      };
    });
  } else {
    console.log("Skipping image in PDF - image not found.");
  }

  // Centered and styled headings
  const title = "ADHIKESAVAN FINANCE ";
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 102, 204);
  const titleX = (pageWidth - pdf.getTextWidth(title)) / 2;
  pdf.text(title, titleX, 20);

  const subtitle = `Details of outstanding amount and persons as on ${moment().format("MMMM YYYY")}`;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  const subtitleX = (pageWidth - pdf.getTextWidth(subtitle)) / 2;
  pdf.text(subtitle, subtitleX, 27);

  // "Generated on" to top-right
  const generatedText = `Generated on: ${moment().format("DD MMM YYYY, h:mm A")}`;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  const textWidth = pdf.getTextWidth(generatedText);
  pdf.text(generatedText, pageWidth - textWidth - 10, 34);

  // Table setup
  const tableColumn = [
    "#", "Debt Date", "Name", "Address", "Mobile",
    "Original Debt", "Remaining", "Interest %", "Interest Amt", "Interest Paid", "Status"
  ];

  const tableRows = debtors.map((debtor, index) => {
    const paidMonths = (debtor.interestPaidMonths || []).map((item) => item.month).join(", ");
    return [
      debtor.id || index + 1,
      moment(debtor.debtDate).format("DD/MM/YYYY"),
      debtor.name,
      debtor.address,
      debtor.mobile,
      `${debtor.originalDebtAmount || debtor.debtAmount}`,
      `${debtor.remainingBalance}`,
      `${debtor.interestRate}%`,
      `${debtor.interestAmount}`,
      paidMonths || "No payments",
      parseFloat(debtor.remainingBalance) === 0 ? "PAID" : "Pending",
    ];
  });

  tableRows.push([
    { content: "Total", colSpan: 6, styles: { halign: "right", fontStyle: "bold", fontSize: 11 } },
    { content: `${totalRemainingBalance.toFixed()}`, styles: { fontStyle: "bold", fontSize: 11 } },
    { content: "", styles: { fontStyle: "bold", fontSize: 9 } },
    { content: `${totalInterestAmount.toFixed()}`, styles: { fontStyle: "bold", fontSize: 11 } },
    { content: "", colSpan: 2, styles: { fontStyle: "bold", fontSize: 9 } }
  ]);

  autoTable(pdf, {
    startY: 38,
    head: [tableColumn],
    body: tableRows,
    styles: {
      fontSize: 10,
      cellPadding: 1.8,
      overflow: "linebreak",
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      textColor: 20,
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
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

  pdf.save("DebtorsReport.pdf");
};







  return (
    <div>


<div className="container-fluid px-3 px-md-5 mt-4">

  {loading ? (
    <div className="text-center p-5">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-3 fs-5">Loading debtors...</p>
    </div>
  ) : (
    <>
{/* Header */}
<div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-3 border-bottom pb-2">
  {/* Left: Image */}
  <div className="text-center text-md-start">
    <img
      src={`${process.env.PUBLIC_URL}/015-05.jpg`}
      alt="Debtor Logo"
      className="img-fluid"
      style={{ maxHeight: "100px", objectFit: "contain" }}
    />
  </div>

  {/* Middle: Title */}
<div className="text-center text-md-start flex-grow-1">
  <h4 className="text-primary fw-bold mb-1">Debtor List</h4>
  <p className="text-muted mb-0 text-nowrap text-truncate">
    Overview of outstanding payments
  </p>
</div>


  {/* Right: Buttons */}
<div className="w-100 w-md-auto">
  <div className="d-flex flex-row flex-md-column justify-content-between align-items-center align-items-md-end gap-2">
    
    {/* Export Button */}
    <button
      className="btn btn-success d-flex align-items-center gap-2 px-3 py-2"
      onClick={exportPDF}
      disabled={debtors.length === 0}
      style={{
        fontSize: "0.875rem",
        width: "125px",          // fixed width
        whiteSpace: "nowrap"     // prevents wrapping
      }}
    >
      <i className="bi bi-file-earmark-arrow-down "></i>
      <span className="fw-semibold">Export PDF</span>
    </button>

    {/* Blur Toggle */}
    <div className="form-check form-switch d-flex align-items-center m-0">
      <input
        className="form-check-input"
        type="checkbox"
        id="blurToggle"
        checked={blurTotals}
        onChange={() => setBlurTotals(!blurTotals)}
      />
      <label
        className="form-check-label ms-2 text-muted small"
        htmlFor="blurToggle"
      >
        Blur Totals
      </label>
    </div>
  </div>
</div>

</div>




{/* Info Banner */}
{lastLogout && (
  <div className="mb-2">
    <div className="alert alert-info py-1 px-2 mb-1 text-primary text-center rounded-2 fw-semibold fs-6">
      Details of outstanding amount and persons as on <strong>{moment().format("MMMM YYYY")}</strong>
    </div>

    <div className="text-end text-muted small pe-1">
      <strong>Last Admin Logout:</strong> {lastLogout}
    </div>
  </div>
)}




      {/* Table */}
      <div className="card shadow border-0">
        <div className="card-body p-0">
          {debtors.length === 0 ? (
            <div className="alert alert-warning text-center m-3 fs-5">
              No debtors found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered mb-0 text-center align-middle">
                <thead className="table-primary sticky-top shadow-sm fs-6" style={{ top: 0, zIndex: 1 }}>

                  <tr>
                    <th>ID</th>
                    <th>Debt Date</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Mobile</th>
                    <th>Original Debt</th>
                    <th>Remaining Balance</th>
                    <th>Interest Rate (%)</th>
                    <th>Interest Amount</th>
                    <th className="text-start ps-3">Interest Paid</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.map((debtor, index) => {
                    const isAccountClosed = parseFloat(debtor.remainingBalance) === 0;
                    return (
                      <tr
                        key={debtor._id || index}
                        style={{ opacity: isAccountClosed ? 0.6 : 1 }}
                      >
                        <td>{debtor.id}</td>
                        <td>{moment(debtor.debtDate).format("DD/MM/YYYY")}</td>
                        <td>{debtor.name}</td>
                        <td>{debtor.address}</td>
                        <td>{debtor.mobile}</td>
                        <td>₹{(debtor.originalDebtAmount || debtor.debtAmount)?.toFixed()}</td>
                        <td>₹{debtor.remainingBalance?.toFixed()}</td>
                        <td>{debtor.interestRate}%</td>
                        <td>₹{debtor.interestAmount?.toFixed()}</td>
                        <td className="text-start" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {debtor.interestPaidMonths?.length ? (
                            debtor.interestPaidMonths.map((item) => item.month).join(", ")
                          ) : (
                            <small className="text-muted">No payments</small>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill fw-semibold ${
                              isAccountClosed ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"
                            }`}
                          >
                            {isAccountClosed ? "PAID" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleNavigateToDetails(debtor._id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
 <tfoot className="table-light fw-bold">
  <tr>
    <td colSpan="6" className="text-end">Total</td>
    <td className={blurTotals ? "blurred-text" : ""}>
      ₹{totalRemainingBalance}
    </td>
    <td></td>
    <td className={blurTotals ? "blurred-text" : ""}>
      ₹{totalInterestAmount}
    </td>
    <td colSpan="3"></td>
  </tr>
</tfoot>

              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )}
</div>



 </div>
  );
};


































