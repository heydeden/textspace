'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostCard from '@/components/PostCard';
import PtsBadge from '@/components/PtsBadge';
import { formatCount } from '@/lib/format';
import { pointsLevel } from '@/lib/points';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isMe, setIsMe] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  async function loadPosts() {
    const res = await fetch(`/api/posts?username=${username}`);
    if (res.ok) setPosts((await res.json()).data?.posts || []);
  }

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
        const profileRes = await fetch(`/api/profile?username=${username}`);
        if (profileRes.ok) {
          setProfile((await profileRes.json()).data);
        } else {
          setProfile(meData);
        }
      }
      if (postsData) {
        setPosts(postsData.posts);
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

  async function toggleBlock() {
    const res = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (res.ok) {
      const d = await res.json();
      setProfile((p: any) => ({ ...p, blocked_by_me: d.data.blocked }));
    }
  }

  const roleBadge = (role?: string) => {
    switch (role) {
      case 'admin': return <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full ml-2">Admin</span>;
      case 'mod': return <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-2">Mod</span>;
      default: return null;
    }
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
          <PtsBadge pts={profile?.points} />
        </div>
        <p className="text-zinc-500 text-sm">@{username}</p>
        <p className="text-zinc-400 text-sm mt-2">{profile?.bio}</p>
        <div className="grid grid-cols-5 gap-2 mt-4 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">{formatCount(profile?.post_count ?? posts.length)}</span>
            <span className="text-[11px] text-zinc-500">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">{formatCount(profile?.follower_count ?? 0)}</span>
            <span className="text-[11px] text-zinc-500">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">{formatCount(profile?.following_count ?? 0)}</span>
            <span className="text-[11px] text-zinc-500">Following</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">{formatCount(profile?.like_count ?? 0)}</span>
            <span className="text-[11px] text-zinc-500">Likes</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">{formatCount(profile?.points || 0)}</span>
            <span className="text-[11px] text-zinc-500">Points</span>
          </div>
        </div>
        <p className="text-zinc-600 text-xs mt-2">Level: {pointsLevel(profile?.points || 0)}</p>
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
            {!profile?.blocked_by_me && (
              <button onClick={toggleBlock}
                className="px-4 py-2 rounded-full text-sm font-medium border border-red-900 text-red-400 hover:bg-red-950/50 transition">Block</button>
            )}
            {profile?.blocked_by_me && (
              <button onClick={toggleBlock}
                className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-700 text-zinc-300 hover:border-green-500 hover:text-green-400 transition">Unblock</button>
            )}
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">No posts yet</div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} onUpdate={() => loadPosts()} />)
      )}
    </div>
  );
}
