import Header from './components/Header';
import Footer from './components/Footer';

function Layout({ children }) {
  return (
    <div>
      <Header />
      <main>{children}</main>   {/* ✅ 이게 핵심! */}
      <Footer />
    </div>
  );
}

export default Layout;