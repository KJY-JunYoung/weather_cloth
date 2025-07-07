import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';
import MyClosetPage from './pages/MyClosetPage';
import VirtualFitting from './pages/VirtualFitting';
import ClothRegisterPage from './pages/ClothRegisterPage';
import ManequinnRegisterPage from './pages/ManequinnRegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-cloth" element={<ClothRegisterPage />} />
        <Route path="/register-manequinn" element={<ManequinnRegisterPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/myCloset" element={<MyClosetPage />} />
        <Route path="/virtualFitting" element={<VirtualFitting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
