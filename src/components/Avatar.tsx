'use client';
import { useState } from 'react';
import { avatarUrl } from '@/lib/avatars';

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-2xl',
};

export default function Avatar({ style, seed, username, displayName, size = 'sm' }: {
  style?: string | null;
  seed?: string | null;
  username: string;
  displayName?: string;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const cls = `${SIZES[size]} rounded-full bg-blue-600 inline-flex items-center justify-center font-bold shrink-0`;
  const initial = (displayName || username)[0]?.toUpperCase();

  if (!style || failed) {
    return <div className={cls}>{initial}</div>;
  }

  return (
    <img
      src={avatarUrl(style, seed || username)}
      alt={displayName || username}
      width={128}
      height={128}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${SIZES[size]} rounded-full object-cover shrink-0 bg-zinc-800 align-middle`}
    />
  );
}
