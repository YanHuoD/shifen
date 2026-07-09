# 更新日志

## [1.0.1] — 2026-07-10

### Fixed
- RLS 策略收紧：posts INSERT 改为 `auth.uid() = user_id`，UPDATE/DELETE 加管理员豁免
- 移除 Admin.jsx 中硬编码的 Supabase URL 和 Key
- DeepSeek Key 移至 Vercel Serverless Function，前端不再暴露

### Added
- 部署至 Vercel + 自定义域名 `shifen.asia`
- Vercel Serverless Function 做 API 中转 (`api/analyze.js`)
- `.env.example` 更新

---

## [1.0.0] — 2026-07-08

### Added
- React + Vite + Tailwind CSS 项目骨架
- 首页配料输入与 AI 解读（DeepSeek API），自动保存到本地历史
- AI 解读结果展示（健康评分、成分逐条解读、适合人群、总体建议、标签）
- Supabase Auth 邮箱注册/登录，封禁用户拦截
- 个人信息编辑（昵称 + emoji 头像，upsert 模式）
- 社区帖子列表 + 点赞（应用层计数）+ 评论（展开/发表/删除）
- 帖子展开查看成分详情
- 帖子编辑功能（社区 + 历史两边同步）
- 分享解读结果到社区
- 本地历史记录（localStorage，上限 30 条，未分享可一键分享到社区）
- 历史记录页（全部记录 + 我的评论，Tab 切换）
- 个人中心：统计数据、最近分享预览、历史记录入口
- 后台管理系统（/admin 路由，权限守卫）
  - 仪表盘（用户/帖子/评论统计）
  - 帖子管理（全部列表、展开详情、删除任何帖子）
  - 用户管理（列表、编辑昵称/头像、角色管理、状态封禁、删除用户、创建用户）
  - 评论管理（全部列表、查看原帖、删除任何评论）
  - 权限分级：super_admin（最高）/ admin（内容管理）/ user（普通）
- 管理员内容删除豁免策略
- 产品文档（PRD、用户流程、数据库设计、路线图、后台管理计划）
- 数据库建表及字段（posts、likes、comments、profiles + role/status）
- RLS 安全策略 + GRANT 权限全套配置

### Fixed
- AI 风险等级表述归一化（兼容"低/中/高"与"安全/注意/慎用"）
- 点赞计数改为应用层维护（COUNT+UPDATE），修复触发器不稳定问题
- 评论/点赞/删除均加确认弹窗
- 用户名/头像在帖子和评论中正确显示
- 社区帖子自动保存后又取消的流程混乱 → 最终方案：仅分析后自动存 localStorage，分享才写入数据库
- 评论计数负数修复
- 时间格式统一为「2026年7月8日 14:30」（前台保留今天/昨天，后台全精确）

---

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。
