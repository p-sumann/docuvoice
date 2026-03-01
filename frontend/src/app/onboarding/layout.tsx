export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--dv-bg-base)] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
