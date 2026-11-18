import { AVA, registerEngine } from "@antv/ava/browser";
import { DuckDBWasmEngine } from "ava-engine-duckdb-wasm";
import { observations, toCSV, facilities, layoutKey } from "./data";
registerEngine("duckdb-wasm", DuckDBWasmEngine);
let ready: Promise<any> | undefined;
// DuckDB prepared streaming readers share one connection. Serialize queries so
// another send() cannot invalidate the reader that is still being consumed.
let queryTail: Promise<unknown> = Promise.resolve();
export function getAVA(): Promise<any> {
  if (!ready)
    ready = (async () => {
      const base = new URL(import.meta.env.BASE_URL, window.location.href).href;
      const ava = new AVA({
        llm: { model: "local-sql-demo" },
        engine: {
          type: "duckdb-wasm",
          bundles: {
            mvp: {
              mainModule: `${base}duckdb/duckdb-mvp.wasm`,
              mainWorker: `${base}duckdb/duckdb-browser-mvp.worker.js`,
            },
            eh: {
              mainModule: `${base}duckdb/duckdb-eh.wasm`,
              mainWorker: `${base}duckdb/duckdb-browser-eh.worker.js`,
            },
          },
        },
      });
      await ava.source({ type: "csv", options: { csv: toCSV(observations) } });
      await ava.schema();
      await ava.semantic({}, () => ({
        description:
          "公园模拟观测表 data。每行是一个设施在一个半小时时段的观测。weather:mild普通天气/hot高温；hour为0至23.5的半小时时段；scenario baseline初始/current当前；record_type facility设施/park全园；occupied是抽样时刻在场人数；visits是半小时到访人次，可跨设施重复，不能作为独立访客数；dwell平均停留分钟；shade_ratio遮阴比例0至1；capacity为设施容量。空座位仅对kind为座椅和凉亭计算。模拟数据不支持真实天气影响的因果结论。",
      }));
      return ava;
    })().catch((e) => {
      ready = undefined;
      throw e;
    });
  return ready;
}
export function runQuery(sql: string): Promise<Record<string, any>[]> {
  const operation = queryTail.then(async () => {
    const ava = await getAVA();
    const result = await ava.query(sql);
    return result.data.map((r: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [
          k,
          typeof v === "bigint" ? Number(v) : v,
        ]),
      ),
    );
  });
  queryTail = operation.catch(() => {});
  return operation;
}

let activeDataset = layoutKey(facilities);
export function queryDataset(
  dataset: import("./data").Observation[],
  key: string,
  queries: string[],
): Promise<Record<string, any>[][]> {
  const operation = queryTail.then(async () => {
    const ava = await getAVA();
    if (activeDataset !== key) {
      await ava.source({ type: "csv", options: { csv: toCSV(dataset) } });
      await ava.schema();
      await ava.semantic({}, () => ({
        description:
          "公园规则模拟数据 data。scenario baseline初始布局/current当前布局；record_type facility设施/park全园。hour 0-23.5半小时时段。全园occupied=walking+resting是一人一个小人的模拟访客；visits全园行为入园人次，设施行为重复到访人次。设施demand想使用人数，unserved未能使用人数，capacity容量，light夜间照明覆盖0/1，shade_ratio遮阴比例。只比较同天气同小时不同方案；布局影响来自显式规则，不是真实预测。",
      }));
      activeDataset = key;
    }
    const answers = [];
    for (const sql of queries) {
      const r = await ava.query(sql);
      answers.push(
        r.data.map((r: Record<string, unknown>) =>
          Object.fromEntries(
            Object.entries(r).map(([k, v]) => [
              k,
              typeof v === "bigint" ? Number(v) : v,
            ]),
          ),
        ),
      );
    }
    return answers;
  });
  queryTail = operation.catch(() => {});
  return operation;
}
