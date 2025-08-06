import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useDebtors } from "./DebtorContext";

export const Admin = () => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    address: "",
    mobile: "",
    photo: null,
    debtAmount: "",
    debtDate: "",
    currentDate: new Date().toISOString().split("T")[0],
    interestRate: "",
    interestAmount: "",
    bondPapers: [],
    checkLeaves: [],
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [bondPreviews, setBondPreviews] = useState([]);
  const [checkPreviews, setCheckPreviews] = useState([]);
  const [mobileError, setMobileError] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editIndex = searchParams.get("editIndex");
  const { getDebtorById, addDebtor, updateDebtor } = useDebtors();

useEffect(() => {
  const loadData = async () => {
    if (!editIndex) return;

    try {
      const data = await getDebtorById(editIndex);
      setFormData((prev) => ({ ...prev, ...data }));

      // ✅ Set image previews from URLs
      if (data.photo?.url) {
        setImagePreview(data.photo.url);
      }

      if (Array.isArray(data.bondPapers)) {
        const previews = data.bondPapers.map((item) => item.url);
        setBondPreviews(previews);
      }

      if (Array.isArray(data.checkLeaves)) {
        const previews = data.checkLeaves.map((item) => item.url);
        setCheckPreviews(previews);
      }
    } catch (err) {
      console.error("Error loading debtor data", err);
    }
  };

  loadData();
}, [editIndex, getDebtorById]);




  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    if (name === "debtAmount" || name === "interestRate") {
      const amount = parseFloat(updated.debtAmount) || 0;
      const rate = parseFloat(updated.interestRate) || 0;
      updated.interestAmount = ((rate / 100) * amount).toFixed(2);
    }

    if (name === "mobile") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
      setMobileError(value.length < 10 ? "Mobile number must be 10 digits" : "");
    }

    setFormData(updated);
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, [type]: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "photo") setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

const handleMultiImageUpload = (e, type) => {
  let files = Array.from(e.target.files);

  // ✅ Allow only up to 5 files
  if (files.length > 6) {
    alert("You can select a maximum of 5 photos.");
    files = files.slice(0, 5); // Keep only first 5 files
  }

  setFormData((prev) => ({ ...prev, [type]: files }));

  Promise.all(
    files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    )
  ).then((previews) => {
    if (type === "bondPapers") setBondPreviews(previews);
    if (type === "checkLeaves") setCheckPreviews(previews);
  });
};


