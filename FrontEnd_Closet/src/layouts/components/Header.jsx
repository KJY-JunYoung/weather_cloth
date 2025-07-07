import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <Link to="/">디지털 옷장</Link>
        </h1>
        <nav className="space-x-4">
          <Link to="/main" className="hover:underline">메인</Link>
          <Link to="/mycloset" className="hover:underline">옷장</Link>
          <Link to="/register" className="hover:underline">회원가입</Link>
          <Link to="/login" className="hover:underline">로그인</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;