# Theme Earthquake 提升路线图

> 生成日期：2026-06-24
> 数据来源：3 份 AI 审查报告 + 10 个参考主题扫描（reference-themes/ 目录）
> 用途：逐条规划，未来慢慢实现。每条标注【优先级】【工作量】【参考来源】

---

## 一、Bug 修复（必修）

### B-1 `#dates.format` 处理 Instant 字段（8 处遗漏）
- **状态**：第七轮只修了 BaseHead.astro 4 处，以下 8 处仍在用 `#dates.format` 处理 `java.time.Instant`
- **文件**：
  - `src/pages/post.astro:95` — `post.spec.publishTime`
  - `src/pages/archives.astro:47` — `post.spec.publishTime`
  - `src/pages/page.astro:101` — `singlePage.spec.publishTime`
  - `src/pages/photos.astro:148` — `photo.exif.dateTimeOriginal`
  - `src/pages/photo.astro:231` — `photo.exif.dateTimeOriginal`
  - `src/pages/moments.astro:151` — `moment.spec.releaseTime`
  - `src/pages/moment.astro:26` — `moment.spec.releaseTime`
  - `public/modules/post-card.html:87` — `post.spec.publishTime`
- **实现**：全部 `#dates.format(xxx, 'yyyy-MM-dd')` → `#temporals.format(xxx, 'yyyy-MM-dd')`
- **优先级**：🔴 P0（`th:content` 会 500，`th:text` 可能静默输出空值）
- **工作量**：10 分钟
- **来源**：MEMORY 血泪教训 + 本轮扫描

### B-2 `article:modified_time` 修改（未提交，需验证）
- **状态**：git diff 已改用 `post.status.lastModifyTime`，但未提交，需在 Halo 实例验证 PostStatus 是否暴露此字段
- **实现**：验证后提交。若 PostStatus 无此字段则回退为 publishTime
- **优先级**：🟡 P1
- **工作量**：验证 10 分钟

### B-3 `pagination.html` 内联 script 重复输出
- **状态**：每次 `th:replace` 分页组件都内联一个 `<script>function earthquakePaginationGo()`
- **影响**：多分页页面会重复定义同名函数（不冲突但不干净）
- **实现**：将函数提取到 `public/assets/js/pagination.js`，分页组件只输出 `<script src>` 一次；或用 `th:if="${#httpServletRequest.getAttribute('pagination_script_loaded') != true}"` 控制只输出一次
- **优先级**：🟢 P3
- **工作量**：20 分钟
- **来源**：报告2 BUG-5

### B-4 `footer-social.html` 死代码
- **状态**：`th:if="${item.icon == null}"` 的 fallback 分支永远不会命中（settings.yaml 用 `$formkit: iconify`，不存在 `icon` 字段）
- **实现**：删除死代码分支，只保留 `th:utext="${item.iconify.value}"`
- **优先级**：🟢 P3
- **工作量**：5 分钟
- **来源**：报告2 BUG-4

---

## 二、架构与代码质量

### A-1 代码注入设置（强烈推荐）
- **状态**：用户想加统计代码/自定义 CSS 必须改源码
- **实现**：settings.yaml 新增 `custom_code` 组，含 4 个 textarea：
  - `head_html` — 注入到 `</head>` 前（统计代码、meta 标签）
  - `footer_html` — 注入到 `</body>` 前（JS SDK）
  - `custom_css` — 注入到 `<style>` 标签
  - `custom_js` — 注入到 `<script>` 标签
  - 在 Layout.astro / BaseHead.astro 用 `th:utext="${theme.config.custom_code?.head_html}"` 输出
- **优先级**：🟠 P1
- **工作量**：1 小时
- **参考**：hydro-minim `settings.yaml`

### A-2 Post-List 列表抽取为 fragment
- **状态**：index/category/tag/author/categories/tags 6+ 个页面重复相同的 grid + post-card + 空状态 + 分页结构
- **实现**：创建 `public/modules/post-list.html`，`th:fragment="post-list(posts, page, totalPages, layout)"`，各页面 `th:replace` 调用
- **优先级**：🟠 P1
- **工作量**：2 小时
- **来源**：报告1 #8、报告2 DUP-3、报告3 #8

