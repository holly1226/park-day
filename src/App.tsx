import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Database,
  Github,
  Info,
  Leaf,
  Lightbulb,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Moon,
  MousePointer2,
  Move,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sun,
  Thermometer,
  TreePine,
  Undo2,
  Users,
  X,
} from "lucide-react";
import ParkMap from "./ParkMap";
import ClickSpark from "./components/ClickSpark";
import {
  buildObservations,
  clock,
  computerHour,
  download,
  facilities,
  layoutKey,
  palette,
  placementIssue,
  simulate,
  slots,
  solarState,
  timeSlot,
  toCSV,
  validateLayout,
  zoneAt,
  type Facility,
  type Layer,
  type Observation,
  type Scenario,
  type Weather,
} from "./data";
import {
  comparisonQuery,
  explanation,
  narrative,
  questions,
  queryFor,
  snapshotQuery,
  summaryQuery,
  timelineQuery,
  type QuestionId,
} from "./queries";
import { queryDataset } from "./engine";
gsap.registerPlugin(useGSAP);
type Row = Record<string, any>;
const repo = "https://github.com/holly1226/park-day";
const storageKey = "park-day-layout-v2";
function initialLayout() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? validateLayout(JSON.parse(saved)) : [...facilities];
  } catch {
    return [...facilities];
  }
}
const glyph = (kind: string, size = 16) =>
  kind === "树木" ? (
    <TreePine size={size} />
  ) : kind === "路灯" ? (
    <Lightbulb size={size} />
  ) : kind === "饮水" ? (
    <span className="water-glyph">◉</span>
  ) : kind === "凉亭" ? (
    <span>⌂</span>
  ) : (
    <span>▤</span>
  );
