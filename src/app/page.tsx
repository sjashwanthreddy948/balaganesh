import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChandaFlow from '@/components/ChandaFlow';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />
      <main className="flex-1 flex flex-col justify-center py-4">
        <ChandaFlow />
      </main>
      <Footer />
    </div>
  );
}
