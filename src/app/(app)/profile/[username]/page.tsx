'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostCard from '@/components/PostCard';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isMe, setIsMe] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    async function load() {
      const [meRes, postsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/posts?username=${username}`),
      ]);
      const meData = meRes.ok ? (await meRes.json()).data : null;
      const postsData = postsRes.ok ? (await postsRes.json()).data : null;

      if (meData) {
        setCurrentUserId(meData.id);
        setIsMe(meData.username === username);
        // Fetch full profile info including role & points
        const profileRes = await fetch(`/api/profile?username=${username}`);
        if (profileRes.ok) {
          setProfile((await profileRes.json()).data);
        } else {
          setProfile(meData);
        }
      }
      if (postsData) {
        setPosts(postsData.posts);
        // Check if following based on follow API
        if (!meData || meData.username !== username) {
          const followCheck = await fetch('/api/auth/me').then(r => r.json()).then(d => d.data);
          // We'll use a simpler approach - check via follow API
        }
      }
      setLoading(false);
    }
    load();
  }, [username]);

  useEffect(() => {
    if (!currentUserId || isMe) return;
    fetch('/api/follow/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).then(r => r.json()).then(d => {
      if (d.data) setFollowing(d.data.following);
    }).catch(() => {});
  }, [currentUserId, isMe, username]);

  async function toggleFollow() {
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (res.ok) {
      const d = await res.json();
      setFollowing(d.data.following);
    }
  }

  const roleBadge = (role?: string) => {
    switch (role) {
      case 'admin': return <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full ml-2">Admin</span>;
      case 'mod': return <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-2">Mod</span>;
      default: return null;
    }
  };

  const pointsLevel = (pts: number) => {
    if (pts >= 1000) return 'Platinum';
    if (pts >= 500) return 'Gold';
    if (pts >= 200) return 'Silver';
    if (pts >= 50) return 'Bronze';
    return 'Newcomer';
  };

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <div className="border border-zinc-800 rounded-xl p-6 mb-4 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
          {username[0]?.toUpperCase()}
        </div>
        <div className="flex items-center justify-center gap-1">
          <h1 className="text-xl font-bold text-white">{profile?.display_name || username}</h1>
          {roleBadge(profile?.role)}
        </div>
        <p className="text-zinc-500 text-sm">@{username}</p>
        <p className="text-zinc-400 text-sm mt-2">{profile?.bio}</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <span className="text-zinc-500">{posts.length} posts</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">
            {profile?.points || 0} pts
            <span className="text-zinc-600 ml-1">({pointsLevel(profile?.points || 0)})</span>
          </span>
        </div>
        {isMe ? (
          <button
            onClick={() => router.push('/settings')}
            className="mt-4 px-6 py-2 rounded-full text-sm font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={toggleFollow}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                following ? 'border border-zinc-700 text-white hover:border-red-500 hover:text-red-400' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >{following ? 'Following' : 'Follow'}</button>
            <button onClick={() => profile?.id && router.push(`/messages/${profile.id}`)}
              className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition">Message</button>
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">No posts yet</div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} onUpdate={() => {}} />)
      )}
    </div>
  );
}
