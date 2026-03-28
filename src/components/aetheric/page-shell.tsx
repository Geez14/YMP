type PageShellProps = {
  children: React.ReactNode;
  aside?: React.ReactNode;
  asideClassName?: string;
  songLimitText?: string;
  textSecondary: string;
  contentSurface: string;
  contentSurfaceColor?: string;
};

export function PageShell({ children, aside, asideClassName, songLimitText, textSecondary, contentSurface, contentSurfaceColor }: PageShellProps) {
  return (
    <main className="flex min-h-screen flex-col gap-8 px-6 pb-28 pt-20 md:px-12 md:pt-22 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
      <section className="flex flex-1 flex-col gap-8">
        <div>
          {songLimitText ? <p className={`text-sm ${textSecondary}`}>{songLimitText}</p> : null}
          <h1 className="font-manrope text-[clamp(2rem,3.6vw,3.2rem)] font-semibold">Playing</h1>
        </div>
        <div
          className={`grid gap-7 rounded-[32px] p-6 md:p-7 ${contentSurface}`}
          style={contentSurfaceColor ? { backgroundColor: contentSurfaceColor } : undefined}
        >
          {children}
        </div>
      </section>
      {aside ? (
        <div className={`hidden lg:block lg:h-full lg:self-stretch ${asideClassName ?? ""}`}>
          <div
            className={`${textSecondary} h-full w-px self-stretch`}
            style={{ backgroundColor: "currentColor", opacity: 0.16 }}
            aria-hidden
          />
        </div>
      ) : null}
      {aside ? <div className={`lg:flex-1 lg:self-center ${asideClassName ?? ""}`}>{aside}</div> : null}
    </main>
  );
}
