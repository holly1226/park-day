import { timeSlot, type Scenario, type Weather } from "./data";
export type QuestionId = "busy" | "seats" | "shade" | "layout" | "night";
export const questions = [
  {
    id: "busy",
    label: "哪些设施最受欢迎？",
    short: "按到访人次排序",
    icon: "01",
  },
  {
    id: "seats",
    label: "哪里还有空位坐？",
    short: "查空位、遮阴和照明",
    icon: "02",
  },
  {
    id: "shade",
    label: "树荫附近更适合停留吗？",
    short: "比较两组设施的使用情况",
    icon: "03",
  },
  {
    id: "layout",
    label: "我的布置改变了什么？",
    short: "与初始布局在同一时刻比较",
    icon: "04",
  },
  {
    id: "night",
    label: "夜间哪些设施有照明？",
    short: "查路灯覆盖和模拟使用",
    icon: "05",
  },
] as const;
export const where = (
  weather: Weather,
  hour: number,
  scenario: Scenario = "current",
) =>
  `weather='${weather}' AND hour=${timeSlot(hour)} AND scenario='${scenario}'`;
export function queryFor(
  id: QuestionId,
  weather: Weather,
  hour: number,
  scenario: Scenario = "current",
) {
  const f = where(weather, hour, scenario);
  const valid = `${f} AND record_type='facility' AND kind NOT IN ('树木','路灯')`;
  return (
    {
      busy: `SELECT name AS "设施", visits AS "到访人次", occupied AS "停留人数", capacity AS "容量", demand AS "想使用人数", unserved AS "未能使用人数" FROM data WHERE ${valid} ORDER BY visits DESC,occupied DESC`,
      seats: `SELECT name AS "设施", capacity-occupied AS "空余座位", ROUND(shade_ratio*100) AS "遮阴%", CASE WHEN light=1 THEN '有灯' ELSE '未覆盖' END AS "夜间照明" FROM data WHERE ${f} AND record_type='facility' AND kind IN ('座椅','凉亭') AND capacity>occupied ORDER BY "空余座位" DESC`,
      shade: `SELECT CASE WHEN shade_ratio>=0.5 THEN '遮阴较多' ELSE '遮阴较少' END AS "设施分组", COUNT(*) AS "设施数量", SUM(occupied) AS "停留人数", SUM(unserved) AS "未能使用人数", ROUND(AVG(CASE WHEN occupied>0 THEN dwell END),1) AS "平均停留分钟" FROM data WHERE ${valid} AND kind IN ('座椅','凉亭','平台','草坪') GROUP BY 1 ORDER BY "停留人数" DESC`,
      layout: `WITH a AS (SELECT * FROM data WHERE ${where(weather, hour, "baseline")} AND record_type='facility'), b AS (SELECT * FROM data WHERE ${where(weather, hour, "current")} AND record_type='facility') SELECT COALESCE(b.name,a.name) AS "设施", COALESCE(a.occupied,0) AS "初始停留人数", COALESCE(b.occupied,0) AS "当前停留人数", COALESCE(b.occupied,0)-COALESCE(a.occupied,0) AS "人数变化", CASE WHEN a.facility_id IS NULL THEN '新增' WHEN b.facility_id IS NULL THEN '移除' WHEN a.x<>b.x OR a.y<>b.y THEN '移动' ELSE '原位' END AS "布置变化" FROM a FULL OUTER JOIN b USING(facility_id) WHERE COALESCE(b.kind,a.kind) NOT IN ('树木','路灯') ORDER BY ABS("人数变化") DESC,"设施"`,
      night: `SELECT name AS "设施", CASE WHEN light=1 THEN '路灯或建筑灯光覆盖' ELSE '照明未覆盖' END AS "夜间照明", occupied AS "停留人数", demand AS "想使用人数" FROM data WHERE ${valid} ORDER BY light DESC,occupied DESC`,
    } satisfies Record<QuestionId, string>
  )[id];
}
export function snapshotQuery(
  weather: Weather,
  hour: number,
  scenario: Scenario = "current",
) {
  return `SELECT * FROM data WHERE ${where(weather, hour, scenario)} AND record_type='facility' ORDER BY facility_id`;
}
export function summaryQuery(
  weather: Weather,
  hour: number,
  scenario: Scenario = "current",
) {
  return `SELECT * FROM data WHERE ${where(weather, hour, scenario)} AND record_type='park'`;
}
export function timelineQuery(
  weather: Weather,
  scenario: Scenario = "current",
) {
  return `SELECT hour,visits,occupied,walking,resting FROM data WHERE weather='${weather}' AND scenario='${scenario}' AND record_type='park' ORDER BY hour`;
}
export function comparisonQuery(weather: Weather, hour: number) {
  return `SELECT scenario,occupied,walking,resting,unserved,visits FROM data WHERE weather='${weather}' AND hour=${timeSlot(hour)} AND record_type='park' ORDER BY scenario`;
}
export function explanation(
  id: QuestionId,
  count: number,
  period: string,
  scenario: string,
) {
  const source = `读取「${scenario}」在 ${period} 的 ${count} 条设施模拟记录。`;
  return (
    {
      busy: [
        source,
        "按设施汇总到访人次，筛除树木和路灯。",
        "按到访人次从高到低排序；地图圈出前 3 处。",
      ],
      seats: [
        source,
        "只保留长椅和有座位的凉亭。",
        "空余座位 = 座位容量 − 当前停留人数。",
      ],
      shade: [
        source,
        "只比较座椅、凉亭、平台和草坪，按遮阴比例 50% 分组。",
        "计算两组停留人数、未能使用人数和设施平均停留时间。",
      ],
      layout: [
        "读取当前方案与初始方案在同一时段、同一天气的记录。",
        "按设施 ID 对齐，保留新增与移除的设施。",
        "人数变化 = 当前停留人数 − 初始停留人数。",
      ],
      night: [
        source,
        "按距路灯 165 地图单位内或有建筑灯光标记照明覆盖。",
        "查询各设施是否覆盖、当前停留人数；白天只展示夜间覆盖条件。",
      ],
    } satisfies Record<QuestionId, string[]>
  )[id];
}
export function narrative(id: QuestionId, rows: Record<string, any>[]) {
  if (!rows.length)
    return {
      title: "当前条件下没有符合要求的设施。",
      body: "可以添加长椅或凉亭，或换个时段再观察。",
    };
  const r = rows[0];
  if (id === "busy")
    return {
      title: `${r["设施"]}的到访人次最多`,
      body: `该半小时模拟到访 ${r["到访人次"]} 人次，其中当前停留 ${r["停留人数"]} 人。到访人次允许同一个人在多个设施重复计数。`,
    };
  if (id === "seats")
    return {
      title: `${r["设施"]}还有 ${r["空余座位"]} 个空位`,
      body: `遮阴比例约 ${r["遮阴%"]}%，夜间照明：${r["夜间照明"]}。只统计座椅和凉亭，按空位数排序。`,
    };
  if (id === "shade")
    return {
      title: `${r["设施分组"]}的一组共有 ${r["停留人数"]} 人停留`,
      body: `这组包含 ${r["设施数量"]} 处设施。数值来自本演示的规则模拟，遮阴已被写入选择规则，因此只能演示布局机制，不能当作实测因果证据。`,
    };
  if (id === "layout") {
    const changes = rows.filter(
      (r) => r["人数变化"] !== 0 || r["布置变化"] !== "原位",
    );
    return {
      title: changes.length
        ? `${changes.length} 处设施的布置或使用情况发生变化`
        : "当前布局与初始布局一致",
      body: changes.length
        ? `${r["设施"]}的停留人数从 ${r["初始停留人数"]} 变为 ${r["当前停留人数"]}。两方案使用相同的入园人数，差异来自位置、容量、遮阴和照明规则。`
        : "进入“布置设施”，移动长椅或添加树木、路灯，再查看同一时段的结果。",
    };
  }
  return {
    title: `${rows.filter((r) => r["夜间照明"] === "路灯或建筑灯光覆盖").length} 处设施在夜间有灯光覆盖`,
    body: "路灯 18:00 亮起、06:00 熄灭。夜间模型会降低未覆盖设施的吸引力；该规则用于演示，不是实际照度计算。",
  };
}
