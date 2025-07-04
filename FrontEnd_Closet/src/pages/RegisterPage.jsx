import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

console.log("🔧 RegisterPage 렌더링됨");

function RegisterPage() {
  const navigate = useNavigate(); 
  const[gender, setGender] = useState("남");
  const [formData, setFormData] = useState({
    name : "",
    email : "",
    password : "",
    confirmPassword : "",
    height : "",
    weight : ""
  })

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name] : e.target.value } )
  }
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🔥 handleSubmit 실행됨");

  const dataToSend = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    height: parseFloat(formData.height),
    weight: parseFloat(formData.weight),
    gender
  };

  console.log("📦 서버로 보낼 데이터:", dataToSend);

  try {
    const res = await fetch("http://localhost:3000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dataToSend)
    });

    console.log("🌐 fetch 응답 객체:", res);

    const result = await res.json();

    console.log("📨 응답 받은 데이터:", result);

    if (res.ok) {
      alert("✅ 회원가입 성공!");
    } else {
      alert("❌ 실패: " + result.message);
    }
  } catch (err) {
    console.error("❗ 서버 통신 에러:", err);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-md rounded-xl p-8 space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">회원가입</h2>

        <input
          type="text"
          name="name"
          placeholder="이름"
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
        />

        <input
          type="text"
          name="email"
          placeholder="이메일"
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
        />

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="비밀번호 확인"
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
        />

        <input
          type="text"
          name="height"
          placeholder="신장(cm)"
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
        />

        <input
          type="text"
          name="weight"
          placeholder="체중(kg)"
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
        />

        <div className="w-full">
          <label className="block mb-1 text-sm font-medium">성별</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="남">남자</option>
            <option value="여">여자</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
        >
          회원가입
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;