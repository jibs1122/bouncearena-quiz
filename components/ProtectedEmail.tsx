'use client';

import { useState } from 'react';

// Keep the complete address out of the server-rendered HTML and static page source.
const ENCODED_ADDRESS = [40, 45, 36, 32, 39, 9, 43, 38, 60, 39, 42, 44, 40, 59, 44, 39, 40, 103, 42, 38, 36, 103, 40, 60];
const MASK = 73;

function decodeAddress(): string {
  return String.fromCharCode(...ENCODED_ADDRESS.map((character) => character ^ MASK));
}

export default function ProtectedEmail() {
  const [address, setAddress] = useState<string | null>(null);

  if (address) {
    return (
      <a
        href={`mailto:${address}`}
        className="font-medium text-[#38b1ab] hover:underline"
      >
        {address}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAddress(decodeAddress())}
      className="font-medium text-[#38b1ab] underline-offset-2 hover:underline"
      aria-label="Show the Bounce Arena email address"
    >
      Show email address
    </button>
  );
}
