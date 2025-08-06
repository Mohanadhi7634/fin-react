import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const DebtorContext = createContext();
export const useDebtors = () => useContext(DebtorContext);

export const DebtorProvider = ({ children }) => {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDebtors, setFilteredDebtors] = useState([]);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
   const [lastLogout, setLastLogout] = useState(null);

  const getAllDebtors = useCallback(async () => {
    try {
      const res = await axios.get("https://fin-nodejs.onrender.com/api/debtors");
      setDebtors(res.data);
    } catch (err) {
      console.error("Error fetching debtors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDebtorById = async (id) => {
    const found = debtors.find((d) => d._id === id || d.id === id);
    if (found) return found;
    const res = await axios.get(`https://fin-nodejs.onrender.com/api/debtors/${id}`);
    return res.data;
  };

  const payInterest = async ({ debtorId, paidMonths, paidDate, amount }) => {
    await axios.post("https://fin-nodejs.onrender.com/api/debtors/pay-interest", {
      debtorId,
      paidMonths,
      paidDate,
      amount,
    });
    await getAllDebtors();
  };

  const payPrincipal = async ({ id, amount, paymentDate, paymentMethod }) => {
    await axios.post(`https://fin-nodejs.onrender.com/api/debtors/${id}/pay-principal`, {
      amount,
      paymentDate,
      paymentMethod,
    });
    await getAllDebtors();
  };

const prepareFormData = (debtorData) => {
  const formData = new FormData();

  for (const key in debtorData) {
    if (key === "photo" && debtorData.photo instanceof File) {
      formData.append("photo", debtorData.photo, debtorData.photo.name);
    } else if (key === "bondPapers" && Array.isArray(debtorData.bondPapers)) {
      debtorData.bondPapers.forEach(file => {
        if (file instanceof File) {
          formData.append("bondPapers", file, file.name);
        }
      });
    } else if (key === "checkLeaves" && Array.isArray(debtorData.checkLeaves)) {
      debtorData.checkLeaves.forEach(file => {
        if (file instanceof File) {
          formData.append("checkLeaves", file, file.name);
        }
      });
    } else {
      formData.append(key, debtorData[key]);
    }
  }

  return formData;
};



const addDebtor = async (debtorData) => {
  const formData = prepareFormData(debtorData);
  await axios.post("https://fin-nodejs.onrender.com/api/debtors/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  await getAllDebtors();
};

const updateDebtor = async (id, updatedData) => {
  const formData = prepareFormData(updatedData);
  await axios.post(`https://fin-nodejs.onrender.com/api/debtors/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  await getAllDebtors();
};


  const deleteDebtor = async (id) => {
    await axios.delete(`https://fin-nodejs.onrender.com/api/debtors/${id}`);
    await getAllDebtors();
  };

  const searchDebtorsById = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = debtors.filter((debtor) =>
      debtor.id?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDebtors(filtered);
  };

    const loginUser = async (username, password) => {
    const res = await axios.post("https://fin-nodejs.onrender.com/api/users/login", {
      username,
      password,
    });
    return res.data; // Return user object from response
  };

const fetchAdminLastLogout = async (username = "mohan") => {
  try {
    const res = await axios.get(
      `https://fin-nodejs.onrender.com/api/users/last-logout/${username.toLowerCase()}`
    );
    if (res.data.lastLogout) {
      const formatted = new Date(res.data.lastLogout).toLocaleString();
      setLastLogout(formatted);
      return formatted;
    }
  } catch (err) {
    console.error("Failed to fetch admin last logout:", err.message);
    return null;
  }
};



    const logoutUser = async (userId, username) => {
    try {
      await axios.post("https://fin-nodejs.onrender.com/api/users/logout", {
        userId,
        username: username?.toLowerCase(),
      });
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };


  useEffect(() => {
    getAllDebtors();
  }, [getAllDebtors]);

  return (
    <DebtorContext.Provider
      value={{
        debtors,
        loading,
        getAllDebtors,
        getDebtorById,
        payInterest,
        payPrincipal,
        addDebtor,
        updateDebtor,
        deleteDebtor,
        searchQuery,
        setSearchQuery,
        filteredDebtors,
        searchDebtorsById,
        selectedDebtor,
        setSelectedDebtor,
        // new centralized login helpers
        logoutUser,
        loginUser,
        fetchAdminLastLogout,
        lastLogout,
        
      }}
    >
      {children}
    </DebtorContext.Provider>
  );
};
