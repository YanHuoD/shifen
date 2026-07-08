import { supabase, isSupabaseReady } from './supabase'

// ---- 社区帖子 ----

export async function fetchPosts() {
  if (!isSupabaseReady()) return []

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('shared', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function createPost({ ingredients, analysis }) {
  if (!isSupabaseReady()) throw new Error('Supabase 未配置')

  // 获取用户 ID 和 profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_emoji')
    .eq('id', user?.id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user?.id,
      user_name: profile?.display_name || user?.email?.split('@')[0] || '食分用户',
      user_avatar: profile?.avatar_emoji || '👤',
      ingredients,
      summary: analysis.summary,
      health_score: analysis.healthScore,
      score_label: analysis.scoreLabel,
      analysis_json: analysis,
      shared: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ---- 点赞 ----

export async function toggleLike(postId, isLiked) {
  if (!isSupabaseReady()) return

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return

  if (isLiked) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId })
  }

  // 重新计算并更新点赞数
  const { data: allLikes } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)

  const newCount = allLikes?.length || 0
  await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId)
}

// ---- 评论 ----

export async function fetchComments(postId) {
  if (!isSupabaseReady()) return []

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addComment(postId, content) {
  if (!isSupabaseReady()) throw new Error('Supabase 未配置')

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  // 查昵称和头像
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_emoji')
    .eq('id', userId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      user_name: profile?.display_name || session?.user?.email?.split('@')[0] || '食分用户',
      user_avatar: profile?.avatar_emoji || '👤',
      content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePost(postId) {
  if (!isSupabaseReady()) return
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function deleteComment(commentId) {
  if (!isSupabaseReady()) return

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
}

// ---- 数据库初始化 SQL（用户需在 Supabase SQL Editor 中执行） ----

export const DB_INIT_SQL = `
-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  ingredients TEXT NOT NULL,
  summary TEXT,
  health_score NUMERIC(3,1),
  score_label TEXT,
  analysis_json JSONB,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- 点赞计数触发器
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_likes_count ON likes;
CREATE TRIGGER trg_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();
`
