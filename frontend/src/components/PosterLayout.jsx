export default function PosterLayout({
  titleLarge = "",
  rightLabel = "",
  children,
}) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[var(--color-bg)]">
      {/* Giant background title */}
      {titleLarge ? (
        <div
          aria-hidden
          className="pointer-events-none select-none absolute inset-0 flex"
        >
          <div className="flex-1 flex items-center">
            <div className="px-6 md:px-12 lg:px-16">
              <div
                className="poster-title font-black text-[24vw] leading-[0.8] text-[color:var(--color-sky)] opacity-[0.12] tracking-tight"
                style={{ wordBreak: "break-word" }}
              >
                {titleLarge}
              </div>
            </div>
          </div>
          {rightLabel ? (
            <div className="hidden md:flex items-center justify-center pr-6">
              <div className="h-[70vh] w-[2px] bg-[color:var(--color-sky)] rounded-full" />
              <div className="ml-3 rotate-90 origin-left text-[color:var(--color-sky)] font-semibold tracking-widest">
                {rightLabel}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Foreground content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

