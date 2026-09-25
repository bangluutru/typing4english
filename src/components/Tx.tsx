import { Fragment, type ReactNode } from 'react';
import { RUBY } from '../lib/ruby';

/** Render "[漢字|かんじ]" markup as <ruby> so kanji get furigana. */
export function Tx({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(RUBY)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push(<ruby>{m[1]}<rt>{m[2]}</rt></ruby>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}
