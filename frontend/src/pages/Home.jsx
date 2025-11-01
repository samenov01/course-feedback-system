import PosterLayout from "../components/PosterLayout";
import logo from "../photos/logo.png";

export default function Home({ onBrowse, onLogin, onRegister }) {
  return (
    <PosterLayout titleLarge="FEED BACK" rightLabel="">
      <div className="relative min-h-[calc(100vh-80px)]">
        {/* Hero without block, directly on background */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-5xl font-black tracking-tight text-white">Платформа отзывов</h1>
              <p className="mt-4 text-white/80">Исследуйте курсы, делитесь опытом и улучшайте качество обучения.</p>
              <div className="mt-8 flex items-center gap-4">
                <button onClick={onBrowse} className="px-6 py-3 bg-white text-[#101010] rounded-[2px]">Просмотреть курсы</button>
                <button onClick={onLogin} className="px-6 py-3 border border-white text-white rounded-[2px]">Login</button>
                <button onClick={onRegister} className="px-6 py-3 border border-white text-white rounded-[2px]">Register</button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img src={logo} alt="brand" className="w-[420px] max-w-full" />
            </div>
          </div>
        </section>
      </div>
    </PosterLayout>
  );
}
