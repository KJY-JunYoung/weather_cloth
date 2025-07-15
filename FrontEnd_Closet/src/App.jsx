import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Layout from './layouts/Layout';
import PrivateRoute from './components/PrivateRoute'; // ✅ 추가

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';

import MainPage from './pages/MainPage';
import MyClosetPage from './pages/MyClosetPage';
import MyPage from './pages/MyPage';
import VirtualFitting from './pages/VirtualFitting';
import ClothRegisterPage from './pages/ClothRegisterPage';
import ManequinnRegisterPage from './pages/ManequinnRegisterPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 로그인 필요 없는 경로 */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 로그인 필요한 경로 (PrivateRoute + Layout으로 감싸기) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/main" element={<MainPage />} />
              <Route path="/myCloset" element={<MyClosetPage />} />
              <Route path="/register-cloth" element={<ClothRegisterPage />} />
              <Route path="/register-manequinn" element={<ManequinnRegisterPage />} />
              <Route path="/virtualFitting" element={<VirtualFitting />} />
              <Route path="/my-page" element = {<MyPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
