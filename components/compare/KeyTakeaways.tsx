export default function KeyTakeaways({ takeaways }: { takeaways: string[] }) {
  if (takeaways.length === 0) return null;

  return (
    <div className="not-prose my-8 rounded-2xl border border-[#38b1ab]/20 bg-[#38b1ab]/[0.06] p-6">
      <h2 className="mb-3 text-base font-bold text-black">Key differences</h2>
      <ul className="space-y-2.5">
        {takeaways.map((takeaway) => (
          <li key={takeaway} className="flex gap-2.5 text-sm leading-relaxed text-black/75">
            <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#38b1ab]" />
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-black/40">
        Taken from the specifications in the table below.
      </p>
    </div>
  );
}
