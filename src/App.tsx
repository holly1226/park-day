import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  Flower2,
  Github,
  Info,
  Leaf,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  Send,
  Sprout,
  Sun,
  Thermometer,
  TreePine,
  Users,
  X,
} from "lucide-react";
import ParkMap from "./ParkMap";
import {
  clock,
  download,
  facilities,
  observations,
  slots,
  toCSV,
  type Layer,
  type Observation,
  type Weather,
} from "./data";
import {
  narrative,
  questions,
  queryFor,
  snapshotQuery,
  timelineQuery,
  type QuestionId,
} from "./queries";
import { runQuery } from "./engine";
type Row = Record<string, any>;
const layerLabels: Record<Layer, string> = {
  activity: "设施使用",
  flow: "人流分布",
  shade: "树荫分布",
};
const repo = "https://github.com/holly1226/park-day";
export default function App() {
  const [weather, setWeather] = useState<Weather>("mild");
  const [hour, setHour] = useState(14);
  const [layer, setLayer] = useState<Layer>("activity");
  const [selected, setSelected] = useState("b1");
  const [playing, setPlaying] = useState(false);
  const [rows, setRows] = useState<Observation[]>([]);
  const [timeline, setTimeline] = useState<Row[]>([]);
  const [question, setQuestion] = useState<QuestionId>("busy");
  const [result, setResult] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [sql, setSql] = useState("");
  const [evidence, setEvidence] = useState(false);
  const [about, setAbout] = useState(false);
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
  const reportRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setHour((h) => (h >= 21 ? 6 : h + 0.5)), 1700);
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    const id = ++sequence.current;
    aiSequence.current++;
    setAiResult(null);
    setAiError("");
    setAiBusy(false);
    setBusy(true);
    setError("");
    const q = queryFor(question, weather, hour);
    Promise.all([
      runQuery(snapshotQuery(weather, hour)),
      runQuery(timelineQuery(weather)),
      runQuery(q),
    ])
      .then(([snapshot, trend, answer]) => {
        if (sequence.current !== id) return;
        if (
          snapshot.length !== facilities.length ||
          trend.length !== slots.length
        )
          throw new Error("观测数据不完整，请重新加载引擎");
        setRows(snapshot as Observation[]);
        setTimeline(trend);
        setResult(answer);
        setSql(q);
        setBusy(false);
      })
      .catch((e) => {
        if (sequence.current === id) {
          setError(`分析引擎暂时未能完成查询：${e.message}`);
          setBusy(false);
          setPlaying(false);
        }
      });
  }, [weather, hour, question, retry]);
  useEffect(() => {
    if (!about) return;
    const previous = document.activeElement as HTMLElement | null;
    const close = document.getElementById("close-about");
    close?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setAbout(false);
      if (e.key === "Tab") {
        const dialog = document.getElementById("about-dialog");
        const all = dialog?.querySelectorAll<HTMLElement>("button, a[href]");
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
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [about]);
  const facility = facilities.find((f) => f.id === selected)!;
  const current = rows.find((r) => r.facility_id === selected);
  const resting = rows.filter((r) => r.kind === "座椅" || r.kind === "凉亭");
  const total = rows.reduce((s, r) => s + r.occupied, 0);
  const visits = rows.reduce((s, r) => s + r.visits, 0);
  const seats = resting.reduce((s, r) => s + r.capacity - r.occupied, 0);
  const mean = rows.length
    ? Math.round(
        rows.filter((r) => r.kind !== "饮水").reduce((s, r) => s + r.dwell, 0) /
          rows.filter((r) => r.kind !== "饮水").length,
      )
    : 0;
  const story = narrative(question, result, clock(hour));
  const ranking = [...rows]
    .filter((r) => r.kind !== "饮水")
    .sort((a, b) => b.occupied / b.capacity - a.occupied / a.capacity)
    .slice(0, 3);
  const highlight = result.slice(0, 3).map((r) => String(r["设施"] ?? ""));
  const pickQuestion = (q: QuestionId) => {
    setQuestion(q);
    setEvidence(false);
    setAiResult(null);
  };
  async function askAI(e: React.FormEvent) {
    e.preventDefault();
    if (!freeQuestion.trim() || aiBusy) return;
    const id = ++aiSequence.current;
    setAiBusy(true);
    setAiError("");
    setPlaying(false);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: freeQuestion.trim(), weather, hour }),
        signal: AbortSignal.timeout(90000),
      });
      if (!r.ok) {
        let message =
          "自由提问需要启动本地 AI 服务。下载项目后配置 .env，运行 npm run ai；在线版可直接使用上方五个真实 AVA 查询。";
        try {
          const body = await r.json();
          message = body.error || message;
        } catch {}
        throw new Error(message);
      }
      const body = await r.json();
      if (id === aiSequence.current) {
        setAiResult(body);
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
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#" aria-label="公园的一天首页">
            <span className="brand-tree">
              <TreePine size={24} />
            </span>
            <span>
              公园的一天<small>PARK, A LITTLE CLOSER.</small>
            </span>
          </a>
          <nav aria-label="主导航">
            <a className="active" href="#observe">
              公园观察
            </a>
            <a href="#insights">发现与提问</a>
          </nav>
          <div className="header-actions">
            <button className="text-button" onClick={() => setAbout(true)}>
              <Info size={15} />
              数据与说明
            </button>
            <a
              className="github-link"
              href={repo}
              target="_blank"
              rel="noreferrer"
              aria-label="查看 GitHub 项目"
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
              <span /> A LITTLE PARK OBSERVATORY
            </div>
            <h1>
              把公园，<span>看得更近一点。</span>
              <Flower2 className="title-flower" size={33} />
            </h1>
            <p>跟着一天的光影，发现人、树荫与小小设施之间的关系。</p>
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
              模拟夏日 · {weather === "mild" ? "24–29" : "31–38"}°C · 橡果公园
            </span>
          </div>
        </section>
        <section className="metrics" aria-label="当前公园指标">
          {[
            {
              label: "设施在场合计",
              value: total,
              unit: "人",
              note: "12 处设施的抽样快照",
              icon: <Users size={18} />,
            },
            {
              label: "半小时到访合计",
              value: visits,
              unit: "人次",
              note: "跨设施可重复计数",
              icon: <ArrowUpRight size={19} />,
            },
            {
              label: "还有位置坐",
              value: seats,
              unit: "席",
              note: "座椅与凉亭空余座位",
              icon: <TreePine size={19} />,
            },
            {
              label: "设施平均停留",
              value: mean,
              unit: "分钟",
              note: "各停留设施的简单平均",
              icon: <Sun size={19} />,
            },
          ].map((m, i) => (
            <div className="metric" key={m.label}>
              <div className={`metric-icon metric-icon-${i}`}>{m.icon}</div>
              <div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">
                  {rows.length ? m.value : "—"}
                  <span>{m.unit}</span>
                </div>
                <small>{m.note}</small>
              </div>
              {i === 0 && <span className="live-dot" title="模拟快照" />}
            </div>
          ))}
        </section>
        <section
          className="observatory"
          id="observe"
          aria-label="公园交互观察台"
        >
          <div className="map-panel">
            <div className="panel-toolbar">
              <div className="park-location">
                <MapPin size={16} />
                <strong>橡果公园</strong>
                <span>ACORN PARK</span>
              </div>
              <div className="layer-switch" role="group" aria-label="地图图层">
                {(["activity", "flow", "shade"] as Layer[]).map((l) => (
                  <button
                    key={l}
                    className={layer === l ? "chosen" : ""}
                    aria-pressed={layer === l}
                    onClick={() => setLayer(l)}
                  >
                    {layerLabels[l]}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`map-canvas ${busy && rows.length ? "updating" : ""}`}
            >
              <ParkMap
                rows={rows}
                hour={hour}
                layer={layer}
                selected={selected}
                onSelect={setSelected}
                highlight={highlight}
                playing={playing}
              />
              <div className="map-stamp">
                <span className="stamp-dot" />
                一座正在发生的公园<small>PIXEL FIELD NOTES / 001</small>
              </div>
              <div className="map-clock">
                <Sun size={16} />
                <strong>{clock(hour)}</strong>
                <span>
                  {current?.temperature ?? (weather === "hot" ? 37 : 28)}°C
                </span>
              </div>
              {busy && !rows.length && (
                <div className="map-loading">
                  <LoaderCircle className="spin" size={28} />
                  <strong>公园正在醒来</strong>
                  <span>正在加载本地 AVA 分析引擎…</span>
                </div>
              )}
              <div className="map-legend">
                {layer === "activity" ? (
                  <>
                    <i className="legend-green" />
                    轻松
                    <i className="legend-gold" />
                    热闹
                    <i className="legend-red" />
                    接近满员
                  </>
                ) : layer === "flow" ? (
                  <>
                    <i className="legend-gold" />
                    色块越深，到访人次越多
                  </>
                ) : (
                  <>
                    <i className="legend-green" />
                    深色为遮阴示意 · 标签为遮阴比例
                  </>
                )}
                <span>
                  点击设施探索 <ChevronRight size={12} />
                </span>
              </div>
            </div>
            <div className="timeline">
              <button
                className="play-button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "暂停时间播放" : "播放公园的一天"}
                disabled={!!error}
              >
                {playing ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
              </button>
              <div className="timeline-main">
                <div className="timeline-caption">
                  <strong>公园的一天</strong>
                  <span>拖动时间，看看哪里发生了变化</span>
                  <b>{clock(hour)}</b>
                </div>
                <div className="timeline-track">
                  <svg
                    viewBox="0 0 620 30"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {timeline.map((r, i) => (
                      <rect
                        key={i}
                        x={i * 20}
                        y={30 - Math.max(3, Number(r.occupied) * 0.15)}
                        width="12"
                        height={Math.max(3, Number(r.occupied) * 0.15)}
                        rx="1"
                        fill={Number(r.hour) <= hour ? "#78936c" : "#d6dcc7"}
                      />
                    ))}
                  </svg>
                  <input
                    type="range"
                    min="6"
                    max="21"
                    step="0.5"
                    value={hour}
                    onChange={(e) => {
                      setHour(Number(e.target.value));
                      setPlaying(false);
                    }}
                    aria-label="观察时间"
                    aria-valuetext={clock(hour)}
                  />
                </div>
                <div className="time-labels">
                  <span>06:00 清晨</span>
                  <span>09:00</span>
                  <span>12:00 午后</span>
                  <span>15:00</span>
                  <span>18:00 黄昏</span>
                  <span>21:00</span>
                </div>
              </div>
            </div>
          </div>
          <aside className="detail-panel">
            <div className="detail-heading">
              <span className="eyebrow">A MOMENT IN THE PARK</span>
              <span className="outline-chip">{clock(hour)} 快照</span>
            </div>
            <h2>
              此刻，公园里<span>。</span>
            </h2>
            <p className="detail-subtitle">每一处停留，都让空间有了表情。</p>
            <div className="selected-card">
              <div className="selected-card-top">
                <span className="facility-type">
                  <TreePine size={13} />
                  {facility.kind} · {facility.zone}
                </span>
                <span className="selected-marker">正在观察</span>
              </div>
              <h3>
                {facility.name}
                <span>↗</span>
              </h3>
              <p>{facility.description}</p>
              <div className="capacity-line">
                <strong>
                  {current?.occupied ?? "—"}
                  <small>
                    {" "}
                    / {facility.capacity}{" "}
                    {facility.kind === "座椅" || facility.kind === "凉亭"
                      ? "席"
                      : "人"}
                  </small>
                </strong>
                <span>
                  {current
                    ? Math.round((current.occupied / facility.capacity) * 100)
                    : "—"}
                  % 使用中
                </span>
              </div>
              <div className="occupancy-track">
                <span
                  style={{
                    width: `${current ? (current.occupied / facility.capacity) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="facility-facts">
                <div>
                  <Sun size={15} />
                  <span>遮阴比例</span>
                  <b>
                    {current ? Math.round(current.shade_ratio * 100) : "—"}%
                  </b>
                </div>
                <div>
                  <Leaf size={15} />
                  <span>平均停留</span>
                  <b>{current?.dwell ?? "—"} 分钟</b>
                </div>
              </div>
            </div>
            <div className="ranking-heading">
              <span>此刻人气角落</span>
              <small>按设施占用率</small>
            </div>
            <div className="ranking">
              {ranking.map((r, i) => (
                <button
                  key={r.facility_id}
                  onClick={() => setSelected(r.facility_id)}
                  className={selected === r.facility_id ? "picked" : ""}
                >
                  <span className="rank-number">0{i + 1}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <span className="mini-track">
                      <i
                        style={{ width: `${(r.occupied / r.capacity) * 100}%` }}
                      />
                    </span>
                  </div>
                  <b>
                    {Math.round((r.occupied / r.capacity) * 100)}
                    <small>%</small>
                  </b>
                  <ChevronRight size={13} />
                </button>
              ))}
            </div>
            <div className="observation-tip">
              <Sprout size={20} />
              <p>
                试试切换到高温天气，
                <br />
                看看人们的停留发生了什么变化。
              </p>
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
              {busy ? "AVA 正在读取和计算…" : "AVA 4.0 已完成真实查询"}
              <span className="engine-separator">/</span>
              {observations.length} 条模拟观测
              <span className="engine-separator">/</span>计算在浏览器本地执行
            </span>
          )}
          <button onClick={() => setAbout(true)}>
            <Info size={13} /> 数据口径
          </button>
        </div>
        <section className="insights-section" id="insights" ref={reportRef}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
              <h2>
                问问这座公园<span>。</span>
              </h2>
              <p>从一个小问题出发，让数据带你多看一层。</p>
            </div>
            <span className="ava-badge">
              <Database size={14} /> Powered by AVA 4.0
            </span>
          </div>
          <div className="insight-grid">
            <div className="question-list" aria-label="预设分析问题">
              {questions.map((q) => (
                <button
                  key={q.id}
                  className={question === q.id ? "chosen" : ""}
                  onClick={() => pickQuestion(q.id)}
                  aria-pressed={question === q.id}
                >
                  <span className="question-number">{q.icon}</span>
                  <span>
                    <strong>{q.label}</strong>
                    <small>{q.short}</small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              ))}
            </div>
            <div className="answer-card" aria-busy={busy}>
              <div className="answer-top">
                <span>
                  <span className="status-dot" />
                  {aiResult ? "模型自由分析" : "AVA · 预设问题 / 真实 SQL"}
                </span>
                <small>
                  {clock(hour)} · {weather === "mild" ? "普通天气" : "高温天气"}
                </small>
              </div>
              <h3>{aiResult ? "从你的问题，再看一层公园。" : story.title}</h3>
              <p className="answer-body">{aiResult?.summary ?? story.body}</p>
              {!aiResult && result.length > 0 && (
                <div className="result-bars" aria-label="分析结果图表">
                  {result.slice(0, 5).map((r, i) => {
                    const label = String(r["设施"] ?? r["遮阴分组"] ?? "");
                    const value = Number(
                      r["占用率%"] ??
                        r["平均停留分钟"] ??
                        r["空余座位"] ??
                        r["人数变化"] ??
                        r["到访人次"] ??
                        0,
                    );
                    const all = result
                      .slice(0, 5)
                      .map((r) =>
                        Math.abs(
                          Number(
                            r["占用率%"] ??
                              r["平均停留分钟"] ??
                              r["空余座位"] ??
                              r["人数变化"] ??
                              r["到访人次"] ??
                              0,
                          ),
                        ),
                      );
                    const max = Math.max(...all, 1);
                    return (
                      <div className="result-bar" key={label}>
                        <span>{label}</span>
                        <div>
                          <i
                            style={{
                              width: `${Math.max((Math.abs(value) / max) * 100, 2)}%`,
                              background: i === 0 ? "#78956c" : "#c2cdb1",
                            }}
                          />
                        </div>
                        <b>
                          {value}
                          {question === "busy"
                            ? "%"
                            : question === "shade"
                              ? "分"
                              : question === "seats"
                                ? "席"
                                : question === "weather"
                                  ? "人"
                                  : "人次"}
                        </b>
                      </div>
                    );
                  })}
                  <div className="chart-caption">
                    {question === "busy"
                      ? "设施占用率"
                      : question === "shade"
                        ? "设施平均停留时间"
                        : question === "seats"
                          ? "空余座位"
                          : question === "weather"
                            ? "高温场景 − 普通场景在场人数"
                            : "按周转参考值排序，图示到访人次"}{" "}
                    · 来自 AVA 查询结果
                  </div>
                </div>
              )}
              <div className="answer-actions">
                <button
                  onClick={() => setEvidence((v) => !v)}
                  aria-expanded={evidence}
                >
                  <Code2 size={15} />
                  {evidence ? "收起计算依据" : "查看 SQL 与数据"}
                  <ChevronDown size={13} />
                </button>
                <button
                  onClick={() =>
                    download(
                      "park-analysis.csv",
                      toCSV(aiResult?.data ?? result),
                    )
                  }
                  disabled={!result.length && !aiResult}
                >
                  <ArrowDownToLine size={15} />
                  导出结果
                </button>
              </div>
              {busy && (
                <div className="answer-loading">
                  <LoaderCircle className="spin" size={20} />
                  <span>正在通过 AVA 更新分析</span>
                </div>
              )}
            </div>
          </div>
          {evidence && (
            <div className="evidence-panel">
              <div className="evidence-title">
                <Database size={16} />
                <strong>计算依据</strong>
                <span>
                  {(aiResult?.data ?? result).length} 行结果 · 数据集 data
                </span>
              </div>
              <pre>
                <code>{aiResult?.sql ?? sql}</code>
              </pre>
              <div className="table-scroll">
                {(aiResult?.data ?? result).length ? (
                  <table>
                    <thead>
                      <tr>
                        {Object.keys((aiResult?.data ?? result)[0]).map((k) => (
                          <th key={k}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(aiResult?.data ?? result).slice(0, 100).map((r, i) => (
                        <tr key={i}>
                          {Object.values(r).map((v, j) => (
                            <td key={j}>{String(v ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>查询成功，没有符合条件的数据。</p>
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
              placeholder="还有好奇的？输入你的问题（自由提问需配置本地模型）"
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
        <section className="field-note">
          <div className="field-note-art">
            <TreePine size={40} />
            <Leaf size={20} />
          </div>
          <div>
            <span className="eyebrow">A NOTE FROM THE FIELD</span>
            <h3>好的空间，藏在每一个被看见的日常里。</h3>
            <p>
              这是一个探索公共空间的交互原型。数据为确定性生成的模拟观测，树荫与人物为示意，期待下一次走进真实的公园。
            </p>
          </div>
          <button
            onClick={() =>
              download("acorn-park-observations.csv", toCSV(observations))
            }
          >
            <ArrowDownToLine size={16} />
            下载示例数据
          </button>
        </section>
      </main>
      <footer>
        <a className="footer-brand" href="#">
          <TreePine size={17} />
          公园的一天
        </a>
        <span>Made for curious people & a little greener world.</span>
        <div>
          <span className="demo-label">模拟数据 · 非实时监测</span>
          <a href={repo} target="_blank" rel="noreferrer">
            开源项目 <ArrowUpRight size={12} />
          </a>
        </div>
      </footer>
      {about && (
        <div className="modal-backdrop" onClick={() => setAbout(false)}>
          <section
            className="about-modal"
            id="about-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              id="close-about"
              onClick={() => setAbout(false)}
              aria-label="关闭数据说明"
            >
              <X size={20} />
            </button>
            <div className="eyebrow">BEHIND THE LITTLE PARK</div>
            <h2 id="about-title">
              一座模拟公园，
              <br />
              一次真实的数据探索。
            </h2>
            <p>
              橡果公园为原创虚构场地。{observations.length} 条观测覆盖 12
              处设施、31
              个半小时时段与两种天气。所有数字由确定性规则生成，用来展示分析与交互能力。
            </p>
            <h3>数据怎么读？</h3>
            <ul>
              <li>
                <strong>在场人数：</strong>
                设施在某时刻的模拟快照，合计不是公园独立访客数。
              </li>
              <li>
                <strong>到访人次：</strong>
                半小时内到访该设施的人次，允许跨设施重复。
              </li>
              <li>
                <strong>平均停留：</strong>
                设施级模拟平均值，整体展示为非饮水设施的简单平均。
              </li>
              <li>
                <strong>空余座位：</strong>
                仅统计座椅与凉亭；其他设施容量表示可容纳人数。
              </li>
              <li>
                <strong>树荫与人物：</strong>
                示意图层；人物按数量缩放绘制，不代表真实轨迹或逐人定位。
              </li>
            </ul>
            <h3>AVA 真正做了什么？</h3>
            <p>
              AVA 4.0.4 接入社区 DuckDB-Wasm 引擎，在浏览器执行
              source、schema、semantic 和
              query。地图快照、时间曲线、指标和五个分析问题均读取真实查询结果。预设问题使用固定
              SQL，文字结论由结果模板生成。
            </p>
            <p>
              自由提问需在本地 .env 配置模型，运行 npm run ai，通过 AVA analyze
              处理；密钥只保留在本地服务。地图和图表为本项目代码绘制。
            </p>
            <button
              className="primary-button"
              onClick={() =>
                download("acorn-park-observations.csv", toCSV(observations))
              }
            >
              <ArrowDownToLine size={16} />
              下载完整模拟数据
            </button>
            <a
              className="modal-source"
              href="https://github.com/antvis/AVA"
              target="_blank"
              rel="noreferrer"
            >
              了解 AVA <ArrowUpRight size={14} />
            </a>
          </section>
        </div>
      )}
    </>
  );
}
