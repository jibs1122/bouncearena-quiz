import type { ComponentProps } from 'react';

// Markdown tables can be wider than a phone screen. Body clips sideways overflow, so a bare
// table would lose its right-hand columns; this wrapper lets the table scroll on its own.
export default function MdxTable(props: ComponentProps<'table'>) {
  return (
    <div className="my-6 overflow-x-auto [&>table]:my-0">
      <table {...props} />
    </div>
  );
}
