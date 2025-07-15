import { useState, useEffect } from "react";

function ClothDetailPanel({ cloth, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    style: "casual",
    category: "top",
    size: "M",
    color: "",
  });

  // cloth가 바뀔 때마다 form 초기화
  useEffect(() => {
  if (!cloth || !cloth._id) return;

  const clothColorString = (cloth.color || []).join(", ");
  const newForm = {
    name: cloth.name || "",
    description: cloth.description || "",
    style: cloth.style || "casual",
    category: cloth.category || "top",
    size: cloth.size || "M",
    color: clothColorString,
  };

  setForm(newForm);
  setEditMode(false);
}, [cloth?._id]); // <- 이게 핵심!


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    const updatedData = {
      ...form,
      color: form.color
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    };

    const res = await fetch(`http://localhost:3000/api/cloth/${cloth._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setEditMode(false);
    } else {
      alert("수정 실패");
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3000/api/cloth/${cloth._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      onDelete(cloth._id);
    } else {
      alert("삭제 실패");
    }
  };

  if (!cloth) {
    return (
      <div className="closet-detail-panel">
        <p className="closet-placeholder">왼쪽에서 옷을 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="closet-detail-panel">
      <img
        src={`http://localhost:3000${cloth.imageUrl}`}
        alt="옷 이미지"
        className="detail-image"
      />

      {editMode ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <label>이름:</label>
          <input name="name" value={form.name} onChange={handleChange} className="detail-input" />

          <label>설명:</label>
          <input name="description" value={form.description} onChange={handleChange} className="detail-input" />

          <label>스타일:</label>
          <select name="style" value={form.style} onChange={handleChange} className="detail-input">
            <option value="casual">캐주얼</option>
            <option value="formal">포멀</option>
            <option value="sporty">스포티</option>
            <option value="street">스트리트</option>
            <option value="other">기타</option>
          </select>

          <label>카테고리:</label>
          <select name="category" value={form.category} onChange={handleChange} className="detail-input">
            <option value="top">상의</option>
            <option value="bottom">하의</option>
          </select>

          <label>사이즈:</label>
          <select name="size" value={form.size} onChange={handleChange} className="detail-input">
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="2XL">2XL</option>
          </select>

          <label>색상 (쉼표로 구분):</label>
          <input
            name="color"
            value={form.color}
            onChange={handleChange}
            className="detail-input"
            placeholder="white, black"
          />

          <button type="submit" className="detail-button save">저장</button>
          <button type="button" onClick={() => setEditMode(false)} className="detail-button">취소</button>
        </form>
      ) : (
        <div>
          <p><strong>이름:</strong> {form.name || "-"}</p>
          <p><strong>설명:</strong> {form.description || "-"}</p>
          <p><strong>스타일:</strong> {form.style}</p>
          <p><strong>카테고리:</strong> {form.category}</p>
          <p><strong>사이즈:</strong> {form.size}</p>
          <p><strong>색상:</strong> {form.color}</p>

          <button onClick={() => setEditMode(true)} className="detail-button">수정</button>
        </div>
      )}

      <button onClick={handleDelete} className="detail-button delete">삭제</button>
    </div>
  );
}

export default ClothDetailPanel;
