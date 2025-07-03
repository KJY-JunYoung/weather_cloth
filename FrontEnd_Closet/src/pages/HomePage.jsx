import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h2>홈</h2>
      <Link to="/login">로그인</Link><br />
      <Link to="/register">회원가입</Link>
    </div>
  );
}

export default HomePage;