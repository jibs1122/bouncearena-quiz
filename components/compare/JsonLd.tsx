export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // Escape characters that could break out of a <script> tag if data contains
  // strings sourced from the data sheet (e.g. brand names or URLs).
  const __html = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html }} />;
}
