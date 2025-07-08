import { Link } from "react-router-dom";

function Header() {
  const logout = async () => {
    try {
      await fetch("http://localhost:3000/auth/logout", {
        method: "POST", // 보통 로그아웃은 POST로 처리
        credentials: "include", // 쿠키 포함 (중요)
      });
      window.location.href = "/"; // 홈으로 강제 이동
    } catch (err) {
      console.error("로그아웃 실패", err);
    }
  };
  return (
    <header className="bg-black text-white shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-500">ISECLOTH</Link>

        <nav className="space-x-6 text-sm font-medium">
          <Link to="/main" className="hover:text-blue-400 transition">Main</Link>
          <Link to="/myCloset" className="hover:text-blue-400 transition">My closet</Link>
          <Link to="/virtualFitting" className="hover:text-blue-400 transition">Fitting Room</Link>
          <Link onClick={logout} className="hover:text-red-400 transition">Logout</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;