### A-3 Post/Page 文章页抽取公共 fragment
- **状态**：post.astro 与 page.astro ~80% 结构重复（标题/封面/元信息/TOC/点赞/评论/分享）
- **实现**：创建 `modules/article-layout.html`，参数化区分 post/page
- **优先级**：🟡 P2
- **工作量**：3 小时
- **来源**：报告2 DUP-1

### A-4 rAF 防抖工具函数提取
- **状态**：main.ts / toc.ts / image-preview.ts 三处重复"flag + requestAnimationFrame"模式
- **实现**：创建 `src/assets/utils/raf.ts`：
  ```ts
  export function rafThrottle(fn: () => void): () => void {
    let scheduled = false;
    return () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; fn(); });
    };
  }
  ```
- **优先级**：🟡 P2
- **工作量**：30 分钟
- **来源**：报告1 #7、报告3 #7

### A-5 resolveDataAttribute 工具函数提取
- **状态**：upvote.ts 的 `resolveName` 和 ui-permission.ts 的 `resolveCurrentUser` 逻辑相同
- **实现**：提取到 `src/assets/utils/dataset.ts`
- **优先级**：🟢 P3
- **工作量**：20 分钟
- **来源**：报告1 #4

### A-6 dropdown / colorSchemeSwitcher 模式抽象
- **状态**：两个 Alpine 组件都有 open/close/toggle + timer 延迟 + hover 检测
- **实现**：提取为 `createDropdownFactory()` 工厂函数
- **优先级**：🟢 P3
- **工作量**：1 小时
- **来源**：报告1 #5

### A-7 字体 preload 用 th:each 循环
- **状态**：8 组 `<link rel="preload">` 几乎相同，只有字体名和字重不同
- **实现**：用 `th:with="fonts={{'noto-sans-sc':[400,500,700]},...}"` + `th:each` 循环生成
- **优先级**：🟢 P3
- **工作量**：30 分钟
- **来源**：报告2 DUP-5、报告3 #9

### A-8 OG / Twitter Card meta 抽取 fragment
- **状态**：og: 和 twitter: 字段几乎一致，两套逻辑分开写
- **实现**：构造 context 对象后循环输出，或抽取 fragment
- **优先级**：🟢 P3
- **工作量**：30 分钟
- **来源**：报告3 #11

---

## 三、性能优化

### P-1 Alpine.js 按需加载
- **状态**：所有页面无条件 `Alpine.start()`
- **实现**：`if (document.querySelector('[x-data]')) { Alpine.start(); }`
- **优先级**：🟠 P1
- **工作量**：5 分钟
- **来源**：报告3 #14

### P-2 TOC DOM 查询缓存
- **状态**：`setActiveHeading` 每次滚动都 `document.querySelectorAll(".toc-link")`
- **实现**：在 `generateToc` 时缓存链接元素引用到闭包变量
- **优先级**：🟠 P1
- **工作量**：15 分钟
- **来源**：报告1 #3、报告2 PERF-3

### P-3 TOC `ensureHeadingIds` 缩小查询范围
- **状态**：`document.querySelectorAll("[id]")` 遍历整个 DOM
- **实现**：改为 `content.querySelectorAll("[id]")`
- **优先级**：🟡 P2
- **工作量**：5 分钟
- **来源**：报告2 PERF-3

### P-4 github-markdown.css 精简
- **状态**：1199 行，占总 CSS 55%
- **实现**：评估未使用样式，或用 Tailwind Typography 替代（项目已装 `@tailwindcss/typography`）
- **优先级**：🟡 P2
- **工作量**：3 小时
- **来源**：报告1 #7

### P-5 图标按需加载
- **状态**：全量引入 `@iconify-json/tabler` 等，多数页面只用 10-20 个
- **实现**：用 Iconify 按需 API 或 PurgeIcons，可减 90%+ 图标体积
- **优先级**：🟡 P2
- **工作量**：2 小时
- **来源**：报告3 #17

### P-6 CSS 按页面拆分懒加载
- **状态**：main.ts 全量 import 5 个 CSS 文件
- **实现**：markdown-body.css / moment.css / image-preview.css 改为按页面动态 import
- **优先级**：🟢 P3
- **工作量**：1 小时
- **来源**：报告3 #15

### P-7 主题预设 CSS 合并
- **状态**：38 个预设部分 hue 值相同（如 pastel/fantasy/silk 都是 285）
- **实现**：合并相同 hue 的选择器
- **优先级**：🟢 P3
- **工作量**：20 分钟
- **来源**：报告1 #8、报告2 OPT-9

