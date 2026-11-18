# 🌳 公园的一天 · Park, a little closer.

**跟着一天的光影，发现人、树荫与小小设施之间的关系。**

一个面向公共空间设计的像素风交互原型，用 AVA 4.0 在浏览器真实计算公园设施、人流与停留数据。

[在线体验](https://holly1226.github.io/park-day/) · [AVA 的使用方式](#ava-真正做了什么) · [投稿文案](docs/SUBMISSION.md)

![公园观察台](docs/preview-desktop.png)

## 现在可以玩什么

- 拖动 06:00–21:00 的时间轴，或自动播放公园的一天。
- 切换普通天气 / 高温天气，观察设施使用的差异。
- 查看设施使用、人流与遮阴三个图层，点击 12 处设施看快照。
- 通过五个 AVA 查询探索人气角落、树荫与停留、经过点、空余座位和天气差异。
- 展开每条分析的 SQL 与结果表，导出结果或全部模拟数据。
- 配置本地模型后，通过 AVA `analyze()` 自由提问。

**在线版不需要 API Key。** 五个预设问题使用固定 SQL，交由真实 AVA + DuckDB-Wasm 执行，结论文字由结果模板生成。自由提问依赖本地可选模型服务；在线版会明确提示配置方式。

## 本地运行

需要 **Node.js 24 或更新版本**、npm 和现代浏览器。

```bash
git clone https://github.com/holly1226/park-day.git
cd park-day
npm ci
npm run dev
```

打开终端显示的地址，默认是 `http://127.0.0.1:5173`。macOS 也可以在解压源码后运行根目录 `Start.command`；它会检查 Node、安装依赖并启动演示。

首次安装会把 DuckDB 的 Worker 和 Wasm 文件复制到本地 `public/duckdb/`，约 75 MB。运行时从同源加载，**不依赖外部 CDN 或在线字体**。直接双击 HTML 不支持 Worker 和模块加载，请使用上述本地服务或在线体验。

### 可选：自由提问

复制 `.env.example` 为 `.env`，填写你自己的 OpenAI 兼容模型配置：

```dotenv
AVA_MODEL=your-model-name
AVA_API_KEY=your-api-key
AVA_BASE_URL=https://your-provider.example/v1
```

在另一个终端运行：

```bash
npm run ai
```

保持 `npm run dev` 同时运行，然后在页面底部输入问题。本地 Vite 代理把 `/api` 请求转交给 `127.0.0.1:8787`。密钥只读取本地 `.env`，不进入浏览器或 Git；模型调用可能产生提供商费用。模型分析会把问题、数据结构和相关查询结果发给你配置的提供商。

GitHub Pages 仅托管静态版，不托管 AI 服务。不要把密钥填入 `VITE_*` 变量或客户端代码。

## AVA 真正做了什么

| 环节 | 实现 |
| --- | --- |
| 加载数据 | `ava.source()` 读取 744 条确定性模拟观测的 CSV |
| 数据结构 | `ava.schema()` 查看表和字段 |
| 分析口径 | `ava.semantic()` 定义天气、时段、人次、容量和座位口径 |
| 浏览器查询 | `ava.query()` 执行地图快照、时间趋势及五类问题的 SQL |
| 自由问答 | 可选本地 Node 服务调用 `ava.analyze()`，完成模型翻译、查询与摘要 |
| 证据呈现 | 展示实际 SQL、实际结果表，允许导出 |

主要依赖：`@antv/ava@4.0.4`、社区 `ava-engine-duckdb-wasm@0.1.1`、`@duckdb/duckdb-wasm@1.33.1-dev57.0`、React、Vite、TypeScript。浏览器引擎使用公共接口注册；同一连接上的查询通过队列串行执行，避免流式结果被并发查询干扰。

像素地图、人物与条形图由本项目 SVG/CSS 绘制，根据 AVA 查询结果更新；未使用 AVA 的模型图表生成功能。作品不依赖 AI 生成素材。

## 数据口径

这是**虚构公园 + 模拟观测**，不是实时监测、真实轨迹或实测天气影响。

- 每行代表一个设施在一个天气场景、一个半小时时段的观测。
- `occupied` 是抽样时刻在场人数；设施合计不等于全园独立访客数。
- `visits` 是半小时到访人次，允许跨设施重复。
- `dwell` 是设施级模拟平均停留分钟；总览对非饮水设施取简单平均。
- `shade_ratio` 是预设遮阴比例，地图阴影是视觉示意，不是日照模型。
- 空座位仅对座椅和有座位的凉亭计算；其他设施的 `capacity` 表示人数容量。
- 人物数量经缩放呈现，不能逐个计数来还原统计值。
- “树荫与停留”的对比仅覆盖座椅、凉亭、平台与草坪；分组结果不能解释为遮阴的因果效应。

模拟规则位于 [src/data.ts](src/data.ts)，分析 SQL 位于 [src/queries.ts](src/queries.ts)。更换真实数据前，应先调整设施位置、输入字段和统计口径。

## 验证

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

测试覆盖数据唯一性和容量约束、CSV 转义、真实 Node AVA 计算、浏览器引擎与独立计算值一致性、天气/时段/设施/图层切换、五类查询、证据、下载、自动播放、移动端和引擎失败重试。

自由问答可用本地模拟模型端点测试完整 AVA 调用链；不使用或声称验证任何付费模型的实际回答质量。

## GitHub Pages

仓库含 `.github/workflows/pages.yml`。在仓库 Settings → Pages 中将 Source 设为 **GitHub Actions**，推送 `main` 即可自动测试、构建和部署。Wasm 由安装脚本从固定版本依赖复制，不提交生成的二进制文件。

## 设计与项目说明

[需求与验收范围](docs/PRODUCT.md) · [90 秒演示与投稿文案](docs/SUBMISSION.md)

原创像素场景采用苔绿、奶油白与木色，表达一座可以慢慢观察的小公园。手机端地图支持横向滑动，其他区域自适应。

## License & credits

MIT © 2026 holly1226。原创场景与代码使用 MIT；依赖及图标保留各自许可证。

- [AntV AVA](https://github.com/antvis/AVA)
- [AVA Engine DuckDB-Wasm](https://github.com/yvonneyx/ava-engine-duckdb-wasm)
- [DuckDB-Wasm](https://github.com/duckdb/duckdb-wasm)
- [Lucide](https://lucide.dev/)
