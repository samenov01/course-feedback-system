import PosterLayout from "../components/PosterLayout";

export default function Profile({ user, onBack }) {
  if (!user) return null;
  const { name, email } = user;

  return (
    <PosterLayout titleLarge="PROFILE" rightLabel="ACCOUNT">
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <div className="w-full max-w-xl card p-8 rounded-[12px] ani-fade-up">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-[#101010]">Ваш профиль</h1>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-[#101010]/70 hover:text-[#101010]"
              >
                ← Назад
              </button>
            )}
          </div>

          <div className="space-y-4 text-[#101010]">
            <div>
              <p className="text-sm text-[#101010]/60 uppercase tracking-wide">Имя</p>
              <p className="text-lg font-medium">{name}</p>
            </div>
            <div>
              <p className="text-sm text-[#101010]/60 uppercase tracking-wide">Email</p>
              <p className="text-lg font-medium">{email}</p>
            </div>
          </div>
        </div>
      </div>
    </PosterLayout>
  );
}
