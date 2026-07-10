# 🥗 食分 — 配料表解读，吃得明明白白

> 输入食品配料表，AI 帮你解读每一行小字

[![tech](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Tailwind-brightgreen)](https://github.com)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![deploy](https://img.shields.io/badge/deploy-shifen.asia-green)](https://shifen.asia)
[![version](https://img.shields.io/badge/version-1.0.2-blue)](CHANGELOG.md)

## 这是什么

面对食品包装上的配料表——「麦芽糖醇、阿斯巴甜、安赛蜜、山梨酸钾」——每个字都认识，看完不知道这东西到底能不能吃。

**食分** 做一件事：你把配料表贴进来，AI 告诉你：
- ✅ 这东西总体怎么样（一句话）
- 📊 健康评分（1-10 分）
- 🔬 每个成分是什么、安不安全
- 👶 适合谁、不适合谁（宝妈/儿童/孕妇/三高人群等）
- 💡 吃多少合适

## 目标用户

| 用户 | 痛点 |
|------|------|
| 👩‍👧 宝妈 | 对孩子吃的东西高度敏感，信息渠道杂乱 |
| 💪 减脂/健身 | 控糖控卡，想确认「0糖0脂」标签真伪 |
| 🛒 大众消费者 | 想吃得健康，但懒得自己研究 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 DeepSeek API Key

# 3. 启动开发服务器
npm run dev
```

### 需要的 API Key

| 服务 | 用途 | 获取地址 |
|------|------|----------|
| DeepSeek API | AI 配料解读 | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| Supabase | 用户系统 + 数据库（可选） | [supabase.com](https://supabase.com) |

## 技术栈

```
前端       React 19 + Vite + Tailwind CSS 3
路由       React Router 6
图标       Lucide React
AI 接口    DeepSeek API
后端服务    Supabase (PostgreSQL + Auth)
API 中转    Vercel Serverless Function（Key 无泄露）
移动端      底部导航 + 响应式适配 + 顶栏优化
部署       Vercel + 自定义域名 shifen.asia
```

## 项目文档

| 文档 | 内容 |
|------|------|
| [产品需求文档 (PRD)](docs/PRD.md) | 产品定位、用户画像、功能规格、成功指标 |
| [用户流程图](docs/user-flow.md) | 核心流程、登录注册、社区互动、异常处理 |
| [数据库设计](docs/database-design.md) | ER 图、表结构、触发器、安全策略 |
| [产品路线图](docs/roadmap.md) | v1.0 MVP → v1.1 OCR 版 → v2.0 完整版 |

## 目录结构

```
src/
├── lib/
│   ├── deepseek.js          # AI 解读 API 封装
│   ├── supabase.js           # Supabase 客户端
│   ├── AuthContext.jsx       # 全局登录状态
│   └── api.js                # 社区数据操作
├── components/
│   ├── Layout.jsx            # 导航栏 + 底部
│   └── AnalysisResult.jsx    # 解读结果展示
├── pages/
│   ├── Home.jsx              # 配料输入 + AI 调用
│   ├── Community.jsx         # 社区帖子列表
│   ├── Login.jsx             # 登录/注册
│   └── Profile.jsx           # 个人中心
└── docs/                     # 产品文档
```

## 许可

MIT
