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
export const facilities: Facility[] = [
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
export const slots = Array.from({ length: 31 }, (_, i) => 6 + i / 2);
export function clock(hour: number) {
  return `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`;
}
export function shadeAt(f: Facility, hour: number) {
  return Math.max(
    0.04,
    Math.min(
      1,
      f.shade +
        0.12 * Math.cos(((hour - 8) * Math.PI) / 12) +
        (hour >= 17 ? 0.13 : 0),
    ),
  );
}
export type Observation = {
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
};
export const observations: Observation[] = (
  ["mild", "hot"] as Weather[]
).flatMap((weather) =>
  slots.flatMap((hour) =>
    facilities.map((f, i) => {
      const wave =
        0.28 +
        0.48 * Math.exp(-Math.pow((hour - 9) / 2.3, 2)) +
        0.66 * Math.exp(-Math.pow((hour - 17.5) / 2.7, 2));
      const heat = Math.exp(-Math.pow((hour - 14) / 3.4, 2));
      const shade = shadeAt(f, hour);
      const rhythm =
        f.kind === "健身"
          ? hour < 10
            ? 1.45
            : 0.65
          : f.kind === "游乐"
            ? hour >= 15
              ? 1.35
              : 0.6
            : f.kind === "咖啡"
              ? hour >= 11 && hour <= 17
                ? 1.3
                : 0.55
              : 1;
      const hotFactor =
        weather === "hot" ? 1 - heat * 0.72 + heat * shade * 0.94 : 1;
      const wobble = 0.86 + 0.18 * Math.sin(hour * 1.7 + i * 2.1);
      const ratio = Math.min(
        0.97,
        Math.max(
          0.04,
          wave *
            rhythm *
            hotFactor *
            wobble *
            (f.kind === "饮水" ? 0.55 : 0.81),
        ),
      );
      const occupied = Math.min(f.capacity, Math.round(f.capacity * ratio));
      const through =
        f.id === "b4"
          ? 3.5
          : f.kind === "饮水"
            ? 4.5
            : f.kind === "草坪"
              ? 1.1
              : 1.7;
      const visits = Math.max(
        occupied,
        Math.round(
          (occupied * through + 4 + 4 * Math.sin(hour + i) ** 2) *
            (weather === "hot" && f.kind === "饮水" ? 1.8 : 1),
        ),
      );
      const dwell = Math.round(
        (f.kind === "饮水"
          ? 2
          : f.kind === "草坪"
            ? 34
            : f.kind === "咖啡"
              ? 27
              : 17) *
          (weather === "hot" ? 0.55 + shade * 0.65 : 1) *
          (0.8 + ratio * 0.4),
      );
      return {
        weather,
        hour,
        facility_id: f.id,
        name: f.name,
        zone: f.zone,
        kind: f.kind,
        capacity: f.capacity,
        shade_ratio: Number(shade.toFixed(3)),
        visits,
        occupied,
        dwell,
        temperature: Number(
          (weather === "hot" ? 31 + 7 * heat : 24 + 5 * heat).toFixed(1),
        ),
      };
    }),
  ),
);
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
