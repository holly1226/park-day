import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

test("AI endpoint reports missing configuration and executes the full AVA analyze chain against a local fixture model", async () => {
  process.env.NODE_ENV = "test";
  delete process.env.AVA_API_KEY;
  delete process.env.AVA_MODEL;
  const { server } = await import("../scripts/ai-server.mjs");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/analyze`;
  let calls = 0;
  const provider = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    const summary = body.messages.some((m) =>
      m.content.includes("Explain the executed query"),
    );
    calls++;
    const content = summary
      ? JSON.stringify({
          queryExplanation: "统计所有模拟观测行。",
          conclusion: "共有 744 条模拟观测记录。",
        })
      : 'SELECT COUNT(*) AS "记录数" FROM data';
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        id: "fixture",
        object: "chat.completion",
        created: 1,
        model: "fixture-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      }),
    );
  });
  try {
    const missing = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ question: "记录数", weather: "mild", hour: 14 }),
    });
    assert.equal(missing.status, 503);
    assert.match((await missing.json()).error, /AVA_API_KEY/);
    await new Promise((resolve) => provider.listen(0, "127.0.0.1", resolve));
    process.env.AVA_API_KEY = "fixture-key-not-a-secret";
    process.env.AVA_MODEL = "fixture-model";
    process.env.AVA_BASE_URL = `http://127.0.0.1:${provider.address().port}/v1`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "全部天气和时段共有多少条模拟观测记录？",
        weather: "mild",
        hour: 14,
      }),
    });
    const answer = await response.json();
    assert.equal(response.status, 200, JSON.stringify(answer));
    assert.equal(Number(answer.data[0]["记录数"]), 744);
    assert.match(answer.sql, /COUNT/);
    assert.match(answer.summary, /744/);
    assert.equal(calls, 2);
    const forbidden = await fetch(url, {
      method: "POST",
      headers: { Origin: "https://other.example" },
      body: "{}",
    });
    assert.equal(forbidden.status, 403);
    const invalid = await fetch(url, { method: "POST", body: "null" });
    assert.equal(invalid.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => provider.close(resolve));
  }
});