export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Facility[]>(initialLayout);
  const [history, setHistory] = useState<Facility[][]>([]);
  const [scenario, setScenario] = useState<Scenario>("current");
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather>("mild");
  const [hour, setHour] = useState(() => computerHour());
  const [live, setLive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [motion, setMotion] = useState(true);
  const [layer, setLayer] = useState<Layer>("activity");
  const [selected, setSelected] = useState("b1");
  const [rows, setRows] = useState<Observation[]>([]);
  const [summary, setSummary] = useState<Row | null>(null);
  const [timeline, setTimeline] = useState<Row[]>([]);
  const [comparisons, setComparisons] = useState<Row[]>([]);
  const [question, setQuestion] = useState<QuestionId>("busy");
  const [result, setResult] = useState<Row[]>([]);
  const [sql, setSql] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [evidence, setEvidence] = useState(false);
  const [about, setAbout] = useState(false);
  const [notice, setNotice] = useState("");
  const [freeQuestion, setFreeQuestion] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<{
    summary: string;
    sql: string;
    data: Row[];
  } | null>(null);
  const sequence = useRef(0);
  const aiSequence = useRef(0);
  const upload = useRef<HTMLInputElement>(null);
  const dataset = useMemo(() => buildObservations(layout), [layout]);
  const datasetKey = useMemo(() => layoutKey(layout), [layout]);
  const displayedLayout = scenario === "baseline" ? facilities : layout;
  const slot = timeSlot(hour);
  const sun = solarState(hour);
  const visitors = useMemo(
    () => simulate(displayedLayout, weather, slot, scenario).visitors,
    [displayedLayout, weather, slot, scenario],
  );
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".intro", {
          autoAlpha: 0,
          y: 10,
          duration: 0.5,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setHour(computerHour()), 10000);
    return () => clearInterval(id);
  }, [live]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () => setHour((h) => (timeSlot(h) + 0.5) % 24),
      1900,
    );
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch {
      setNotice("浏览器未允许保存；当前方案仍可使用，也可下载。");
    }
  }, [layout]);
  useEffect(() => {
    if (selected && !displayedLayout.some((f) => f.id === selected))
      setSelected(displayedLayout[0]?.id ?? "");
  }, [displayedLayout, selected]);
  useEffect(() => {
    const id = ++sequence.current;
    aiSequence.current++;
    setAiResult(null);
    setAiError("");
    setAiBusy(false);
    setBusy(true);
    setError("");
    const q = queryFor(question, weather, slot, scenario);
    queryDataset(dataset, datasetKey, [
      snapshotQuery(weather, slot, scenario),
      summaryQuery(weather, slot, scenario),
      timelineQuery(weather, scenario),
      q,
      comparisonQuery(weather, slot),
    ])
      .then(([snapshot, overview, trend, answer, compare]) => {
        if (id !== sequence.current) return;
        if (
          snapshot.length !== displayedLayout.length ||
          overview.length !== 1 ||
          trend.length !== slots.length
        )
          throw new Error("观测记录不完整，请重试。");
        setRows(snapshot as Observation[]);
        setSummary(overview[0]);
        setTimeline(trend);
        setResult(answer);
        setSql(q);
        setComparisons(compare);
        setBusy(false);
      })
      .catch((e) => {
        if (id === sequence.current) {
          setError(`分析引擎暂时未能完成查询：${e.message}`);
          setSummary(null);
          setRows([]);
          setResult([]);
          setTimeline([]);
          setComparisons([]);
          setBusy(false);
          setPlaying(false);
        }
      });
  }, [weather, slot, question, scenario, datasetKey, retry]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (!about) return;
    const previous = document.activeElement as HTMLElement | null;
    document.getElementById("close-about")?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setAbout(false);
      if (e.key === "Tab") {
        const all = document
          .getElementById("about-dialog")
          ?.querySelectorAll<HTMLElement>("button,a[href]");
        if (!all?.length) return;
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [about]);
  function commit(next: Facility[]) {
    setHistory((h) => [...h.slice(-14), layout]);
    setLayout(next);
    setScenario("current");
    setPlaying(false);
  }
  function startEditing() {
    setEditing(true);
    setScenario("current");
    setPlaying(false);
  }
  function moveFacility(id: string, x: number, y: number) {
    const f = layout.find((f) => f.id === id);
    if (!f) return;
    const problem = placementIssue(layout, x, y, id, f.kind);
    if (problem) {
      setNotice(problem);
      return;
    }
    commit(
      layout.map((f) =>
        f.id === id
          ? {
              ...f,
              x,
              y,
              zone: zoneAt(x, y),
              description: "已移动的设施。使用情况按当前位置重新模拟。",
            }
          : f,
      ),
    );
    setNotice("设施位置已更新，正在重新模拟并由 AVA 计算。");
  }
  function placeFacility(x: number, y: number) {
    if (!placing) return;
    if (layout.length >= 32) {
      setNotice("最多放置 32 处设施，可先移除一处。");
      return;
    }
    const problem = placementIssue(layout, x, y, undefined, placing);
    if (problem) {
      setNotice(problem);
      return;
    }
    const spec = palette.find((p) => p.kind === placing)!;
    const id = `custom-${crypto.randomUUID()}`;
    commit([
      ...layout,
      {
        id,
        name: `新${spec.label} ${layout.filter((f) => f.kind === placing).length + 1}`,
        kind: placing,
        capacity: spec.capacity,
        x,
        y,
        zone: zoneAt(x, y),
        shade: 0,
        description: "你添加的设施。拖动可重新布置，参数会影响规则模拟。",
      },
    ]);
    setSelected(id);
    setPlacing(null);
    setNotice(`${spec.label}已添加，正在重新计算当前方案。`);
  }
  function undo() {
    const last = history.at(-1);
    if (!last) return;
    setLayout(last);
    setHistory((h) => h.slice(0, -1));
    setScenario("current");
    setNotice("已撤销上一次布置。");
  }
  function manualTime(value: number) {
    setHour(value);
    setLive(false);
    setPlaying(false);
  }
  const f = displayedLayout.find((f) => f.id === selected);
  const current = rows.find((r) => r.facility_id === selected);
  const restingFacilities = rows.filter((r) =>
    ["座椅", "凉亭"].includes(r.kind),
  );
  const seats = restingFacilities.reduce(
    (s, r) => s + r.capacity - r.occupied,
    0,
  );
  const baseline = comparisons.find((r) => r.scenario === "baseline");
  const custom = comparisons.find((r) => r.scenario === "current");
  const story = error
    ? {
        title: "当前方案的分析暂时不可用",
        body: "请点击重新加载。设施布局已保留，查询恢复后会显示对应结果。",
      }
    : narrative(question, result);
  const period = `${clock(slot)}–${clock(slot + 0.5)}`;
  const highlight = result.slice(0, 3).map((r) => String(r["设施"] ?? ""));
  const shownResult = aiResult?.data ?? result;
  const answerLabel =
    question === "layout"
      ? "两种布局"
      : scenario === "current"
        ? "当前方案"
        : "初始方案";
  async function askAI(e: React.FormEvent) {
    e.preventDefault();
    if (!freeQuestion.trim() || aiBusy) return;
    const id = ++aiSequence.current;
    setAiBusy(true);
    setAiError("");
    setPlaying(false);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: freeQuestion.trim(),
          weather,
          hour: slot,
          layout,
          scenario,
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (!response.ok) {
        let message =
          "自由提问需运行本地模型服务；上方五个分析可直接使用。配置方法见 GitHub README。";
        try {
          message = (await response.json()).error || message;
        } catch {}
        throw new Error(message);
      }
      const value = await response.json();
      if (id === aiSequence.current) {
        setAiResult(value);
        setEvidence(true);
      }
    } catch (e) {
      if (id === aiSequence.current)
        setAiError(e instanceof Error ? e.message : "分析失败，请重试。");
    } finally {
      if (id === aiSequence.current) setAiBusy(false);
    }
  }
  return (
    <div ref={root}>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#">
            <span className="brand-tree">
              <TreePine size={24} />
            </span>
            <span>
              公园的一天<small>PARK LAYOUT LAB</small>
            </span>
          </a>
          <nav aria-label="主导航">
            <button
              className={!editing ? "active" : ""}
              onClick={() => {
                setEditing(false);
                setPlacing(null);
              }}
            >
              观察公园
            </button>
            <button className={editing ? "active" : ""} onClick={startEditing}>
              布置设施
            </button>
            <a href="#insights">AVA 分析</a>
          </nav>
          <div className="header-actions">
            <button className="text-button" onClick={() => setAbout(true)}>
              <Info size={16} />
              模拟规则
            </button>
            <a
              className="github-link"
              href={repo}
              target="_blank"
              rel="noreferrer"
            >
              <Github size={18} />
              <span>GitHub</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span /> PARK SIMULATOR · AVA 4.0
            </div>
            <h1>公园人流与设施模拟器</h1>
            <p>
              自己布置长椅、树木和路灯，看看人往哪走、在哪停留，再用 AVA
              比较方案。
            </p>
          </div>
          <div className="intro-right">
            <div className="weather-switch" aria-label="天气场景">
              <button
                className={weather === "mild" ? "chosen" : ""}
                onClick={() => setWeather("mild")}
                aria-pressed={weather === "mild"}
              >
                <Sun size={16} />
                普通天气
              </button>
              <button
                className={weather === "hot" ? "chosen" : ""}
                onClick={() => setWeather("hot")}
                aria-pressed={weather === "hot"}
              >
                <Thermometer size={16} />
                高温天气
              </button>
            </div>
            <span className="scenario-note">
              <span className="small-square" />
              规则模拟 · 非实测预测 · 1 个小人 = 1 位访客
            </span>
          </div>
        </section>
        <section className="metrics" aria-label="当前模拟指标">
          {[
            {
              label: "当前在园",
              value: summary?.occupied,
              unit: "人",
              note: `行走 ${summary?.walking ?? "—"} · 停留 ${summary?.resting ?? "—"}`,
              icon: <Users size={18} />,
            },
            {
              label: "半小时入园人流量",
              value: summary?.visits,
              unit: "人次",
              note: `观测时段 ${period}`,
              icon: <ArrowUpRight size={19} />,
            },
            {
              label: "座椅与凉亭空位",
              value: summary ? seats : undefined,
              unit: "席",
              note: "容量减去当前停留人数",
              icon: <TreePine size={19} />,
            },
            {
              label: "想停留但未能使用",
              value: summary?.unserved,
              unit: "人",
              note: "模拟需求超出设施容量",
              icon: <MousePointer2 size={18} />,
            },
          ].map((m, i) => (
            <div className="metric" key={m.label}>
              <div className={`metric-icon metric-icon-${i}`}>{m.icon}</div>
              <div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">
                  {m.value ?? "—"}
                  <span>{m.unit}</span>
                </div>
                <small>{m.note}</small>
              </div>
            </div>
          ))}
        </section>
        <section className="observatory" id="observe">
          <div className="map-panel">
            <div className="panel-toolbar">
              <div className="park-location">
                <MapPin size={16} />
                <strong>橡果公园</strong>
                <span>{displayedLayout.length} 处设施</span>
              </div>
              <div className="layer-switch" role="group" aria-label="地图图层">
                {(["activity", "flow", "shade"] as Layer[]).map((l) => (
                  <button
                    key={l}
                    className={layer === l ? "chosen" : ""}
                    aria-pressed={layer === l}
                    onClick={() => setLayer(l)}
                  >
                    {l === "activity"
                      ? "设施使用"
                      : l === "flow"
                        ? "人流热区"
                        : "树荫分布"}
                  </button>
                ))}
              </div>
            </div>
            <div className="layout-toolbar">
              <div className="scenario-tabs">
                <button
                  className={scenario === "current" ? "chosen" : ""}
                  onClick={() => setScenario("current")}
                >
                  我的方案
                </button>
                <button
                  className={scenario === "baseline" ? "chosen" : ""}
                  onClick={() => {
                    setScenario("baseline");
                    setEditing(false);
                    setPlacing(null);
                  }}
                >
                  初始布局
                </button>
              </div>
              <span className="layout-save">
                <Check size={12} />
                自动保存到本机
              </span>
              <button
                className={editing ? "edit-toggle chosen" : "edit-toggle"}
                onClick={() =>
                  editing
                    ? (setEditing(false), setPlacing(null))
                    : startEditing()
                }
              >
                <Move size={13} />
                {editing ? "完成布置" : "布置设施"}
              </button>
            </div>
            <div
              className={`map-canvas ${editing ? "editing-map" : ""} ${busy && summary ? "updating" : ""}`}
            >
              <ParkMap
                rows={rows}
                hour={hour}
                layer={layer}
                selected={selected}
                onSelect={(id) => {
                  setSelected(id);
                  setPlacing(null);
                }}
                highlight={highlight}
                playing={playing}
                layout={displayedLayout}
                visitors={visitors}
                editing={editing}
                placing={placing}
                motion={motion}
                onMove={moveFacility}
                onPlace={placeFacility}
              />
              <div className="map-stamp">
                <span className="stamp-dot" />
                {editing
                  ? placing
                    ? `点击地图放置${placing}`
                    : "拖动设施，调整布局"
                  : `${sun.phase} · ${summary?.walking ?? "—"} 人行走中`}
                <small>
                  {editing
                    ? "支持拖动 / 选中后按方向键微调"
                    : "一人一个小人 · 沿步道行走"}
                </small>
              </div>
              <div className="map-clock">
                {sun.night ? <Moon size={16} /> : <Sun size={16} />}
                <strong>{clock(hour)}</strong>
                <span>
                  {sun.phase} · {summary?.temperature ?? "—"}°C
                </span>
              </div>
              {busy && !summary && (
                <div className="map-loading">
                  <LoaderCircle className="spin" size={28} />
                  <strong>正在打开公园模拟器</strong>
                  <span>加载本地 AVA 分析引擎…</span>
                </div>
              )}
              <div className="map-legend">
                <i className="legend-green" />
                {layer === "activity"
                  ? "标签：停留人数 / 容量"
                  : layer === "flow"
                    ? "色块与标签：半小时到访人次"
                    : "阴影方向和长度随时间变化"}
                <span>
                  {sun.night ? "18:00–06:00 路灯开启" : "白天树影示意"} ·
                  手机可左右滑动
                </span>
              </div>
            </div>
            <div className="time-controls">
              <button
                className="play-button"
                onClick={() => {
                  setLive(false);
                  setPlaying((p) => !p);
                }}
                aria-label={playing ? "暂停时间播放" : "播放公园的一天"}
              >
                {playing ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
              </button>
              <label className="time-input-label">
                选择时间
                <input
                  type="time"
                  value={clock(hour)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [h, m] = e.target.value.split(":").map(Number);
                      manualTime(h + m / 60);
                    }
                  }}
                  aria-label="选择具体时间"
                />
              </label>
              <button
                className={live ? "live-clock selected" : "live-clock"}
                onClick={() => {
                  setLive(true);
                  setHour(computerHour());
                  setPlaying(false);
                }}
              >
                <span className="status-dot" />
                {live ? "跟随电脑时间" : "回到电脑时间"}
              </button>
              <button
                className="motion-toggle"
                onClick={() => setMotion((m) => !m)}
              >
                {motion ? <Pause size={13} /> : <Play size={13} />}小人动画
              </button>
            </div>
            <div className="timeline new-timeline">
              <div className="timeline-main">
                <div className="timeline-track">
                  <svg
                    viewBox="0 0 960 32"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {timeline.map((r, i) => (
                      <rect
                        key={i}
                        x={i * 20}
                        y={32 - Math.max(1, r.occupied * 0.21)}
                        width="12"
                        height={Math.max(1, r.occupied * 0.21)}
                        fill={Number(r.hour) <= hour ? "#78936c" : "#d6dcc7"}
                      />
                    ))}
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="23.5"
                    step=".5"
                    value={slot}
                    onChange={(e) => manualTime(Number(e.target.value))}
                    aria-label="观察时间"
                    aria-valuetext={clock(slot)}
                  />
                </div>
                <div className="time-labels">
                  <span>00:00 夜间</span>
                  <span>06:00 日出</span>
                  <span>12:00 正午</span>
                  <span>18:00 亮灯</span>
                  <span>23:30</span>
                </div>
              </div>
            </div>
          </div>
          <aside className="detail-panel new-detail">
            <div className="detail-heading">
              <span className="eyebrow">
                {editing ? "LAYOUT EDITOR" : "LIVE SIMULATION"}
              </span>
              <span className="outline-chip">
                {clock(hour)} · {sun.phase}
              </span>
            </div>
            <h2>{editing ? "布置你的公园" : "选中设施详情"}</h2>
            <p className="detail-subtitle">
              {editing
                ? "选择工具后点地图添加；已有设施可直接拖动。"
                : "点地图上的设施，查看这半小时的使用情况。"}
            </p>
            {editing && (
              <>
                <ClickSpark
                  style={{ height: "auto" }}
                  sparkColor={["#91ae6b", "#d5ae6b"]}
                  sparkSize={6}
                  sparkRadius={20}
                  sparkCount={6}
                  duration={350}
                  shape="dot"
                >
                  <div className="palette-grid">
                    {palette.map((p) => (
                      <button
                        key={p.kind}
                        aria-label={`添加${p.label}`}
                        className={placing === p.kind ? "chosen" : ""}
                        onClick={() =>
                          setPlacing(placing === p.kind ? null : p.kind)
                        }
                        aria-pressed={placing === p.kind}
                      >
                        {glyph(p.kind, 19)}
                        <span>添加{p.label}</span>
                      </button>
                    ))}
                    <button
                      className={!placing ? "chosen" : ""}
                      onClick={() => setPlacing(null)}
                    >
                      <Move size={19} />
                      <span>移动设施</span>
                    </button>
                  </div>
                </ClickSpark>
                <div className="editor-actions">
                  <button onClick={undo} disabled={!history.length}>
                    <Undo2 size={13} />
                    撤销
                  </button>
                  <button
                    onClick={() => {
                      commit([...facilities]);
                      setPlacing(null);
                      setNotice("已恢复初始布局，可用撤销返回。");
                    }}
                  >
                    <RotateCcw size={13} />
                    重置布局
                  </button>
                </div>
              </>
            )}
            {f ? (
              <div className="selected-card">
                <div className="selected-card-top">
                  <span className="facility-type">
                    {glyph(f.kind, 13)}
                    {f.kind} · {f.zone}
                  </span>
                  <span className="selected-marker">
                    {editing ? "可拖动" : "选中"}
                  </span>
                </div>
                <h3>
                  {f.name}
                  <span>↗</span>
                </h3>
                {["路灯", "树木"].includes(f.kind) ? (
                  <>
                    <p>
                      {f.kind === "路灯"
                        ? sun.night
                          ? "路灯已亮起。165 地图单位内的设施获得模拟照明覆盖。"
                          : "白天熄灯，18:00 自动开启，影响夜间停留选择。"
                        : "树冠的投影随时间移动，影响附近设施的遮阴与高温吸引力。"}
                    </p>
                    <strong className="infrastructure-status">
                      {f.kind === "路灯"
                        ? sun.night
                          ? "● 灯光已开启"
                          : "○ 等待夜晚"
                        : "● 为附近空间提供树荫"}
                    </strong>
                  </>
                ) : (
                  <>
                    <div className="capacity-line">
                      <strong>
                        {current?.occupied ?? "—"}
                        <small> / {f.capacity} 人</small>
                      </strong>
                      <span>当前停留</span>
                    </div>
                    <div className="occupancy-track">
                      <span
                        style={{
                          width: `${current ? (current.occupied / f.capacity) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="facility-facts">
                      <div>
                        <Sun size={14} />
                        <span>{sun.night ? "夜间照明" : "遮阴比例"}</span>
                        <b>
                          {sun.night
                            ? current?.light
                              ? "有灯"
                              : "未覆盖"
                            : `${Math.round((current?.shade_ratio ?? 0) * 100)}%`}
                        </b>
                      </div>
                      <div>
                        <Users size={14} />
                        <span>到访人次</span>
                        <b>{current?.visits ?? "—"}</b>
                      </div>
                    </div>
                    <p className="facility-demand">
                      想使用 {current?.demand ?? "—"} 人 · 未能使用{" "}
                      {current?.unserved ?? "—"} 人
                    </p>
                  </>
                )}
                {editing && !["路灯", "树木"].includes(f.kind) && (
                  <label className="capacity-edit">
                    设施容量
                    <input
                      type="number"
                      min="1"
                      max="80"
                      value={f.capacity}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && n >= 1 && n <= 80)
                          commit(
                            layout.map((item) =>
                              item.id === f.id
                                ? { ...item, capacity: n }
                                : item,
                            ),
                          );
                      }}
                      aria-label="设施容量"
                    />
                    人
                  </label>
                )}
                {editing && (
                  <button
                    className="remove-facility"
                    onClick={() => {
                      commit(layout.filter((item) => item.id !== f.id));
                      setPlacing(null);
                      setNotice("设施已移除，可用撤销恢复。");
                    }}
                  >
                    <X size={13} />
                    移除这处{f.kind}
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-facility">
                <TreePine size={26} />
                <p>还没有设施，选一个工具开始布置。</p>
              </div>
            )}
            <div className="layout-comparison">
              <div className="ranking-heading">
                <span>与初始布局比较</span>
                <small>相同人数 · 同一时段</small>
              </div>
              <div>
                <span>停留人数</span>
                <strong>
                  {baseline?.resting ?? "—"} <ArrowUpRight size={12} />{" "}
                  {custom?.resting ?? "—"}
                </strong>
              </div>
              <div>
                <span>未能使用</span>
                <strong>
                  {baseline?.unserved ?? "—"} <ArrowUpRight size={12} />{" "}
                  {custom?.unserved ?? "—"}
                </strong>
              </div>
              <button
                onClick={() => {
                  setQuestion("layout");
                  document
                    .getElementById("insights")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                查看 AVA 方案分析 <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="layout-file-actions">
              <button
                onClick={() =>
                  download(
                    "my-park-layout.json",
                    JSON.stringify(layout, null, 2),
                    "application/json",
                  )
                }
              >
                <Save size={13} />
                下载方案
              </button>
              <button onClick={() => upload.current?.click()}>
                <Plus size={13} />
                导入方案
              </button>
              <input
                ref={upload}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 64000)
                      throw new Error("文件过大，请导入本工具导出的方案。");
                    const next = validateLayout(JSON.parse(await file.text()));
                    commit(next);
                    setEditing(true);
                    setNotice("方案已导入，正在重新模拟。");
                  } catch (error) {
                    setNotice(
                      error instanceof Error ? error.message : "无法导入方案。",
                    );
                  }
                  e.target.value = "";
                }}
              />
            </div>
          </aside>
        </section>
        <div className="engine-line" role="status">
          <span
            className={
              error
                ? "status-dot failed"
                : busy
                  ? "status-dot pending"
                  : "status-dot"
            }
          />
          {error ? (
            <>
              <span>{error}</span>
              <button onClick={() => setRetry((n) => n + 1)}>重新加载</button>
            </>
          ) : (
            <span>
              {busy ? "AVA 正在计算当前方案…" : "AVA 已完成当前方案查询"}
              <span className="engine-separator">/</span>
              {dataset.length} 条模拟记录 · {period}
              <span className="engine-separator">/</span>
              当前方案与初始布局均已载入
            </span>
          )}
          <button onClick={() => setAbout(true)}>
            <Info size={13} />
            模拟规则
          </button>
        </div>
        {notice && (
          <div className="notice" role="alert">
            <Info size={16} />
            {notice}
            <button onClick={() => setNotice("")} aria-label="关闭提示">
              <X size={15} />
            </button>
          </div>
        )}
        <section className="insights-section" id="insights">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FROM SIMULATION TO ANALYSIS</div>
              <h2>AVA 具体分析了什么？</h2>
              <p>
                模拟器生成访客和使用记录；AVA
                读取这些记录，执行下面的筛选、计算与方案比较。
              </p>
            </div>
            <span className="ava-badge">
              <Database size={14} />
              真实查询 · 本地计算
            </span>
          </div>
          <div className="analysis-context">
            <span>
              <strong>分析方案</strong>
              {answerLabel}
            </span>
            <span>
              <strong>天气</strong>
              {weather === "mild" ? "普通天气" : "高温天气"}
            </span>
            <span>
              <strong>数据时段</strong>
              {period}
            </span>
            <span>
              <strong>设施记录</strong>
              {displayedLayout.length} 条 / 时段
            </span>
          </div>
          <div className="insight-grid">
            <div className="question-list">
              {questions.map((q) => (
                <button
                  key={q.id}
                  className={question === q.id ? "chosen" : ""}
                  onClick={() => {
                    setQuestion(q.id);
                    setAiResult(null);
                    setEvidence(false);
                  }}
                  aria-pressed={question === q.id}
                >
                  <span className="question-number">{q.icon}</span>
                  <span>
                    <strong>{q.label}</strong>
                    <small>{q.short}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
            <div className="answer-card" aria-busy={busy}>
              <div className="answer-top">
                <span>
                  <span className="status-dot" />
                  {aiResult ? "AVA · 模型自由分析" : "AVA · 当前模拟数据分析"}
                </span>
                <small>
                  {answerLabel} · {period}
                </small>
              </div>
              <h3>{aiResult ? "针对你的问题，分析结果如下" : story.title}</h3>
              <p className="answer-body">{aiResult?.summary ?? story.body}</p>
              {!aiResult && (
                <ol className="query-steps">
                  {explanation(
                    question,
                    displayedLayout.length,
                    period,
                    answerLabel,
                  ).map((step, i) => (
                    <li key={step}>
                      <span>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {!aiResult && result.length > 0 && (
                <div className="result-bars">
                  {result.slice(0, 5).map((r, i) => {
                    const key =
                      question === "busy"
                        ? "到访人次"
                        : question === "seats"
                          ? "空余座位"
                          : question === "shade"
                            ? "停留人数"
                            : question === "layout"
                              ? "人数变化"
                              : "停留人数";
                    const value = Number(r[key] ?? 0);
                    const max = Math.max(
                      1,
                      ...result
                        .slice(0, 5)
                        .map((r) => Math.abs(Number(r[key] ?? 0))),
                    );
                    return (
                      <div className="result-bar" key={i}>
                        <span>{r["设施"] ?? r["设施分组"]}</span>
                        <div>
                          <i
                            style={{
                              width: `${Math.max(2, (Math.abs(value) / max) * 100)}%`,
                              background:
                                value < 0
                                  ? "#bc806b"
                                  : i === 0
                                    ? "#78956c"
                                    : "#c2cdb1",
                            }}
                          />
                        </div>
                        <b>
                          {value}
                          {question === "seats"
                            ? "席"
                            : question === "busy"
                              ? "人次"
                              : "人"}
                        </b>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="answer-actions">
                <button
                  onClick={() => setEvidence((e) => !e)}
                  aria-expanded={evidence}
                >
                  <Code2 size={15} />
                  {evidence ? "收起 SQL 与结果表" : "查看 SQL 与结果表"}
                  <ChevronDown size={13} />
                </button>
                <button
                  onClick={() =>
                    download("park-analysis.csv", toCSV(shownResult))
                  }
                  disabled={!shownResult.length}
                >
                  <ArrowDownToLine size={15} />
                  导出结果
                </button>
              </div>
              {busy && (
                <div className="answer-loading">
                  <LoaderCircle className="spin" size={19} />
                  <span>AVA 正在重新计算</span>
                </div>
              )}
            </div>
          </div>
          {evidence && (
            <div className="evidence-panel">
              <div className="evidence-title">
                <Database size={16} />
                <strong>真实执行的 SQL 与返回结果</strong>
                <span>{shownResult.length} 行结果</span>
              </div>
              <pre>
                <code>{aiResult?.sql ?? sql}</code>
              </pre>
              <div className="table-scroll">
                {shownResult.length ? (
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(shownResult[0]).map((k) => (
                          <th key={k}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shownResult.slice(0, 100).map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((v, j) => (
                            <td key={j}>{String(v ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>查询成功，当前条件下没有结果。</p>
                )}
              </div>
            </div>
          )}
          <form className="ask-form" onSubmit={askAI}>
            <MessageCircle size={18} />
            <input
              value={freeQuestion}
              maxLength={1000}
              onChange={(e) => setFreeQuestion(e.target.value)}
              placeholder="自由提问（需配置本地模型）；以上五个分析无需密钥"
              aria-label="自由提问"
            />
            <button type="submit" disabled={aiBusy || !freeQuestion.trim()}>
              {aiBusy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Send size={15} />
              )}
              <span>{aiBusy ? "分析中" : "提问"}</span>
            </button>
          </form>
          {aiError && (
            <div className="ai-error" role="alert">
              <Info size={16} />
              {aiError}
            </div>
          )}
        </section>
      </main>
      <footer>
        <a className="footer-brand" href="#">
          <TreePine size={17} />
          公园的一天 · 布局实验室
        </a>
        <span>原创像素场景 · GSAP 动画 · React Bits 交互 · AVA 数据分析</span>
        <div>
          <button
            onClick={() => download("park-simulation.csv", toCSV(dataset))}
          >
            <ArrowDownToLine size={12} />
            下载模拟记录
          </button>
          <span className="demo-label">规则模拟 · 非实测预测</span>
        </div>
      </footer>
      {about && (
        <div className="modal-backdrop" onClick={() => setAbout(false)}>
          <section
            id="about-dialog"
            className="about-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="close-about"
              className="modal-close"
              onClick={() => setAbout(false)}
              aria-label="关闭模拟规则"
            >
              <X size={20} />
            </button>
            <div className="eyebrow">HOW THE PARK WORKS</div>
            <h2 id="about-title">
              你布置设施，模拟器生成人流，
              <br />
              AVA 计算使用与方案差异。
            </h2>
            <h3>1. 时间与场景</h3>
            <p>
              默认读取电脑的本地时间。可手动选择
              00:00–23:59，分析使用所在半小时的快照。日出、日落和阴影为固定的示意周期，未接入真实地理日照或天气。
            </p>
            <h3>2. 人流与设施使用</h3>
            <p>
              每个小人是一位模拟访客。在园人数按时段和天气生成；其中一部分沿步道行走，另一部分按设施容量、步道可达性、遮阴与照明选择停留。满员后计入“未能使用”。同一天气同时段的两个布局使用相同访客人数。
            </p>
            <h3>3. 树木与路灯</h3>
            <p>
              树冠投影的位置和方向随时间变化。路灯 18:00 至次日 06:00 亮起，165
              地图单位范围内标记照明覆盖；咖啡屋有建筑灯光。夜间模型降低无灯设施的吸引力。这里只演示规则，不计算真实照度。
            </p>
            <h3>4. AVA 的计算</h3>
            <p>
              AVA 4.0
              载入初始与当前方案的模拟记录，真实执行筛选、汇总、排序和方案关联查询。地图快照、入园曲线、总览指标、对比数字和分析表读取查询结果。行为模拟与地图由本项目代码实现，AVA
              不负责预测真实行人。
            </p>
            <p>
              入园人次来自全园模拟记录；设施到访允许重复。遮阴分组的平均停留只对有使用者的停留设施取简单平均。模拟规则已经包含遮阴与灯光偏好，因此结果不能作为实证结论。
            </p>
            <button
              className="primary-button"
              onClick={() => download("park-simulation.csv", toCSV(dataset))}
            >
              <ArrowDownToLine size={15} />
              下载完整记录
            </button>
            <a
              className="modal-source"
              href="https://github.com/antvis/AVA"
              target="_blank"
              rel="noreferrer"
            >
              AVA 项目 <ArrowUpRight size={13} />
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
