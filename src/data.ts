export type Weather = "mild" | "hot";
export type Layer = "activity" | "flow" | "shade";
export type Facility = {
  id: string;
  name: string;
  zone: string;
  kind: string;
  capacity: number;
  x: number;
  y: number;
  shade: number;
  description: string;
};
const originalFacilities: Facility[] = [
  {
    id: "b1",
    name: "香樟树下",
    zone: "林荫步道",
    kind: "座椅",
    capacity: 8,
    x: 210,
    y: 235,
    shade: 0.91,
    description: "树荫围起来的小角落，适合放空和读几页书。",
  },
  {
    id: "b2",
    name: "湖畔长椅",
    zone: "湖畔",
    kind: "座椅",
    capacity: 10,
    x: 540,
    y: 300,
    shade: 0.25,
    description: "看得见水面与小鸭子，午后会有一点晒。",
  },
  {
    id: "b3",
    name: "花园长椅",
    zone: "花园",
    kind: "座椅",
    capacity: 6,
    x: 750,
    y: 400,
    shade: 0.43,
    description: "花园转角的短暂停靠点，傍晚很舒服。",
  },
  {
    id: "b4",
    name: "入口休息椅",
    zone: "南入口",
    kind: "座椅",
    capacity: 8,
    x: 330,
    y: 500,
    shade: 0.18,
    description: "离入口最近，适合等朋友和整理随身物品。",
  },
  {
    id: "p1",
    name: "树荫小亭",
    zone: "林荫步道",
    kind: "凉亭",
    capacity: 16,
    x: 295,
    y: 140,
    shade: 0.98,
    description: "有屋顶也有树荫，是午后慢下来的地方。",
  },
  {
    id: "p2",
    name: "水岸木平台",
    zone: "湖畔",
    kind: "平台",
    capacity: 18,
    x: 650,
    y: 195,
    shade: 0.16,
    description: "视野开阔的亲水平台，清晨和日落时很热闹。",
  },
  {
    id: "g1",
    name: "小小探险场",
    zone: "活动区",
    kind: "游乐",
    capacity: 20,
    x: 165,
    y: 385,
    shade: 0.39,
    description: "滑梯、沙地和小小的冒险，承载着放学后的热闹。",
  },
  {
    id: "g2",
    name: "林下健身角",
    zone: "活动区",
    kind: "健身",
    capacity: 12,
    x: 100,
    y: 265,
    shade: 0.79,
    description: "晨练时最先醒来的角落，器材之间留着呼吸的空间。",
  },
  {
    id: "l1",
    name: "野餐大草坪",
    zone: "草坪",
    kind: "草坪",
    capacity: 40,
    x: 455,
    y: 420,
    shade: 0.19,
    description: "铺一块垫子就能待很久，树荫随时间缓缓移动。",
  },
  {
    id: "c1",
    name: "橡果咖啡屋",
    zone: "花园",
    kind: "咖啡",
    capacity: 12,
    x: 810,
    y: 245,
    shade: 0.86,
    description: "一扇朝向公园的窗，装得下一杯咖啡的时间。",
  },
  {
    id: "w1",
    name: "林间饮水点",
    zone: "林荫步道",
    kind: "饮水",
    capacity: 3,
    x: 360,
    y: 270,
    shade: 0.82,
    description: "散步中途补充水分的小站点。",
  },
  {
    id: "w2",
    name: "花园饮水点",
    zone: "花园",
    kind: "饮水",
    capacity: 3,
    x: 720,
    y: 500,
    shade: 0.22,
    description: "靠近花园和出口，经过时记得喝口水。",
  },
];
export const facilities: Facility[] = [
  ...originalFacilities,
  ...[
    { id: "lamp1", x: 320, y: 360 },
    { id: "lamp2", x: 595, y: 330 },
    { id: "lamp3", x: 800, y: 460 },
    { id: "lamp4", x: 365, y: 510 },
  ].map((p, i) => ({
    ...p,
    name: `步道路灯 ${i + 1}`,
    zone: "步道",
    kind: "路灯",
    capacity: 0,
    shade: 0,
    description: "18:00 至次日 06:00 自动亮灯，影响附近模拟夜间停留。",
  })),
];
export const slots = Array.from({ length: 48 }, (_, i) => i / 2);
export const kinds = [
  "座椅",
  "凉亭",
  "饮水",
  "路灯",
  "树木",
  "游乐",
  "健身",
  "平台",
  "草坪",
  "咖啡",
];
export const palette = [
  { kind: "座椅", label: "长椅", capacity: 6 },
  { kind: "凉亭", label: "凉亭", capacity: 12 },
  { kind: "饮水", label: "饮水点", capacity: 3 },
  { kind: "路灯", label: "路灯", capacity: 0 },
  { kind: "树木", label: "树木", capacity: 0 },
];
export const backgroundTrees = [
  { x: 186, y: 218, s: 1.1 },
  { x: 123, y: 160, s: 1.15 },
  { x: 264, y: 96, s: 0.9 },
  { x: 390, y: 268, s: 1 },
  { x: 697, y: 86, s: 0.8 },
  { x: 865, y: 125, s: 1.1 },
  { x: 854, y: 370, s: 1, pine: true },
  { x: 650, y: 393, s: 0.8 },
  { x: 590, y: 468, s: 1.15 },
  { x: 264, y: 433, s: 1 },
  { x: 81, y: 462, s: 0.9 },
  { x: 83, y: 82, s: 0.8, pine: true },
  { x: 880, y: 77, s: 1, pine: true },
  { x: 704, y: 277, s: 0.8 },
];
export type Scenario = "baseline" | "current";
export type Visitor = {
  id: number;
  state: "walking" | "resting";
  target: string | null;
  x: number;
  y: number;
  seed: number;
};
export type Observation = {
  scenario: Scenario;
  record_type: "facility" | "park";
  weather: Weather;
  hour: number;
  facility_id: string;
  name: string;
  zone: string;
  kind: string;
  capacity: number;
  shade_ratio: number;
  visits: number;
  occupied: number;
  dwell: number;
  temperature: number;
  demand: number;
  unserved: number;
  light: number;
  walking: number;
  resting: number;
  x: number;
  y: number;
};
export function clock(hour: number) {
  const m = ((Math.round(hour * 60) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export function timeSlot(hour: number) {
  return Math.floor(hour * 2) / 2;
}
export function computerHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60;
}
export function solarState(hour: number) {
  const daylight = Math.max(0, Math.sin(((hour - 6) * Math.PI) / 12));
  const night = hour < 6 || hour >= 18;
  const dusk = (hour >= 17 && hour < 19) || (hour >= 5 && hour < 7);
  return {
    daylight,
    night,
    phase: night
      ? dusk
        ? "暮色"
        : "夜晚"
      : hour < 8
        ? "清晨"
        : hour >= 16
          ? "傍晚"
          : "白天",
    darkness: night ? 0.6 : Math.max(0, 0.13 - daylight * 0.13),
    warmth: dusk ? 0.21 : 0,
    shadowX: Math.cos(((hour - 6) * Math.PI) / 12) * -90,
    shadowY: 14 + Math.abs(Math.cos(((hour - 6) * Math.PI) / 12)) * 30,
  };
}
export function treesFor(layout: Facility[]) {
  return [
    ...backgroundTrees,
    ...layout
      .filter((f) => f.kind === "树木")
      .map((f) => ({ x: f.x, y: f.y, s: 1.2 })),
  ];
}
export function shadeAt(
  f: Facility,
  hour: number,
  layout: Facility[] = facilities,
) {
  if (f.kind === "凉亭" || f.kind === "咖啡") return 0.95;
  const sun = solarState(hour);
  const canopy = treesFor(layout).reduce(
    (max, t) =>
      Math.max(
        max,
        Math.max(
          0,
          1 -
            Math.hypot(
              f.x - (t.x + sun.shadowX * 0.5),
              f.y - (t.y + sun.shadowY * 0.5),
            ) /
              75,
        ),
      ),
    0,
  );
  return Number(Math.min(0.98, 0.06 + canopy * 0.92).toFixed(3));
}
function hash(n: number) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
export function zoneAt(x: number, y: number) {
  return y > 475
    ? "南入口"
    : x < 355
      ? "林荫步道"
      : x > 680
        ? "花园"
        : y < 330
          ? "湖畔"
          : "草坪";
}
export function placementIssue(
  layout: Facility[],
  x: number,
  y: number,
  ignoreId?: string,
  kind = "座椅",
) {
  if (x < 45 || x > 915 || y < 80 || y > 535) return "请放在公园围栏内。";
  const pond = ((x - 533) / 155) ** 2 + ((y - 147) / 87) ** 2;
  if (pond < (kind === "平台" ? 0.78 : 1.13)) return "这里是湖面，请选择陆地。";
  if (
    (Math.abs(x - 329) < 19 && y < 490) ||
    Math.abs(y - 325) < 17 ||
    (Math.abs(y - 510) < 12 && x > 305 && x < 850) ||
    (Math.abs(x - 803) < 12 && y > 290)
  )
    return "请给步道留出通行空间。";
  if (
    layout.some((f) => f.id !== ignoreId && Math.hypot(f.x - x, f.y - y) < 29)
  )
    return "这里离其他设施太近，请稍微移开。";
  return "";
}
export function validateLayout(input: unknown): Facility[] {
  if (!Array.isArray(input) || input.length > 32)
    throw new Error("方案最多包含 32 处设施。");
  const ids = new Set<string>();
  return input.map((f) => {
    if (
      !f ||
      typeof f.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,50}$/.test(f.id) ||
      ids.has(f.id) ||
      typeof f.name !== "string" ||
      f.name.length > 40 ||
      !kinds.includes(f.kind) ||
      !Number.isFinite(f.x) ||
      !Number.isFinite(f.y) ||
      f.x < 45 ||
      f.x > 915 ||
      f.y < 80 ||
      f.y > 535 ||
      !Number.isInteger(f.capacity) ||
      f.capacity < 0 ||
      f.capacity > 80 ||
      (!["路灯", "树木"].includes(f.kind) && f.capacity < 1)
    )
      throw new Error("方案包含无效的设施字段。");
    ids.add(f.id);
    return {
      id: f.id,
      name: f.name,
      kind: f.kind,
      capacity: ["路灯", "树木"].includes(f.kind) ? 0 : f.capacity,
      x: f.x,
      y: f.y,
      zone: zoneAt(f.x, f.y),
      shade: 0,
      description:
        typeof f.description === "string"
          ? f.description.slice(0, 180)
          : "你布置的设施。",
    };
  });
}
export function layoutKey(layout: Facility[]) {
  return JSON.stringify(
    layout.map(({ id, x, y, kind, capacity }) => [id, x, y, kind, capacity]),
  );
}
export function simulate(
  layout: Facility[],
  weather: Weather,
  hour: number,
  scenario: Scenario = "current",
) {
  hour = timeSlot(hour);
  const sun = solarState(hour);
  const heat = Math.exp(-Math.pow((hour - 14) / 3.4, 2));
  const peak =
    0.04 +
    0.6 * Math.exp(-Math.pow((hour - 8.5) / 2.2, 2)) +
    0.86 * Math.exp(-Math.pow((hour - 17.5) / 2.8, 2)) +
    0.29 * Math.exp(-Math.pow((hour - 13) / 3, 2));
  // Admission is independent of layout: comparisons use the same population.
  const population = Math.round(
    145 * peak * (weather === "hot" ? 1 - 0.35 * heat : 1),
  );
  const temp = Number(
    (weather === "hot" ? 27 + 11 * heat : 20 + 9 * heat).toFixed(1),
  );
  const active = layout.filter((f) => !["路灯", "树木"].includes(f.kind));
  const seats = new Map(active.map((f) => [f.id, 0]));
  const demand = new Map(active.map((f) => [f.id, 0]));
  const lights = new Map(
    layout.map((f) => [
      f.id,
      layout.some(
        (l) => l.kind === "路灯" && Math.hypot(l.x - f.x, l.y - f.y) < 165,
      ) || f.kind === "咖啡"
        ? 1
        : 0,
    ]),
  );
  const weights = active.map((f) => {
    const access =
      0.4 +
      0.6 *
        Math.exp(
          -Math.min(
            Math.abs(f.x - 330),
            Math.abs(f.y - 325),
            Math.abs(f.y - 510),
            Math.abs(f.x - 803),
          ) / 110,
        );
    const comfort =
      weather === "hot" ? 0.35 + shadeAt(f, hour, layout) * 1.7 : 1;
    const rhythm =
      f.kind === "健身"
        ? hour < 10
          ? 1.6
          : 0.7
        : f.kind === "游乐"
          ? hour >= 15 && hour < 20
            ? 1.6
            : 0.6
          : 1;
    return (
      Math.sqrt(f.capacity) *
      access *
      comfort *
      rhythm *
      (sun.night ? (lights.get(f.id) ? 1.2 : 0.18) : 1)
    );
  });
  const weightTotal = weights.reduce((a, b) => a + b, 0);
  const visitors: Visitor[] = [];
  let unmet = 0;
  for (let i = 0; i < population; i++) {
    let target: Facility | undefined;
    let choice = hash(i + hour * 47) * weightTotal;
    for (let j = 0; j < active.length; j++) {
      choice -= weights[j];
      if (choice <= 0) {
        target = active[j];
        break;
      }
    }
    const wantsToStop = hash(i * 3.7 + hour) < 0.72;
    if (wantsToStop && target)
      demand.set(target.id, demand.get(target.id)! + 1);
    const rest = !!(
      wantsToStop &&
      target &&
      seats.get(target.id)! < target.capacity
    );
    if (wantsToStop && !rest) unmet++;
    if (rest && target) {
      const n = seats.get(target.id)!;
      seats.set(target.id, n + 1);
      visitors.push({
        id: i,
        state: "resting",
        target: target.id,
        x: target.x - 27 + (n % 6) * 10,
        y: target.y - 7 + Math.floor(n / 6) * 10,
        seed: hash(i * 8.3),
      });
    } else
      visitors.push({
        id: i,
        state: "walking",
        target: target?.id ?? null,
        x: 330,
        y: 325,
        seed: hash(i * 8.3),
      });
  }
  const walking = visitors.filter((v) => v.state === "walking").length;
  const base = { scenario, weather, hour, temperature: temp };
  const records: Observation[] = layout.map((f) => {
    const occupied = seats.get(f.id) ?? 0;
    const want = demand.get(f.id) ?? 0;
    const shade = shadeAt(f, hour, layout);
    return {
      ...base,
      record_type: "facility",
      facility_id: f.id,
      name: f.name,
      zone: zoneAt(f.x, f.y),
      kind: f.kind,
      capacity: f.capacity,
      shade_ratio: shade,
      visits: ["路灯", "树木"].includes(f.kind)
        ? 0
        : Math.round(occupied * (f.kind === "饮水" ? 3 : 1.4) + want * 0.5),
      occupied,
      dwell: occupied
        ? Math.round(
            (f.kind === "饮水" ? 2 : f.kind === "草坪" ? 30 : 18) *
              (weather === "hot" ? 0.5 + shade : 0.9) *
              (sun.night && lights.get(f.id) === 0 ? 0.55 : 1),
          )
        : 0,
      demand: want,
      unserved: Math.max(0, want - occupied),
      light: lights.get(f.id) ?? 0,
      walking: 0,
      resting: occupied,
      x: f.x,
      y: f.y,
    };
  });
  const mean = records.filter((r) => r.occupied > 0 && r.kind !== "饮水");
  records.push({
    ...base,
    record_type: "park",
    facility_id: "__park",
    name: "全园",
    zone: "全园",
    kind: "全园",
    capacity: active.reduce((s, f) => s + f.capacity, 0),
    shade_ratio: 0,
    visits: Math.round(population * 0.65),
    occupied: population,
    dwell: mean.length
      ? Math.round(mean.reduce((s, r) => s + r.dwell, 0) / mean.length)
      : 0,
    demand: population - walking + unmet,
    unserved: unmet,
    light: layout.filter((f) => f.kind === "路灯").length,
    walking,
    resting: population - walking,
    x: 0,
    y: 0,
  });
  return { records, visitors };
}
export function buildObservations(
  layout: Facility[] = facilities,
): Observation[] {
  return (["baseline", "current"] as Scenario[]).flatMap((scenario) =>
    (["mild", "hot"] as Weather[]).flatMap((weather) =>
      slots.flatMap(
        (hour) =>
          simulate(
            scenario === "baseline" ? facilities : layout,
            weather,
            hour,
            scenario,
          ).records,
      ),
    ),
  );
}
export const observations = buildObservations();
export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return (
    "\uFEFF" +
    [
      keys.join(","),
      ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
    ].join("\n")
  );
}
export function download(
  name: string,
  content: string,
  type = "text/csv;charset=utf-8",
) {
  const u = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
