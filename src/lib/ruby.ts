/** Furigana markup: "[漢字|かんじ]". */
export const RUBY = /\[([^\]|]+)\|([^\]]+)\]/g;

export const plain = (s: string) => s.replace(RUBY, '$1');
