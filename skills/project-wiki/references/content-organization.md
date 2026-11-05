# 内容组织

## 从读者的问题建立主题

先通过真实任务检查知识能否定位：理解系统、修改核心行为、启动运行、处理典型故障。首页链接到这些任务所需主题；助手按需读相关主题，不要求每次通读。

概览、对象、规则和工程指南只是可选分类。复杂业务可按对象与流程展开，小型工具可把命令语义、配置和失败恢复写成少量平面主题；无内容不建空栏目。页面过短且不能独立回答问题时合并。

建议采用 Markdown 与相对 `.md` 链接；已有合理目录则保留。示例：

```text
content/wiki/
  index.md
  command-behavior.md
  configuration.md
  failure-and-recovery.md
  development.md
```

以上适合 CLI，不需要 HTTP server、React 或 Node。仓库阅读本身是完整交付。

## 页面元数据

既有方案优先保留。新方案建议稳定 `id`、`title`、`summary`；`kind`、`order`、`related` 根据需要采用，不为每页机械填关联。路径小写 kebab-case，`index.md` 作为目录入口。标题摘要应明确问题，不仅写文件名。

```yaml
---
id: failure-recovery
title: 失败与恢复
summary: 解释命令失败时如何判断结果并安全恢复。
related: [command-behavior]
---
```

网页排序需要时加 `order`，栏目/页面种类确有用途时加 `kind`。纯仓库 Wiki 不必为未使用的网页功能填字段。已有 Markdown 没有 frontmatter 时，不为本次局部维护强制迁移全站。

稳定 ID 不等于文件位置。合并或移动已发布主题时，可在新主题声明旧 ID、旧 slug 和目标章节：

```yaml
aliases:
  - id: old-retry-policy
    slug: reference/old-retry-policy
    anchor: 失败后的恢复
```

旧 ID/slug 不再复用，别名不生成导航或第二份正文。内部新链接直接指向规范主题，旧链接按需要保留。未发布过的临时页面无需创造兼容负担。仓库阅读器不会自动执行网页重定向：仍需修改仓库内部旧文件链接；有外部仓库链接承诺时，选择最小跳转页或项目已有重定向机制，并说明与网页 aliases 的差别。

## 连接事实来源

Wiki 解释含义与协作，不复刻机器契约。字段/约束指向 schema 或迁移，命令指向实际 manifest/Makefile，API 指向实际路由/契约，配置指向已脱敏示例。路径可作为代码文本显示；未提供源代码链接适配时，不把它伪装成 Wiki 网页链接。
