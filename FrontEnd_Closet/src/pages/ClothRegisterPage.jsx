import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./clothRegisterPage.css";

function ClothRegisterPage() {
  const navigate = useNavigate();
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

      alert("✅ 옷이 등록되었습니다!");
      navigate("/myCloset");
    } catch (err) {
      console.error("등록 에러:", err);
      alert("❌ 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="cloth-register-page">
        <div className="form-wrapper">
      <h2>👕 옷 등록하기</h2>
      <form onSubmit={handleSubmit}>
        <label>이미지:</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="미리보기" className="preview" />}

        <label>이름:</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>설명:</label>
        <input name="description" value={form.description} onChange={handleChange} />

        <label>스타일:</label>
        <select name="style" value={form.style} onChange={handleChange}>
          <option value="casual">캐주얼</option>
          <option value="formal">포멀</option>
          <option value="sporty">스포티</option>
          <option value="street">스트리트</option>
          <option value="other">기타</option>
        </select>

        <label>카테고리:</label>
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="top">상의</option>
          <option value="bottom">하의</option>
        </select>

        <label>사이즈:</label>
        <select name="size" value={form.size} onChange={handleChange}>
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
          placeholder="white, black"
        />

        <button type="submit">등록하기</button>
      </form>
      </div>
    </div>
  );
}

export default ClothRegisterPage;
