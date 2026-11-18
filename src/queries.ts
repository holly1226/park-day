import type { Weather } from "./data";
export type QuestionId = "busy" | "shade" | "passing" | "seats" | "weather";
export const questions: {
  id: QuestionId;
  label: string;
  short: string;
  icon: string;
}[] = [
  {
    id: "busy",
    label: "此刻，哪里最热闹？",
    short: "寻找人气角落",
    icon: "01",
  },
  {
    id: "shade",
    label: "树荫下，大家待得更久吗？",
    short: "看看树荫的吸引力",
    icon: "02",
  },
  {
    id: "passing",
    label: "哪些地方路过多、停留少？",
    short: "发现空间的另一面",
    icon: "03",
  },
  {
    id: "seats",
    label: "现在，哪里还有位置坐？",
    short: "找一处歇歇脚",
    icon: "04",
  },
  {
    id: "weather",
    label: "热起来后，公园有什么变化？",
    short: "比较两种天气",
    icon: "05",
  },
];
export const where = (weather: Weather, hour: number) =>
  `weather = '${weather}' AND hour = ${hour}`;
export function queryFor(id: QuestionId, weather: Weather, hour: number) {
  const filter = where(weather, hour);
  const queries: Record<QuestionId, string> = {
    busy: `SELECT name AS "设施", zone AS "区域", occupied AS "在场人数", capacity AS "容量", ROUND(100.0 * occupied / capacity, 1) AS "占用率%", visits AS "到访人次" FROM data WHERE ${filter} ORDER BY "占用率%" DESC, occupied DESC`,
    shade: `SELECT CASE WHEN shade_ratio >= 0.6 THEN '遮阴充足' ELSE '遮阴较少' END AS "遮阴分组", COUNT(*) AS "设施数", ROUND(AVG(dwell),1) AS "平均停留分钟", SUM(occupied) AS "在场人数", SUM(capacity) AS "总容量", ROUND(100.0*SUM(occupied)/SUM(capacity),1) AS "容量加权占用率%" FROM data WHERE ${filter} AND kind IN ('座椅','凉亭','平台','草坪') GROUP BY 1 ORDER BY "平均停留分钟" DESC`,
    passing: `SELECT name AS "设施", visits AS "到访人次", occupied AS "在场人数", dwell AS "平均停留分钟", ROUND(visits*1.0/GREATEST(dwell,1),1) AS "周转参考值" FROM data WHERE ${filter} AND kind <> '饮水' ORDER BY "周转参考值" DESC LIMIT 6`,
    seats: `SELECT name AS "设施", capacity-occupied AS "空余座位", ROUND(shade_ratio*100) AS "遮阴%", occupied AS "已占座位", capacity AS "座位总数" FROM data WHERE ${filter} AND kind IN ('座椅','凉亭') AND capacity > occupied ORDER BY "遮阴%" DESC, "空余座位" DESC`,
    weather: `SELECT name AS "设施", MAX(CASE WHEN weather='mild' THEN occupied END) AS "普通天气在场", MAX(CASE WHEN weather='hot' THEN occupied END) AS "高温天气在场", MAX(CASE WHEN weather='hot' THEN occupied END)-MAX(CASE WHEN weather='mild' THEN occupied END) AS "人数变化" FROM data WHERE hour=${hour} GROUP BY name ORDER BY "人数变化" DESC`,
  };
  return queries[id];
}
export function snapshotQuery(weather: Weather, hour: number) {
  return `SELECT * FROM data WHERE ${where(weather, hour)} ORDER BY facility_id`;
}
export function timelineQuery(weather: Weather) {
  return `SELECT hour, SUM(visits) AS visits, SUM(occupied) AS occupied FROM data WHERE weather='${weather}' GROUP BY hour ORDER BY hour`;
}
export function narrative(
  id: QuestionId,
  rows: Record<string, unknown>[],
  hourLabel: string,
) {
  if (!rows.length)
    return {
      title: "这一刻，没有符合条件的记录。",
      body: "试试其他时段，或切换天气重新看看。",
    };
  const r = rows[0];
  if (id === "busy")
    return {
      title: `${r["设施"]}，是此刻的人气角落。`,
      body: `${hourLabel} 的模拟快照中，占用率为 ${r["占用率%"]}%，${r["在场人数"]} 人正在使用。占用率按设施容量计算，不等于整个区域的人群密度。`,
    };
  if (id === "shade")
    return {
      title: `${r["遮阴分组"]}的停留设施，平均停留 ${r["平均停留分钟"]} 分钟。`,
      body: "仅比较座椅、凉亭、平台与草坪，使用设施平均停留时间的简单平均。设施类型等因素也会影响结果，不能据此推断遮阴的因果效应。",
    };
  if (id === "passing")
    return {
      title: `${r["设施"]}，是一个值得再观察的经过点。`,
      body: `半小时内记录 ${r["到访人次"]} 到访人次，平均停留 ${r["平均停留分钟"]} 分钟。按“到访人次 ÷ 平均停留时间”排序，仅作发现线索，需结合现场观察。`,
    };
  if (id === "seats")
    return {
      title: `去${r["设施"]}歇一会儿吧。`,
      body: `模拟快照显示 ${r["空余座位"]} 个空余座位，遮阴比例约 ${r["遮阴%"]}%。优先按遮阴比例推荐，仅包括座椅和有座位的凉亭。`,
    };
  return {
    title: `${r["设施"]}的在场人数变化最明显。`,
    body: `${hourLabel} 的两组模拟场景中，普通天气 ${r["普通天气在场"]} 人，高温天气 ${r["高温天气在场"]} 人。两组数据用于交互演示，不是实测天气影响或预测。`,
  };
}
