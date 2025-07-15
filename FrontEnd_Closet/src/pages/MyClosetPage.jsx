// ✅ MyClosetPage.jsx
import { useEffect, useState } from "react";
import ClothCard from "../components/ClothCard";
import ClothDetailPanel from "../components/ClothDetailPanel";
import { useNavigate } from "react-router-dom";
import UnityViewer from "../components/UnityViewer";
import "./myClosetPage.css";

function MyClosetPage() {
  const [clothes, setClothes] = useState([]);
  const [selectedCloth, setSelectedCloth] = useState(null);
  const navigate = useNavigate();

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
          <h2>내 옷장</h2>
          <button className="register-button" onClick={() => navigate("/register-cloth")}>
            + 등록하기
          </button>
        </div>
        <div className="closet-card-list">
          {clothes.map((cloth) => (
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

      <div className="closet-unity-panel">
        {selectedCloth?.modelUrl ? (
          <UnityViewer modelUrl={selectedCloth.modelUrl} />
        ) : (
          <div className="no-model">👕 3D 모델링 정보가 없습니다.</div>
        )}
      </div>
    </div>
  );
}

export default MyClosetPage;