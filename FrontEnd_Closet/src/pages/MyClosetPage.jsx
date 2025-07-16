// ✅ MyClosetPage.jsx
import { useEffect, useState } from "react";
import ClothCard from "../components/ClothCard";
import ClothDetailPanel from "../components/ClothDetailPanel";
import { useNavigate } from "react-router-dom";
import UnityViewer from "../components/UnityViewer";
import "./myClosetPage.css";
import ClothRegisterPage from "./ClothRegisterPage";
import Modal from "../components/Modal";
import WeatherInfoPanel from "../components/WeatherInfoPanel"

function MyClosetPage() {
  const [clothes, setClothes] = useState([]);
  const [selectedCloth, setSelectedCloth] = useState(null);
  const navigate = useNavigate();
  const [category, setCategory] = useState("all")
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const fetchClothes = async (selectedId = null) => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/api/cloth", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await res.json();
    setClothes(data);

    if (selectedId) {
      const found = data.find((c) => c._id === selectedId);
      if (found) setSelectedCloth(found);
    }
  };

  useEffect(() => {
    fetchClothes();
  }, []);

  const filteredClothes = category === "all"
  ? clothes
  : clothes.filter((cloth) => cloth.category === category);

  const handleEdit = (cloth) => {
    const latest = clothes.find((c) => c._id === cloth._id);
    setSelectedCloth(latest || cloth);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/api/cloth", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ ids: [id] }),
    });

    if (res.ok) {
      setClothes((prev) => prev.filter((c) => c._id !== id));
      if (selectedCloth?._id === id) setSelectedCloth(null);
    }
  };

  return (
    <div className="closet-container">
      <div className="closet-left">
        <div className="closet-header">
          <h2>MY CLOSET</h2>
          <button className="register-button" onClick={() => setShowRegisterModal(true)}>
            ENROLL
          </button>
        </div>
        <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="categoryFilter"
          >
            <option value="all">ALL</option>
            <option value="top">TOP</option>
            <option value="bottom">BOTTOM</option>
          </select>
        <div className="closet-card-list">
          {filteredClothes.map((cloth) => (
            <ClothCard
              key={cloth._id}
              cloth={cloth}
              onEdit={handleEdit}
              isSelected={selectedCloth?._id === cloth._id}
            />
          ))}
        </div>
      </div>

      <ClothDetailPanel
        cloth={selectedCloth}
        onUpdate={(updated) => {
          setSelectedCloth(null);
          fetchClothes(updated._id);
        }}
        onDelete={(id) => {
          setClothes((prev) => prev.filter((c) => c._id !== id));
          setSelectedCloth(null);
        }}
      />

      {/* <div className="weatherInfoPanel">
        <WeatherInfoPanel></WeatherInfoPanel>
      </div> */}

      {showRegisterModal && (
        <Modal onClose={() => setShowRegisterModal(false)}>
          <ClothRegisterPage onSuccess={()=>fetchClothes()} onClose={() => setShowRegisterModal(false)} />
        </Modal>
      )}
    </div>
  );
}

export default MyClosetPage;