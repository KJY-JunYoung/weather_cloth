import { Link } from 'react-router-dom';

function WelcomePage() {
  return (
    <div id='welcomeWrap'>
      <div id = 'loginRegister'>
        <h2>홈</h2>
        <Link to="/login">로그인</Link><br />
        <Link to="/register">회원가입</Link>
      </div>
    </div>
  );
}

import "./welcomePage.css";
export default WelcomePage;