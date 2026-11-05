# Next.js App Router 参考接入

仅在已选择 Next.js 网页浏览时采用。先读目标安装版本的 `node_modules/next/dist/docs/`；不存在时查官方文档，不凭模板升级框架。示例按异步 params 的 App Router 形态组织；Pages Router 项目应适配其现有入口，不搬入整套 App Router。

## 资产与依赖

`../assets/nextjs-wiki/` 是可改造源码，全部使用相对 import，不带项目品牌、角色、Cookie、shadcn 或业务 Provider。

- `wiki-core.ts`：固定根读取、YAML frontmatter、AST 标题/链接、可选字段、别名与图表资源检查。CLI 和服务端共用；不依赖 next。
- `wiki-view.tsx` 与 `wiki.module.css`：纯服务端阅读布局、导航、锚点、表格、关联页和预生成图表图片。
- `route.example.tsx`：带显式授权注入的路由工厂；缺少授权策略时不提供可直接公开的默认页面。
- `check-wiki.ts`：可选 CLI 检查入口。
- `render-diagrams.ts`：仅启用图表后采用的生成器。

基础运行依赖：gray-matter、github-slugger、unified、remark-parse、remark-gfm、mdast-util-to-string、unist-util-visit、zod、react-markdown、rehype-slug。沿用现有 React/Next 版本及包管理器，优先复用已安装兼容库；本仓库维护用 package.json 不是目标项目安装清单。CLI 示例使用 tsx，目标已有执行方式时适配它。

## 接入顺序

1. 确认内容根、路由前缀、公开/受限策略与页面布局；不复制项目数据、认证配置和业务约束。
2. 选择性复制资产到项目所属位置，适配相对路径、样式和 schema，导入服务端读取的入口加 `import "server-only"`。不要对供普通 Node CLI 使用的 core 添加该标记。
3. 在 `app/wiki/[[...slug]]/page.tsx` 创建路由，调用 `createWikiPage` 并注入项目授权函数。只有用户明确选择公开阅读时，才显式传入允许公开的策略。
4. 页面工厂先授权，再建索引与处理别名。授权回跳由现有认证完成，仅允许严格 Wiki 路径。角色、初始页和回工作台链接都由目标项目提供。
5. 接入校验与构建门禁，用固定内容目录读取。Next.js 运行层/standalone 文件追踪和 Docker 显式包含 Markdown 及可选 diagrams；构建通过不等于实际容器已验证。

调用示意（路径按项目适配）：

```tsx
import "server-only";
import { createWikiPage } from "./wiki/route.example";
import { requireProjectWikiAccess } from "./your-existing-auth";

export const dynamic = "force-dynamic";
export default createWikiPage({
  root: process.cwd() + "/content/wiki",
  basePath: "/wiki",
  title: "项目 Wiki",
  authorize: async (requestedPath) => {
    await requireProjectWikiAccess(requestedPath);
  },
});
```

这不是新增一个 `your-existing-auth` 认证系统的要求，实际代码必须连接项目现有策略。公开模式可以显式提供 `authorize: async () => {}`，前提是该公开范围已被用户选择。

## 渲染与图表

禁用 Markdown 原始 HTML；链接经共用解析器转换。图表预生成 SVG，以图片上下文呈现，不使用 dangerouslySetInnerHTML。默认不加载业务图片查看器；确需缩放时可复用项目独立图库，但不能引入业务订阅。模板不默认实现本地附件服务，扩展前先确定鉴权和资源契约。

## 维护与验证

静态内容可在服务端进程内缓存索引，开发时重读；每次请求先授权，内容缓存不缓存用户授权。初次参考实现不启用进程缓存，优先保证更新与隔离语义清晰，再按实际需要优化。

验证别名冲突/中文锚点/越界与脚本协议、未授权不读取内容、未知页 404；运行目标项目的类型检查和生产构建，人工查看导航与响应式。不因采用此技能改变默认构建器或 CI 平台。

官方依据：[App Router 动态路由](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)、[服务端与客户端组件](https://nextjs.org/docs/app/getting-started/server-and-client-components)、[react-markdown](https://github.com/remarkjs/react-markdown)。具体版本依目标环境文档核对。