### P-8 photos.astro hidden span 改 data 属性
- **状态**：每张照片 ~10 个 `<span class="hidden">` 存储 metadata
- **实现**：改用 `data-*` 属性，减少 DOM 节点
- **优先级**：🟢 P3
- **工作量**：1 小时
- **来源**：报告2 PERF-1

### P-9 预压缩 .gz 资源
- **状态**：构建产物无 gzip 预压缩
- **实现**：在 sanitize-astro-assets.mjs 后增加 gzip 生成步骤，配合服务器 `gzip_static`
- **优先级**：🟢 P3
- **工作量**：1 小时
- **参考**：vapor `templates/assets/dist/*.gz`

### P-10 post-card 首屏图 loading=eager
- **状态**：所有封面图都 `loading="lazy"`，影响首屏 LCP
- **实现**：第一篇文章 `iterStat.index == 0` 时用 `loading="eager" fetchpriority="high"`
- **优先级**：🟢 P3
- **工作量**：10 分钟
- **来源**：报告2 OPT-5

### P-11 instant.page 预加载
- **状态**：无链接预加载
- **实现**：settings 加开关，注入 `<script type="module" src="https://instant.page/5.2.0" integrity="...">`
- **优先级**：🟡 P2
- **工作量**：15 分钟
- **参考**：higan-hz `components/instantpage-injection/`

---

## 四、新功能特性（按价值排序）

### F-1 站内搜索
- **状态**：earthquake 无任何搜索功能
- **实现**：
  - Header 增加搜索入口（图标按钮）
  - Alpine.js 实现全屏搜索模态框（Ctrl/Cmd+K 快捷键）
  - 调用 Halo 搜索 API `/apis/api.halo.run/v1alpha1/indices/post` 
  - 实时 debounce 搜索 + `<mark>` 关键词高亮 + HTML 转义防 XSS
- **优先级**：🟠 P1
- **工作量**：4 小时
- **参考**：fuwari `Search.svelte`、serenity-grace `search-modal.html`、clarity `search-shortcut.ts`、vapor `search.html`

### F-2 Mermaid 图表渲染
- **状态**：文章中 mermaid 代码块不渲染
- **实现**：
  - settings 加 `is_mermaid_enable` 开关 + 内容范围选择器
  - 动态 `import('mermaid')` 按需加载
  - 识别默认编辑器/Vditor/文本绘图插件产出的代码块
  - 明暗双主题初始化参数
- **优先级**：🟠 P1
- **工作量**：2 小时
- **参考**：higan-hz `src/templates/components/mermaid-injection/`

### F-3 活跃度热力日历
- **状态**：无文章发布活跃度可视化
- **实现**：
  - 按月展示热力图，聚合 post/moment/comment 数量
  - 4 级色阶 + 月份切换
  - 放在归档页或关于页
  - role/aria-label 无障碍
- **优先级**：🟡 P2
- **工作量**：4 小时
- **参考**：clarity `src/utils/activity-calendar.ts`

### F-3D 球形标签云
- **状态**：tags 页面是普通列表
- **实现**：
  - settings 加 `tag_cloud_style` 选项（列表/球形）
  - 球面均匀分布 + rAF 渲染
  - 鼠标跟随/拖拽旋转/触摸支持
  - 深度模糊 + 透明度
- **优先级**：🟡 P2
- **工作量**：3 小时
- **参考**：serenity-grace `tag-sphere.js`、hydro-minim `tag-cloud.ts`

### F-5 文章海报分享
- **状态**：分享只有链接复制
- **实现**：
  - html2canvas 生成文章封面 + 标题 + 二维码海报
  - 纯 TS 二维码生成（无依赖）或 QRCode.js
  - 下载到本地
- **优先级**：🟡 P2
- **工作量**：3 小时
- **参考**：clarity `poster.ts`、hydro-minim `poster-qr.ts`

### F-6 友链自助申请
- **状态**：links 页面静态展示
- **实现**：
  - 前端表单让访客提交友链（新增/修改）
  - 调用 plugin-links-submit 插件 API
  - 支持分组选择 + 邮箱通知
- **优先级**：🟡 P2
- **工作量**：3 小时
- **参考**：clarity `links-submit.ts`、vapor `add-link.html`

