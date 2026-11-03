/** Each word rises out of a mask, one after another. CSS only, so it needs no JavaScript to show. */
export function HeroHeadline({ lines }: { lines: string[] }) {
  let wordIndex = 0;
  return (
    <h1 className="text-[2.75rem] leading-[1.15] font-black tracking-tight text-balance sm:text-6xl lg:text-7xl">
      {lines.map((line) => (
        <span key={line} className="block">
          {line.split(' ').map((word) => (
            <span key={word} className="inline-block overflow-hidden pb-2 align-bottom">
              <span
                className="inline-block animate-word-rise"
                style={{ animationDelay: `${0.15 + wordIndex++ * 0.08}s` }}
              >
                {word}
              </span>{' '}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