const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const requiredFields = {
    name: "Name",
    address: "Address",
    mobile: "Mobile",
    debtDate: "Debt Date",
    debtAmount: "Debt Amount",
    interestRate: "Interest Rate",
    photo: "Photo"
  };

  // 🔍 Check for empty required fields
  for (const field in requiredFields) {
    if (
      !formData[field] ||
      (typeof formData[field] === "string" && formData[field].trim() === "")
    ) {
      alert(`${requiredFields[field]} is required`);
      setLoading(false);
      return;
    }

    // Extra check for file upload (photo)
    if (field === "photo") {
      if (typeof formData.photo === "object" && !formData.photo.name) {
        alert("Photo is required");
        setLoading(false);
        return;
      }
    }
  }

  let newId = formData.id;

  // Generate new ID if not editing
  if (!editIndex) {
    try {
      const res = await fetch("https://fin-nodejs.onrender.com/api/debtors");
      const all = await res.json();
      const existing = all.map((d) => parseInt(d.id)).filter((id) => !isNaN(id));
      const max = Math.max(...existing, 0);
      const nextId = String(max + 1).padStart(3, "0");
      if (parseInt(nextId) > 999) throw new Error("ID limit reached");
      newId = nextId;
    } catch (err) {
      alert("Error fetching debtors");
      setLoading(false);
      return;
    }
  }

  const payload = { ...formData, id: newId };

  try {
    if (editIndex) await updateDebtor(editIndex, payload);
    else await addDebtor(payload);
    alert(editIndex ? "Updated" : "Added");
    navigate("/user");
  } catch (err) {
    console.error("Submit error", err);
    alert("Failed to submit");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container mt-4 position-relative">
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.6)", zIndex: 1050 }}
        >
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
          <p className="mt-2 fw-bold text-dark">Submitting...</p>
        </div>
      )}

      <div className="row g-3 align-items-center mb-4">
        <div className="col-12 col-md-4">
          <div className="text-center text-md-start">
            <h4 className="fw-bold m-0">Admin Panel</h4>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="d-flex flex-row flex-wrap justify-content-center justify-content-md-end align-items-center gap-2">
            <button
              className="btn btn-primary px-3 py-2"
              style={{ minWidth: "120px" }}
              onClick={() => navigate("/create-user")}
            >
              + Add User
            </button>
            <input
              type="date"
              className="form-control"
              style={{ maxWidth: "180px", width: "100%" }}
              name="currentDate"
              value={formData.currentDate}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className={`card p-4 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        <input className="form-control mb-3" name="name" placeholder="Name" value={formData.name} onChange={handleChange} disabled={loading} />
        <input className="form-control mb-3" name="address" placeholder="Address" value={formData.address} onChange={handleChange} disabled={loading} />
        <input className="form-control mb-3" name="mobile" type="tel" placeholder="Mobile" value={formData.mobile} onChange={handleChange} disabled={loading} />
        {mobileError && <small className="text-danger">{mobileError}</small>}
        <input className="form-control mb-3" name="debtDate" type="date"  value={formData.debtDate} onChange={handleChange} disabled={loading} />
        <input className="form-control mb-3" name="debtAmount" type="number" placeholder="Debt Amount" value={formData.debtAmount} onChange={handleChange} disabled={loading} />
        <input className="form-control mb-3" name="interestRate" type="number" placeholder="Interest Rate (%)" value={formData.interestRate} onChange={handleChange} disabled={loading} />
        <input className="form-control mb-3" name="interestAmount" type="text" placeholder="Interest Amount" value={formData.interestAmount} readOnly />

  <div className="mb-2">

  <div className="custom-file-input-wrapper">
    <label htmlFor="photo" className="btn btn-outline-secondary w-100 text-start">
      {formData.photo ? formData.photo.name : " Select debtor photo"}
    </label>
    <input
      id="photo"
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      onChange={(e) => handleImageUpload(e, "photo")}
      disabled={loading}
    />
  </div>
</div>

        {imagePreview && (
          <>
            <img src={imagePreview} alt="Preview" className="mb-1" style={{ width: "100px" }} />
            {formData.photo && <div className="text-muted small mb-3">Selected Photo: {formData.photo.name}</div>}
          </>
        )}

<div className="custom-file-input-wrapper mb-2">
  <label htmlFor="bondPapers" className="btn btn-outline-secondary w-100 text-start">
    {formData.bondPapers?.length > 0
      ? `${formData.bondPapers.length} Bond Paper(s) selected`
      : "Select Bond Papers"}
  </label>
  <input
    id="bondPapers"
    type="file"
    accept="image/*"
    multiple
    style={{ display: "none" }}
    onChange={(e) => handleMultiImageUpload(e, "bondPapers")}
    disabled={loading}
  />
</div>

{/* Preview thumbnails */}
{bondPreviews.map((img, index) => (
  <img key={index} src={img} alt="Bond" style={{ width: "100px", margin: "5px" }} />
))}

{/* List of selected file names */}
{formData.bondPapers?.length > 0 && (
  <div className="text-muted small mb-3">
    Selected Bond Papers:
    <ul className="mb-0">
      {formData.bondPapers.map((file, i) => (
        <li key={i}>{file.name}</li>
      ))}
    </ul>
  </div>
)}


<div className="custom-file-input-wrapper mb-2">
  <label htmlFor="checkLeaves" className="btn btn-outline-secondary w-100 text-start">
    {formData.checkLeaves?.length > 0
      ? `${formData.checkLeaves.length} Check Leaf${formData.checkLeaves.length > 1 ? "s" : ""} selected`
      : "Select Check Leaves"}
  </label>
  <input
    id="checkLeaves"
    type="file"
    accept="image/*"
    multiple
    style={{ display: "none" }}
    onChange={(e) => handleMultiImageUpload(e, "checkLeaves")}
    disabled={loading}
  />
</div>

{/* Preview thumbnails */}
{checkPreviews.map((img, index) => (
  <img key={index} src={img} alt="Check" style={{ width: "100px", margin: "5px" }} />
))}

{/* List of selected file names */}
{formData.checkLeaves?.length > 0 && (
  <div className="text-muted small mb-3">
    Selected Check Leaves:
    <ul className="mb-0">
      {formData.checkLeaves.map((file, i) => (
        <li key={i}>{file.name}</li>
      ))}
    </ul>
  </div>
)}


        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {editIndex ? "Update" : "Add"} Debtor
        </button>
      </div>
    </div>
  );
};


