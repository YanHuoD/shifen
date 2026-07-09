# 数据库设计文档 — 食分

> 版本：v1.0 | 日期：2026-07-06 | 数据库：PostgreSQL (Supabase)

---

## 一、ER 图

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   profiles   │    │    posts     │    │   comments   │    │    likes     │
├──────────────┤    ├──────────────┤    ├──────────────┤    ├──────────────┤
│ id (PK)      │    │ id (PK)      │    │ id (PK)      │    │ id (PK)      │
│ display_name │    │ user_id (FK) │──┐ │ post_id (FK) │──┐ │ post_id (FK) │──┐
│ avatar_emoji │    │ user_name    │  │ │ user_id (FK) │  │ │ user_id (FK) │  │
│ updated_at   │    │ user_avatar  │  │ │ user_name    │  │ │ created_at   │  │
└──────┬───────┘    │ ingredients  │  │ │ user_avatar  │  │ └──────────────┘  │
       │            │ summary      │  │ │ content      │  │                   │
       │            │ health_score │  │ │ created_at   │  │                   │
       │            │ score_label  │  │ └──────────────┘  │                   │
       │            │ analysis_json│  │                    │                   │
       └────────────│ likes_count  │◄─┼────────────────────┘                   │
                    │ comments_cnt │◄─┼────────────────────────────────────────┘
                    │ created_at   │  │
                    └──────────────┘  │
                         │            │
                         └────────────┘
              (所有 user_id → auth.users.id)
              (profiles.id → auth.users.id)
```

---

## 二、表结构

### 2.1 profiles — 用户扩展信息

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK, FK → auth.users ON DELETE CASCADE | 关联 auth.users |
| `display_name` | TEXT | | 用户昵称 |
| `avatar_emoji` | TEXT | DEFAULT '👤' | 头像 emoji |
| `role` | TEXT | DEFAULT 'user' | 角色：super_admin / admin / user |
| `status` | TEXT | DEFAULT 'active' | 状态：active / banned |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 最后更新时间 |

**说明**：新用户通过触发器自动创建 profile。编辑走 upsert，不存在则创建。

### 2.2 posts — 社区帖子表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL | PK | 自增主键 |
| `user_id` | UUID | FK → auth.users | 发布者 |
| `user_name` | TEXT | | 发布者昵称（冗余，避免 JOIN） |
| `user_avatar` | TEXT | DEFAULT '👤' | 发布者头像 emoji |
| `ingredients` | TEXT | NOT NULL | 配料表原文 |
| `summary` | TEXT | | AI 一句话总结 |
| `health_score` | NUMERIC(3,1) | | 健康评分 (1.0-10.0) |
| `score_label` | TEXT | | 评分等级标签 |
| `analysis_json` | JSONB | | 完整 AI 解读结果 |
| `likes_count` | INT | DEFAULT 0 | 点赞数（应用层维护） |
| `comments_count` | INT | DEFAULT 0 | 评论数（触发器维护） |
| `shared` | BOOLEAN | DEFAULT false | 是否已分享到社区 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

**索引**：`idx_posts_created_at` ON `created_at DESC`

### 2.3 likes — 点赞表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL | PK | 自增主键 |
| `post_id` | BIGINT | FK → posts(id) ON DELETE CASCADE | 被点赞的帖子 |
| `user_id` | UUID | FK → auth.users | 点赞者 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 点赞时间 |

**约束**：`UNIQUE(post_id, user_id)` — 一人一帖只能点一次赞

### 2.4 comments — 评论表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL | PK | 自增主键 |
| `post_id` | BIGINT | FK → posts(id) ON DELETE CASCADE | 所属帖子 |
| `user_id` | UUID | FK → auth.users | 评论者 |
| `user_name` | TEXT | | 评论者昵称（冗余） |
| `user_avatar` | TEXT | DEFAULT '👤' | 评论者头像 emoji |
| `content` | TEXT | NOT NULL | 评论内容 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 评论时间 |

---

## 三、触发器

### 3.1 评论计数同步

```sql
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();
```

### 3.2 新用户自动创建 profile

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_emoji)
  VALUES (NEW.id, NEW.email, '👤');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

> **注意**：点赞计数（likes_count）不走触发器，由前端 `toggleLike` 函数直接 COUNT + UPDATE，避免触发器权限问题。

---

## 四、RLS 安全策略（实际部署版）

```sql
-- posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_select ON posts FOR SELECT USING (true);
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY posts_update ON posts FOR UPDATE USING (auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));
CREATE POLICY posts_delete ON posts FOR DELETE USING (auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));
CREATE POLICY admin_delete_posts ON posts FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY likes_select ON likes FOR SELECT USING (true);
CREATE POLICY likes_insert ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY likes_delete ON likes FOR DELETE USING (auth.uid() = user_id);

-- comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_select ON comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_delete ON comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY admin_delete_comments ON comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY admin_insert_profiles ON profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));
CREATE POLICY admin_update_profiles ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));
CREATE POLICY admin_delete_profiles ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
```

---

## 五、GRANT 权限汇总

```sql
-- 序列权限（BigSERIAL 需要 USAGE 才能 INSERT）
GRANT USAGE ON SEQUENCE posts_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE likes_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE comments_id_seq TO authenticated;

-- 表权限
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
```

---

## 六、数据示例

```json
{
  "id": 6,
  "user_id": "dc3f2844-...",
  "user_name": "cc",
  "user_avatar": "🍎",
  "ingredients": "小麦粉、白砂糖、精炼植物油、可可粉、碳酸氢钠、食用香精",
  "summary": "这是一款高糖高油的传统甜点，偶尔吃可以，不宜常吃。",
  "health_score": 3.5,
  "score_label": "不太健康",
  "analysis_json": {
    "summary": "这是一款高糖高油的传统甜点...",
    "healthScore": 3.5,
    "scoreLabel": "不太健康",
    "ingredients": [...],
    "overallAdvice": "这款食品高糖高油，适合偶尔作为零食解馋...",
    "tags": ["高糖", "高油", "含添加剂"]
  },
  "likes_count": 1,
  "comments_count": 0,
  "created_at": "2026-07-06T16:32:56+08:00"
}
```
