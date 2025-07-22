import { useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import './mannequinRegisterPage.css';

function MannequinRegisterPage({onSuccess}) {
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreview(files.length > 0 ? URL.createObjectURL(files[0]) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!images || images.length < 1 || images.length > 3) {
      alert("이미지는 1~3장만 업로드 가능합니다.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    images.forEach((img) => formData.append("images", img));
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
        setLoading(false);
        alert("3D 마네킹 생성 완료!");
        onSuccess();
        console.log("modelUrl:", data.modelUrl);
      } else {
        setLoading(false);
        alert("생성 실패: " + data.message);
      }
    } catch (err) {
      console.error("업로드 오류", err);
      setLoading(false);
      alert("서버 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="MannequinRegisterPage">
      {loading && <LoadingOverlay message={"Making New Mannequin"}/>}
      <h2 className="MannequinTitle">ENROLL MANNEQUIN</h2>
      <form onSubmit={handleSubmit} className="formWrapper">
        <input
          type="file"
          name="images"
          accept="image/*"
          multiple
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
