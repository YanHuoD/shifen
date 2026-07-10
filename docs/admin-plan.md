# 后台管理系统 — Sprint 计划 & 用户故事

> 版本：v1.0 | 日期：2026-07-08

---

## Sprint Plan

**Sprint Goal**: 管理员能通过独立后台页面对全站内容（帖子、评论、用户）进行查看和删除，并获得基础数据概览。

**Duration**: 1 天（单人项目）| **Status**: ✅ 已完成

### Story Map

```
Must Have (P0) — v1.0
├── Story 1: 管理员权限识别
├── Story 2: 仪表盘（统计概览）
├── Story 3: 帖子管理（列表 + 删除）
├── Story 4: 评论管理（列表 + 删除）
└── Story 5: 用户管理（列表查看）

Should Have (P1) — v1.1
├── 用户禁用/启用
├── 设置/取消管理员
├── 内容搜索和筛选
└── 批量操作

Nice to Have (P2)
├── 操作日志
└── 数据趋势图
```

---

## User Stories

### Story 1: 管理员权限识别

**As** 系统管理员, **I want** 登录后自动识别我的管理员身份并在导航栏显示管理入口, **so that** 我能方便地进入后台而普通用户看不到管理功能。

**Acceptance Criteria**:
- [ ] `profiles` 表新增 `is_admin` 字段，默认 false
- [ ] 管理员用户手动在数据库设置为 true
- [ ] 前端全局读取 `profile.is_admin`，为 true 时导航栏出现「管理」入口
- [ ] 普通用户访问 `/admin` 路由时被重定向到首页
- [ ] 未登录用户访问 `/admin` 时重定向到登录页

**Priority**: P0 | **Effort**: S | **Dependencies**: profiles 表已存在

---

### Story 2: 仪表盘

**As** 管理员, **I want** 打开后台首页看到关键数据概览, **so that** 我能快速了解平台运营状况。

**Acceptance Criteria**:
- [ ] 显示总用户数（auth.users 总数）
- [ ] 显示总帖子数（posts 总数）
- [ ] 显示今日新增帖子数
- [ ] 显示今日新增评论数
- [ ] 加载中显示骨架/loading，失败显示错误提示

**Priority**: P0 | **Effort**: S | **Dependencies**: Story 1

---

### Story 3: 帖子管理

**As** 管理员, **I want** 查看全站所有帖子列表并删除违规内容, **so that** 我能维护社区内容质量。

**Acceptance Criteria**:
- [ ] 展示所有帖子列表（不限用户），按时间倒序
- [ ] 每项显示：发帖用户、配料摘要、评分、发布时间
- [ ] 管理员可删除任何帖子（确认弹窗）
- [ ] 删除后列表实时更新
- [ ] 空态显示「暂无帖子」

**Priority**: P0 | **Effort**: M | **Dependencies**: Story 1

---

### Story 4: 评论管理

**As** 管理员, **I want** 查看全站所有评论并删除不当言论, **so that** 我能维护社区讨论秩序。

**Acceptance Criteria**:
- [ ] 展示所有评论列表，按时间倒序
- [ ] 每项显示：评论者、内容摘要、所属帖子、发布时间
- [ ] 「查看原帖」链接跳转到社区页
- [ ] 管理员可删除任何评论（确认弹窗）
- [ ] 空态显示「暂无评论」

**Priority**: P0 | **Effort**: M | **Dependencies**: Story 1

---

### Story 5: 用户管理

**As** 管理员, **I want** 查看全站注册用户列表, **so that** 我了解用户规模和构成。

**Acceptance Criteria**:
- [ ] 展示所有注册用户列表
- [ ] 每项显示：头像、昵称、邮箱、注册时间
- [ ] v1.0 不做禁用/启用和角色修改
- [ ] 空态显示「暂无用户」

**Priority**: P0 | **Effort**: S | **Dependencies**: Story 1

---

### Story 6: 用户编辑

**As** 管理员, **I want** 在后台直接编辑用户的昵称和头像, **so that** 我能修正不合适的用户资料。

**Acceptance Criteria**:
- [x] 每个用户旁边有编辑按钮
- [x] 点击后出现昵称输入框和 emoji 输入框
- [x] ✓ 保存，✗ 取消
- [x] 保存后列表实时更新

**Priority**: P0 | **Effort**: S | **Dependencies**: Story 1

---

### Story 7: 用户状态管理

**As** 管理员, **I want** 设置用户为封禁/正常状态, **so that** 我能处理违规用户。超级管理员可封禁管理员，普通管理员只能封禁普通用户。

**Acceptance Criteria**:
- [x] 下拉框切换 active / banned
- [x] 被封禁用户登录时遭到拒绝
- [x] admin 只能管理普通用户状态
- [x] 不能修改 super_admin 的状态

**Priority**: P0 | **Effort**: S | **Dependencies**: Story 1

---

### Story 8: 删除用户

**As** 超级管理员, **I want** 删除用户, **so that** 我能清理不活跃或违规账号。

**Acceptance Criteria**:
- [x] 仅 super_admin 可见删除按钮
- [x] 确认弹窗防误删
- [x] 不能删除自己
- [x] 删除 profile 记录

**Priority**: P0 | **Effort**: S | **Dependencies**: Story 1

---

### Story 9: 创建用户

**As** 管理员, **I want** 在后台直接创建新用户, **so that** 我能帮别人开通账号。

**Acceptance Criteria**:
- [x] 输入邮箱 + 密码 → 创建
- [x] 自动创建 profile 记录
- [x] 重复邮箱显示提示
- [x] 创建成功后用户列表刷新

**Priority**: P0 | **Effort**: S | **Dependencies**: Story 1

---

## Technical Notes

- **权限字段**: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`
- **路由**: 全部 6 条：`/` `/community` `/login` `/profile` `/history` `/admin`
- **权限守卫**: Admin 页面组件内检查 `profile.role`，非 admin 重定向到 `/`
- **数据查询**: 直接 `supabase.from('posts').select('*')` 不加 user_id 过滤
- **RLS 底线**: 已有策略限制普通用户只能删自己的内容；管理员需额外策略或使用 service_role（建议 v1.0 先用 service_role 或放宽策略）

## Open Questions

- [x] 管理员 RLS 策略 → 采用选项 A：放宽现有策略，管理员豁免 `role IN ('super_admin','admin')`
- [ ] 是否需要操作日志？（v2.0）
