import { useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import './mannequinRegisterPage.css';

function MannequinRegisterPage({ onSuccess }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert("이미지를 선택해주세요.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("mannequin", image); // ✅ 필드명 일치

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3000/api/mannequin/make-3d", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("3D 마네킹 생성 완료!");
        onSuccess();
        console.log("modelUrl:", data.modelUrl);
      } else {
        alert("생성 실패: " + data.message);
      }
    } catch (err) {
      console.error("업로드 오류", err);
      alert("서버 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="MannequinRegisterPage">
      {loading && <LoadingOverlay message="Making New Mannequin" />}
      <h2 className="MannequinTitle">ENROLL MANNEQUIN</h2>
      <form onSubmit={handleSubmit} className="formWrapper">
        <input
          type="file"
          name="mannequin"
          accept="image/*"
          onChange={handleFileChange}
          className="fileInput"
        />
        {preview && (
          <img
            src={preview}
            alt="미리보기"
            className="previewMannequin"
          />
        )}
        <button type="submit" className="submitButton">
          REQUEST
        </button>
      </form>
    </div>
  );
}

export default MannequinRegisterPage;