### F-7 留言板页面
- **状态**：无独立留言板
- **实现**：新建 `src/pages/guestbook.astro`，基于评论组件，含留言数/运行天数统计
- **优先级**：🟡 P2
- **工作量**：1 小时
- **参考**：serenity-grace `guestbook.html`

### F-8 前端发布瞬间
- **状态**：moments 页面只能后台发布
- **实现**：
  - 登录用户在前端模态框发布瞬间
  - 支持图片/视频/音频上传
  - 调用 Halo UC API
  - XSS 防护（escapeHtml/sanitizeTag/validateUrl）
- **优先级**：🟢 P3
- **工作量**：6 小时
- **参考**：sky-blog `moment-publish.js`

### F-9 mew-hide 评论解锁隐藏内容
- **状态**：无隐藏内容功能
- **实现**：Web Component `mew-hide`，评论后解锁显示隐藏内容
- **优先级**：🟢 P3
- **工作量**：3 小时
- **参考**：dream2-plus `mew-custom.js`

### F-10 mew-tabs 标签页内容
- **状态**：文章内无 tab 切换
- **实现**：Web Component `mew-tabs`，支持多标签页内容展示
- **优先级**：🟢 P3
- **工作量**：2 小时
- **参考**：dream2-plus `mew-custom.js`

### F-11 外链安全跳转中转页
- **状态**：外链直接跳转
- **实现**：创建 `src/pages/redirect.astro`，倒计时 + 安全提示
- **优先级**：🟢 P3
- **工作量**：1 小时
- **参考**：dream2-plus `security_link.html`

### F-12 赞助页
- **状态**：无赞助功能
- **实现**：新建 `src/pages/sponsor.astro`，支付宝/微信二维码 + 赞赏名单表格
- **优先级**：🟢 P3
- **工作量**：2 小时
- **参考**：jyf `zan.html`

### F-13 友圈聚合
- **状态**：links 页面不展示友链站点最新文章
- **实现**：调用 `/apis/api.link.halo.run/v1alpha1/linkfeeds`，分页展示友链站点最新文章
- **优先级**：🟢 P3
- **工作量**：3 小时
- **参考**：serenity-grace `friends-circle.js`

### F-14 递归分类树
- **状态**：categories 页面平铺展示
- **实现**：Thymeleaf 递归 fragment 渲染父子分类层级
- **优先级**：🟢 P3
- **工作量**：1 小时
- **参考**：quiet `category-tree.html`

### F-15 默认封面轮换兜底
- **状态**：文章无封面时无兜底
- **实现**：settings 配置 3 张默认封面列表，无封面时轮换使用
- **优先级**：🟢 P3
- **工作量**：30 分钟
- **参考**：hydro-minim `settings.yaml`

---

## 五、UI/UX 提升

### U-1 平滑滚动（Lenis）
- **状态**：原生滚动，无惯性平滑
- **实现**：引入 lenis（~3KB），Layout.astro 初始化，`data-lenis-prevent` 标记模态框等独立滚动区域
- **优先级**：🟡 P2
- **工作量**：1 小时
- **参考**：hydro-minim `lenis-scroll-boundaries.ts`、serenity-grace `main.js`

### U-2 SPA 页面切换（Swup）
- **状态**：每次点击链接整页刷新
- **实现**：`@swup/astro` 集成，容器化替换 `main`，预加载 + 缓存 + 平滑滚动，`data-no-swup` 跳过。可与 View Transition 结合
- **优先级**：🟡 P2
- **工作量**：3 小时
- **参考**：fuwari `astro.config.mjs`、clarity `swup.ts`

### U-3 meta theme-color
- **状态**：暗色模式未设置移动端浏览器地址栏配色
- **实现**：BaseHead.astro 输出 `<meta name="theme-color" th:content="${colorScheme == 'dark' ? '#1a1a1a' : '#ffffff'}">`
- **优先级**：🟠 P1
- **工作量**：5 分钟
- **参考**：higan-hz `meta-theme-color/template.html`

### U-4 图片主色调提取
- **状态**：固定 OKLCH 色系
- **实现**：ColorThief 提取封面主色，作为该页临时强调色（--earthquake-primary），localStorage 缓存
- **优先级**：🟢 P3
- **工作量**：3 小时
- **参考**：vapor `src/utils/color/index.ts`

