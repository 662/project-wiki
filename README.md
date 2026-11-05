# project-wiki

面向人和 AI 的项目知识管理技能。支持建立、整理与维护 Markdown Wiki；网页浏览是可选项。

适用于 Go/Rust 命令行工具、Express 服务、Next.js 应用及其他仓库。仓库阅读无需 Web server，也不要求目标项目安装 Node.js。技能提供知识准入、主题归属、同步判断和校验契约，并附带可改造的 Next.js 阅读/校验/别名/图表资产。

## 安装

```bash
npx skills add 662/project-wiki --skill project-wiki --global
```

Skills CLI 会让你选择要安装到的工具；按其支持范围安装。可选显式指定：

```bash
npx skills add 662/project-wiki --skill project-wiki --global --agent codex claude-code cursor -y
```

当前 Skills CLI 中，Codex 等工具共用的全局技能目录为 `~/.agents/skills/`；其他工具可能使用自己的目录，由 CLI 处理链接。安装 CLI 自身需要 Node，但使用已安装的核心 Markdown 规范不要求目标项目新增 Node 依赖。

## 使用

- “使用 project-wiki 为这个 Go 工具建立仓库 Wiki，不增加网页服务。”
- “使用 project-wiki 整理旧文档，以当前代码为依据去重，保留必要旧链接。”
- “使用 project-wiki 为这个 Next.js 项目接入只读 Wiki，沿用现有登录。”
- “使用 project-wiki 判断这次改动是否需要同步知识，更新必要主题。”

阅读 [技能入口](skills/project-wiki/SKILL.md)。知识规范框架无关；Next.js 资产仅在选择网页接入时采用，不是 CMS 在线编辑后台或自动安装器。

## 维护参考资产

仓库根 package.json 仅用于开发验证参考资产，不是使用技能的前置条件，也不应复制到目标 Go/Express 项目。

```bash
npm ci
npm test
npm run typecheck
```

协议、角色、业务模型、分支/推送及发布规则都由目标项目决定。本技能不包含其他项目源码、业务文档、品牌或凭据。

Skills 安装参考：[官方安装说明](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)、[工具与目录](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)。
