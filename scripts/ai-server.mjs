import { createServer } from "node:http";
import { AVA } from "@antv/ava";
import {
  buildObservations,
  facilities,
  toCSV,
  validateLayout,
} from "../src/data.ts";

const port = Number(process.env.AI_PORT || 8787);
let running = false;
export const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const send = (status, body) => {
    res.writeHead(status);
    res.end(
      JSON.stringify(body, (_, v) => (typeof v === "bigint" ? Number(v) : v)),
    );
  };
  if (req.url === "/api/health" && req.method === "GET")
    return send(200, {
      configured: !!(process.env.AVA_API_KEY && process.env.AVA_MODEL),
    });
  if (req.url !== "/api/analyze" || req.method !== "POST")
    return send(404, { error: "接口不存在。" });
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
    return send(403, { error: "此服务仅允许本地页面使用。" });
  if (!process.env.AVA_API_KEY || !process.env.AVA_MODEL)
    return send(503, {
      error:
        "请在本地 .env 中配置 AVA_API_KEY、AVA_MODEL 和可选的 AVA_BASE_URL，然后重新运行 npm run ai。在线演示的五个预设分析无需密钥。",
    });
  if (running) return send(429, { error: "上一条分析尚未完成，请稍后再试。" });
  let ava;
  try {
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 64000)
        return send(413, { error: "问题过长，请缩短后再试。" });
    }
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(400, { error: "请求必须是有效 JSON。" });
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return send(400, { error: "请求必须是一个 JSON 对象。" });
    const { question, weather, hour, scenario = "current" } = body;
    let layout;
    try {
      layout =
        body.layout === undefined ? facilities : validateLayout(body.layout);
    } catch {
      return send(400, { error: "公园方案无效，请重新导入。" });
    }
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 1000 ||
      !["mild", "hot"].includes(weather) ||
      !["baseline", "current"].includes(scenario) ||
      !Number.isFinite(hour) ||
      hour < 0 ||
      hour > 23.5 ||
      (hour * 2) % 1 !== 0
    )
      return send(400, { error: "请提供有效问题、天气和半小时时段。" });
    running = true;
    ava = new AVA({
      llm: {
        model: process.env.AVA_MODEL,
        apiKey: process.env.AVA_API_KEY,
        ...(process.env.AVA_BASE_URL
          ? { baseURL: process.env.AVA_BASE_URL }
          : {}),
        maxRetries: 1,
      },
    });
    await ava.source({
      type: "csv",
      options: { csv: toCSV(buildObservations(layout)) },
    });
    await ava.schema();
    await ava.semantic({}, () => ({
      description:
        "橡果公园规则模拟数据表 data。scenario baseline为初始方案/current为当前方案；record_type facility设施/park全园；全园occupied=walking+resting，visits为入园人次；设施visits可重复。demand想使用人数，unserved未能使用人数，light夜间灯光覆盖0/1。weather mild普通天气/hot高温；hour从0到23.5以0.5递增；facility_id设施ID；name名称；zone区域；kind类型；capacity设施容量；shade_ratio遮阴比例0-1；visits半小时到访人次，允许跨设施重复；occupied某一抽样时刻在场人数；dwell设施平均停留分钟；temperature模拟摄氏度。占用率按 occupied/capacity。空余座位只统计kind座椅与凉亭。所有数据是模拟，不是实测、不支持因果推断。",
    }));
    const prompt = `请用中文回答。用户正在观察 weather='${weather}'、hour=${hour}、scenario='${scenario}' 的场景，除非明确要求对比，默认仅分析此天气、此时段和此方案。请明确筛选record_type：公园总量用park，设施分析用facility，不能相加两类行。结果应使用中文列名。解释清楚统计口径，严格根据查询结果，不编造原因。用户问题：${question.trim()}`;
    const answer = await ava.analyze(prompt, {
      strategy: { type: "direct", maxRetries: 1 },
      includeSummary: true,
      maxRows: 100,
    });
    await ava.dispose();
    ava = undefined;
    running = false;
    send(200, {
      summary: answer.text || "分析完成，请展开数据查看结果。",
      sql: answer.sql || "",
      data: answer.data,
    });
  } catch (error) {
    console.error("AVA analysis failed:", error?.name || "Error");
    send(502, {
      error:
        "模型分析未完成，请检查模型配置、网络和模型的结构化输出支持，然后重试。",
    });
  } finally {
    if (ava) await ava.dispose().catch(() => {});
    running = false;
  }
});
if (process.env.NODE_ENV !== "test")
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Local AVA AI service: http://127.0.0.1:${port} (model ${process.env.AVA_MODEL ? "configured" : "not configured"})`,
    ),
  );
