export default function ReadingModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-[53px] z-20 flex flex-col overflow-hidden bg-slate-100">
      {children}
    </div>
  );
}