### U-5 FAB 浮动操作按钮
- **状态**：只有回顶按钮
- **实现**：可配置 FAB，包含复制链接/滚动到评论/回顶等操作
- **优先级**：🟢 P3
- **工作量**：2 小时
- **参考**：hydro-minim `fab-actions.ts`

### U-6 水印
- **状态**：无水印
- **实现**：post.astro 增加水印设置项，可配置文字（自定义/站点标题）+ 透明度
- **优先级**：🟢 P3
- **工作量**：1 小时
- **参考**：serenity-grace `watermark.html`

### U-7 加载屏幕
- **状态**：无加载屏
- **实现**：Layout.astro 注入可配置加载屏（5 种 CSS 动画），加载完淡出
- **优先级**：🟢 P3
- **工作量**：1 小时
- **参考**：sky-blog `loading-screen.css`

### U-8 DisplaySettings 色相滑块
- **状态**：38 个预设只能选固定值
- **实现**：颜色设置增加 hue 滑块 + OKLCH 色彩条预览 + 重置按钮，用户自定义色相
- **优先级**：🟢 P3
- **工作量**：2 小时
- **参考**：fuwari `DisplaySettings.svelte`

### U-9 品牌多形态 Logo
- **状态**：只有一种 Logo
- **实现**：settings 支持方形/长方形 + 深色/浅色 Logo + alt 文本
- **优先级**：🟢 P3
- **工作量**：1 小时
- **参考**：hydro-minim `settings.yaml`

---

## 六、无障碍

### A11y-1 分享模态框焦点陷阱
- **状态**：share-modal 用 `x-teleport` + ESC 关闭，但无焦点陷阱，Tab 可能聚焦到模态框后
- **实现**：复用 image-preview.ts 的 `installFocusTrap` 逻辑
- **优先级**：🟡 P2
- **工作量**：1 小时
- **来源**：报告2 OPT-2

### A11y-2 upvote alert 改 Toast
- **状态**：网络错误用 `alert()` 阻塞主线程
- **实现**：实现轻量 Toast 组件（参考 clarity `toast.ts`），upvote 失败时显示
- **优先级**：🟡 P2
- **工作量**：2 小时
- **来源**：报告1 #2、报告2 OPT-7、报告3 #19

### A11y-3 settings 输入验证
- **状态**：毛玻璃透明度等数值字段无验证
- **实现**：`glass_navbar_opacity` 改 `$formkit: number` + `min/max/step`，或 CSS `clamp()` 保护
- **优先级**：🟢 P3
- **工作量**：15 分钟
- **来源**：报告2 OPT-1

---

## 七、国际化

### I18n-1 多语言 i18n 系统
- **状态**：只有 `zh_CN.properties`，无英文
- **实现**：
  - 补充 `i18n/en.properties`
  - settings 加语言切换选项
  - 模板中 `th:text="#{key}"` 替换硬编码中文
- **优先级**：🟢 P3
- **工作量**：6 小时
- **参考**：higan-hz `i18n/`（default/en/es/zh/zh_Hans/zh_Hant）、dream2-plus `i18n/`（4 语言）

### I18n-2 i18n 防御性检查
- **状态**：`window.i18nResources["key"]` 直接访问，key 不存在会显示 undefined
- **实现**：统一用 image-preview.ts 的 `i18n(key, fallback)` 模式
- **优先级**：🟡 P2
- **工作量**：1 小时
- **来源**：报告1 #1

---

## 八、安全

### S-1 Service Worker 离线缓存
- **状态**：无离线支持
- **实现**：可选启用的 Service Worker，版本化 cache，CDN 竞速（Promise.any + AbortController）
- **优先级**：🟢 P3
- **工作量**：4 小时
- **参考**：dream2-plus `src/js/sw.js`

### S-2 CSP upgrade-insecure-requests
- **状态**：无 CSP 设置
- **实现**：settings 加开关，输出 `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`
- **优先级**：🟢 P3
- **工作量**：10 分钟
- **参考**：higan-hz `settings.yaml`

### S-3 防镜像站点
- **状态**：无域名保护
- **实现**：settings 配置域名白名单（Base64），非白名单域名跳转回正确站点
- **优先级**：🟢 P3
- **工作量**：1 小时
- **参考**：higan-hz `settings.yaml`

---

