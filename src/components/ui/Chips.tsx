/** Compact readout row shared by the four project pages. */
export function Chips({ items }: { items: { k: string; v: string; warn?: boolean }[] }) {
    return (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0">
            {items.map(i => (
                <div key={i.k}
                    className={`rounded-xl border px-4 py-3 ${i.warn ? 'border-warning/40 bg-warning/5' : 'border-border/60 bg-card/60'}`}>
                    <dt className="text-meta font-mono uppercase tracking-widest text-textMuted mb-1">{i.k}</dt>
                    <dd className={`text-body font-mono font-bold m-0 tabular-nums ${i.warn ? 'text-warning' : 'text-text'}`}>{i.v}</dd>
                </div>
            ))}
        </dl>
    );
}
