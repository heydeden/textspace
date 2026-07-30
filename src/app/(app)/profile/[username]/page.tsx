'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostCard from '@/components/PostCard';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isMe, setIsMe] = useState(false);

  useEffect(() => {
    async function load() {
      const [userRes, postsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/posts?username=${username}`),
      ]);
      const userData = userRes.ok ? (await userRes.json()).data : null;
      const postsData = postsRes.ok ? (await postsRes.json()).data : null;

      if (userData) {
        setFollowing(postsData?.posts?.[0]?.following_id != null);
        setIsMe(userData.username === username);
        setProfile(userData);
      }
      if (postsData) setPosts(postsData.posts);
      setLoading(false);
    }
    load();
  }, [username]);

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

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <div className="border border-zinc-800 rounded-xl p-6 mb-4 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
          {username[0]?.toUpperCase()}
        </div>
        <h1 className="text-xl font-bold text-white">{profile?.display_name || username}</h1>
        <p className="text-zinc-500 text-sm">@{username}</p>
        <p className="text-zinc-400 text-sm mt-2">{profile?.bio}</p>
        <div className="text-zinc-600 text-xs mt-2">
          {posts.length} posts
        </div>
        {!isMe && (
          <button
            onClick={toggleFollow}
            className={`mt-4 px-6 py-2 rounded-full text-sm font-medium transition ${
              following ? 'border border-zinc-700 text-white hover:border-red-500 hover:text-red-400' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">No posts yet</div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
