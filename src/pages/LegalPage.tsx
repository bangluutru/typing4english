import { useT } from '../lib/i18n';
import { LEGAL, type LegalKind } from '../lib/legal';

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { lang } = useT();
  const { docs, updated } = LEGAL[lang];
  const d = docs[kind];
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-black">{d.title}</h1>
      <p className="mt-1 text-sm text-muted">{updated}</p>
      <p className="mt-5 leading-relaxed">{d.intro}</p>
      {d.sections.map(s => (
        <section key={s.h} className="mt-6">
          <h2 className="text-lg font-black">{s.h}</h2>
          {s.p.map(line => <p key={line} className="mt-2 leading-relaxed">{line}</p>)}
        </section>
      ))}
    </article>
  );
}
