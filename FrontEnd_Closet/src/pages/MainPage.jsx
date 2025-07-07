// MainPage.jsx
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const navigate = useNavigate();
  const moveToMyCloset = () => {
    navigate("/myCloset")
  }
  return (
    <div>
      <h1>환영합니다! 🎉</h1>
      <p>이곳은 로그인 후 접근 가능한 메인 페이지입니다.</p>
      <button onClick={moveToMyCloset}>내 옷장</button>
    </div>
  );
}

export default MainPage;