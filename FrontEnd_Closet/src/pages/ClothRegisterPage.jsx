import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./clothRegisterPage.css";

function ClothRegisterPage({ onClose, onSuccess }) {
  // const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    style: "casual",
    category: "top",
    size: "M",
    color: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      alert("이미지를 업로드해주세요.");
      return;
    }

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("image", imageFile);
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const res = await fetch("http://localhost:3000/api/cloth", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("옷 등록 실패");

      alert("ENROLL COMPLETE!");
      onSuccess();
      onClose(); 
    } catch (err) {
      console.error("등록 에러:", err);
      alert("❌ 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="cloth-register-page">
        <div className="form-wrapper">
      <h2>ENROLL CLOTH</h2>
      <form onSubmit={handleSubmit} className="clothrp">
        <label>IMAGE</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="미리보기" className="preview" />}

        <label>NAME</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>DESCRIPTION</label>
        <input name="description" value={form.description} onChange={handleChange} />

        <label>STYLE</label>
        <select name="style" value={form.style} onChange={handleChange}>
          <option value="casual">CASUAL</option>
          <option value="formal">FORMAL</option>
          <option value="sporty">SPORTY</option>
          <option value="street">STREET</option>
          <option value="other">ETC</option>
        </select>

        <label>CATEGORY</label>
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="top">TOP</option>
          <option value="bottom">BOTTOM</option>
        </select>

        <label>SIZE</label>
        <select name="size" value={form.size} onChange={handleChange}>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="2XL">2XL</option>
        </select>

        <label>COLORS</label>
        <input
          name="color"
          value={form.color}
          onChange={handleChange}
          placeholder="white, black"
        />
        <button type="submit" className="enrollButton">ENROLL</button>
        <button onClick={onClose} className="modal-close">✖</button>
      </form>
      </div>
    </div>
  );
}

export default ClothRegisterPage;
