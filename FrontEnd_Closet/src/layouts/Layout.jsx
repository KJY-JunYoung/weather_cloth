import Header from './components/Header';
import Footer from './components/Footer';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col relative">
      <Header />
      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;