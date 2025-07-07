import { Link } from 'react-router-dom';

function WelcomePage() {
  return (
    <div
      style={{
        margin: "0 auto",
        width: "200px",
        border: "2px solid gray",
        padding: "20px",
        textAlign: "center"
      }}
    >
      <h2>홈</h2>
      <Link to="/login">로그인</Link><br />
      <Link to="/register">회원가입</Link>
    </div>
  );
}

export default WelcomePage;