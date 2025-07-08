import Layout from '../layouts/Layout';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const navigate = useNavigate();

  return (
    // MainPage.jsx 내부 return
<Layout>
  {/* 배경 효과 */}
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
    <div className="absolute w-72 h-72 bg-blue-500 opacity-20 rounded-full animate-ping top-1/4 left-1/3"></div>
    <div className="absolute w-96 h-96 bg-blue-800 opacity-10 rounded-full animate-spin top-1/3 left-2/3"></div>
  </div>

  {/* 중앙 본문 */}
  <div className="flex flex-col justify-center items-center min-h-[80vh] text-center px-4 relative z-10">
    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
      그 옷, 여기서 한번 입어보시겠어요?
    </h1>
    <p className="text-gray-400 text-lg mb-10">
      당신의 체형에 맞는 마네킹으로 가상 피팅을 경험해보세요.
    </p>
    <div className="flex gap-4">
      <button
        onClick={() => navigate("/myCloset")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
      >
        내 옷장 보기
      </button>
      <button
        onClick={() => navigate("/virtualFitting")}
        className="bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-900 px-6 py-3 rounded-xl transition"
      >
        가상 피팅 시작
      </button>
    </div>
  </div>
  <div className="absolute w-48 h-48 bg-blue-500 rounded-full opacity-40 top-1/3 left-1/3 animate-bounce z-50"></div>
</Layout>

  );
}

export default MainPage;