## 九、开发工具

### D-1 性能监测面板
- **状态**：无前端性能监测
- **实现**：浮动可拖拽 Canvas 面板，实时 FPS/JS 堆内存/长任务/P95/P99，默认关闭，开发调试用
- **优先级**：🟢 P3
- **工作量**：8 小时
- **参考**：higan-hz `performance-monitor/index.ts`

### D-2 构建插件：Thymeleaf 模板压缩
- **状态**：模板未压缩
- **实现**：vite 插件压缩模板，保留 `/*[[...]]*/` 表达式
- **优先级**：🟢 P3
- **工作量**：3 小时
- **参考**：higan-hz `vite-plugin-thymeleaf-minify.ts`

---

## 优先级总览

| 优先级 | 编号 | 标题 | 工作量 |
|--------|------|------|--------|
| 🔴 P0 | B-1 | #dates.format → #temporals.format（8处） | 10min |
| 🟠 P1 | B-2 | article:modified_time 验证提交 | 10min |
| 🟠 P1 | A-1 | 代码注入设置 | 1h |
| 🟠 P1 | A-2 | Post-List 抽取 fragment | 2h |
| 🟠 P1 | P-1 | Alpine.js 按需加载 | 5min |
| 🟠 P1 | P-2 | TOC DOM 查询缓存 | 15min |
| 🟠 P1 | F-1 | 站内搜索 | 4h |
| 🟠 P1 | F-2 | Mermaid 图表渲染 | 2h |
| 🟠 P1 | U-3 | meta theme-color | 5min |
| 🟡 P2 | A-3 | Post/Page 抽取 fragment | 3h |
| 🟡 P2 | A-4 | rAF 防抖工具提取 | 30min |
| 🟡 P2 | P-3 | TOC 查询范围缩小 | 5min |
| 🟡 P2 | P-4 | github-markdown.css 精简 | 3h |
| 🟡 P2 | P-5 | 图标按需加载 | 2h |
| 🟡 P2 | P-11 | instant.page 预加载 | 15min |
| 🟡 P2 | F-3 | 活跃度热力日历 | 4h |
| 🟡 P2 | F-4 | 3D 球形标签云 | 3h |
| 🟡 P2 | F-5 | 文章海报分享 | 3h |
| 🟡 P2 | F-6 | 友链自助申请 | 3h |
| 🟡 P2 | F-7 | 留言板页面 | 1h |
| 🟡 P2 | U-1 | 平滑滚动 Lenis | 1h |
| 🟡 P2 | U-2 | SPA 页面切换 Swup | 3h |
| 🟡 P2 | A11y-1 | 分享模态框焦点陷阱 | 1h |
| 🟡 P2 | A11y-2 | upvote alert 改 Toast | 2h |
| 🟡 P2 | I18n-2 | i18n 防御性检查 | 1h |
| 🟢 P3 | 其余 20 项 | 见各条目 | — |

---

## 参考主题索引

| 主题 | 路径 | 主要借鉴点 |
|------|------|-----------|
| fuwari | reference-themes/fuwari | 搜索、PhotoSwipe、EXIF、DisplaySettings、Swup、备案 |
| hydro-minim | reference-themes/hydro-minim | 代码注入、Lenis、二维码、标签云、FAB、Logo、封面兜底 |
| higan-hz | reference-themes/higan-hz | Mermaid、instant.page、性能面板、i18n、meta theme-color、自定义字体/光标、CSP、构建插件 |
| dream2-plus | reference-themes/dream2-plus | Service Worker、i18n、mew-* 组件、外链跳转、侧栏部件、鼠标特效 |
| clarity | reference-themes/clarity | 热力日历、Swup、Ctrl+K、友链提交、海报、Preact 组件、Toast |
| jyf | reference-themes/jyf | 登录认证、赞助页、TODO 页、光标主题 |
| sky-blog | reference-themes/sky-blog | 前端发布瞬间、加载屏、二维码分享、表情选择器 |
| serenity-grace | reference-themes/serenity-grace | PJAX、Lenis、3D 标签云、搜索模态框、水印、留言板、友圈聚合 |
| quiet | reference-themes/quiet | 递归分类树、空状态组件、srcset、分页组件 |
| vapor | reference-themes/vapor | 图片主色提取、搜索页、友链申请、Lit 组件、预压缩 .gz |
