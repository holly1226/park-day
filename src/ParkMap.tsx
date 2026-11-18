import {
  facilities,
  type Facility,
  type Layer,
  type Observation,
} from "./data";
type Props = {
  rows: Observation[];
  hour: number;
  layer: Layer;
  selected: string;
  onSelect: (id: string) => void;
  highlight: string[];
  playing: boolean;
};
function Tree({
  x,
  y,
  s = 1,
  pine = false,
}: {
  x: number;
  y: number;
  s?: number;
  pine?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-19 8h43v9h-43z" fill="#3e754c" opacity=".18" />
      <path d="M-3-7h7v24h-7z" fill="#7d6746" />
      {pine ? (
        <>
          <path
            d="M-5-53H5v10h9v11h8v12h9v13h-60v-13h9v-12h9v-11h6z"
            fill="#366a4c"
          />
          <path d="M-4-49h8v12h8v11h-8v12H-7v-12h-9v-9h12z" fill="#5d8c57" />
        </>
      ) : (
        <>
          <path
            d="M-15-46h26v6h13v12h7v22H19v9H-9v-6h-17v-12h-6v-15h10v-10h7z"
            fill="#3b744d"
          />
          <path d="M-13-43h24v8h12v16H6v8H-17v-7h-10v-14h14z" fill="#609456" />
          <path d="M-11-40H8v8H-2v8h-17v-9h8z" fill="#83af66" />
        </>
      )}
    </g>
  );
}
function Bench() {
  return (
    <>
      <path d="M-17-8h34v6h-34zm0 9h34v6h-34z" fill="#b57e4d" />
      <path d="M-19-10h38v4h-38z" fill="#d6ab6c" />
      <path d="M-12-2h4v15h-4zm21 0h4v15H9z" fill="#5e6552" />
    </>
  );
}
function FacilityIcon({ f }: { f: Facility }) {
  if (f.kind === "座椅") return <Bench />;
  if (f.kind === "凉亭")
    return (
      <>
        <path d="M-23-2h46v30h-46z" fill="#d4bc8b" />
        <path d="M-22-7h5v33h-5zm39 0h5v33h-5z" fill="#8b7050" />
        <path
          d="M-7-38H7v7h10v8h10v8h8v10h-70v-10h8v-8h10v-8h10z"
          fill="#546c52"
        />
        <path d="M-7-34H7v8h10v8h10v6H-25v-6h10v-8h8z" fill="#78916a" />
        <path d="M-13 11h26v5h-26z" fill="#a67e50" />
      </>
    );
  if (f.kind === "咖啡")
    return (
      <>
        <path d="M-27-8h54v41h-54z" fill="#f0dcb4" />
        <path d="M-30-27h60v7h8v16h-76v-16h8z" fill="#b7654d" />
        <path d="M-25-23h50v7h-50z" fill="#d88b61" />
        <path d="M-18 2h13v14h-13zm26 0h13v14H8z" fill="#638b83" />
        <path d="M-5 14h12v19H-5z" fill="#79654b" />
        <path d="M-17-12h34v4h-34z" fill="#f4dfae" />
      </>
    );
  if (f.kind === "游乐")
    return (
      <>
        <path d="M-33-22h5v47h-5zm38 0h5v47H5z" fill="#946d4a" />
        <path d="M-39-28H15v6h-54z" fill="#d8955c" />
        <path d="M-23-21h2V7h-2zm17 0h2V7h-2z" fill="#6c7661" />
        <path d="M-25 7h23v5h-23z" fill="#d99c5e" />
        <path d="M15-14h15v7h8v8h8v8h8v8H39V9h-8V1h-8v-8h-8z" fill="#d07859" />
        <path d="M14-14h4v34h-4z" fill="#887552" />
      </>
    );
  if (f.kind === "平台")
    return (
      <>
        <path d="M-34-11h68v37h-68z" fill="#b89265" />
        {[-5, 3, 11, 19].map((y) => (
          <path key={y} d={`M-32 ${y}h64v2h-64z`} fill="#d3b180" />
        ))}
        <path d="M-36-16h72v5h-72zm0-9h4v19h-4zm68 0h4v19h-4z" fill="#80664b" />
      </>
    );
  if (f.kind === "饮水")
    return (
      <>
        <path d="M-9-9H9v26H-9z" fill="#789c91" />
        <path d="M-13-14h26v7h-26z" fill="#b8cfba" />
        <path d="M3-20h5v8H3z" fill="#617b6b" />
        <path d="M-7 16H8v4H-7z" fill="#5f7a65" />
      </>
    );
  if (f.kind === "健身")
    return (
      <>
        <path d="M-22-25h5v46h-5zm38 0h5v46h-5z" fill="#b1bca0" />
        <path d="M-19-25h38v5h-38z" fill="#789d8f" />
        <path d="M-3-18h5v29h-5z" fill="#77998b" />
        <path d="M-13 6h27v5h-27z" fill="#c69462" />
      </>
    );
  return (
    <>
      <path d="M-29-7h57v34h-57z" fill="#e6c58a" />
      <path d="M-29 1h57v3h-57zm0 12h57v3h-57z" fill="#c88b68" />
      <path d="M-19-7h4v34h-4zm29 0h4v34h-4z" fill="#f5dfb0" />
      <path d="M7 0h11v8H7z" fill="#9e6e4b" />
    </>
  );
}
const trees = Array.from({ length: 110 }, (_, i) => ({
  x: 35 + ((i * 163 + Math.floor(i / 7) * 51) % 855),
  y: 65 + ((i * 89 + Math.floor(i / 4) * 23) % 455),
  s: 0.65 + (i % 4) * 0.12,
  pine: i % 5 === 0,
})).filter((t) => {
  const pond = ((t.x - 531) / 151) ** 2 + ((t.y - 148) / 85) ** 2 < 1.3;
  const paths =
    Math.abs(t.x - 330) < 27 ||
    Math.abs(t.y - 325) < 25 ||
    Math.abs(t.y - 510) < 28;
  const lawn = t.x > 355 && t.x < 575 && t.y > 355 && t.y < 480;
  return (
    !pond &&
    !paths &&
    !lawn &&
    !facilities.some((f) => Math.hypot(t.x - f.x, t.y - f.y) < 49)
  );
});
export default function ParkMap({
  rows,
  hour,
  layer,
  selected,
  onSelect,
  highlight,
  playing,
}: Props) {
  const byId = Object.fromEntries(rows.map((r) => [r.facility_id, r]));
  return (
    <svg
      className={`park-svg ${playing ? "is-playing" : ""}`}
      viewBox="0 0 960 590"
      preserveAspectRatio="none"
      role="img"
      aria-label={`橡果公园地图，当前${hour}时，点击设施查看详情`}
    >
      <defs>
        <pattern
          id="grass"
          width="31"
          height="29"
          patternUnits="userSpaceOnUse"
        >
          <rect width="31" height="29" fill="#a7bd79" />
          <path d="M4 11h3v2H4zm15 12h2v2h-2z" fill="#90ac67" />
          <path d="M24 5h3v2h-3z" fill="#bacb89" />
        </pattern>
        <pattern
          id="water"
          width="46"
          height="25"
          patternUnits="userSpaceOnUse"
        >
          <rect width="46" height="25" fill="#83b7ae" />
          <path d="M5 8h17v2H5zm24 13h9v2h-9z" fill="#b0d0ba" />
        </pattern>
        <filter id="mapShadow">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="0"
            floodColor="#325941"
            floodOpacity=".2"
          />
        </filter>
      </defs>
      <g shapeRendering="crispEdges">
        <rect width="960" height="590" fill="url(#grass)" />
        <path
          d="M0 0h960v28H0zM0 0h22v590H0zM938 0h22v590h-22zM0 565h960v25H0z"
          fill="#84a06d"
        />
        <path
          d="M305 16h48v525h-48zM38 304h884v43H38zM305 491h560v40H305zM783 238h40v293h-40zM90 277h41v70H90z"
          fill="#d4c29c"
        />
        <path
          d="M312 16h34v525h-34zM38 311h884v29H38zM312 498h546v26H312zM790 238h26v286h-26z"
          fill="#e8d8b6"
        />
        <path
          d="M353 127h36v23h-36zM353 139h49v23h-49zM610 196h64v23h-64zM529 284h30v35h-30zM147 347h34v33h-34zM353 408h40v25h-40zM721 347h32v57h-32z"
          fill="#e8d8b6"
        />
        <path
          d="M427 59h153v12h56v19h31v23h16v76h-15v23h-26v18H453v-13h-38v-22h-24v-78h13V79h23z"
          fill="#749778"
        />
        <path
          d="M435 68h139v12h55v19h29v22h16v60h-15v24h-23v15H459v-13h-38v-21h-21v-61h13V88h22z"
          fill="url(#water)"
        />
        <path
          className="water-glint"
          d="M452 111h36v3h-36zm75 56h55v3h-55zm51-58h24v3h-24z"
          fill="#c8dbbe"
        />
        <path
          d="M464 142h11v5h-11zm7 5h12v5h-12zM570 105h11v5h-11zm7 5h12v5h-12z"
          fill="#f6e6b5"
        />
        <path d="M475 141h5v3h-5zm106-37h5v3h-5z" fill="#c79850" />
        <path d="M379 361h178v119H379z" fill="#b7ca88" />
        <path d="M388 371h160v99H388z" fill="#bed292" />
        <path d="M106 367h116v74H106z" fill="#d7bd88" />
        <path d="M112 373h104v62H112z" fill="#e3ce9f" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <path d={`M${686 + i * 58} 385h39v67h-39z`} fill="#779959" />
            {Array.from({ length: 6 }, (_, j) => (
              <g key={j}>
                <rect
                  x={693 + i * 58 + (j % 2) * 16}
                  y={394 + Math.floor(j / 2) * 19}
                  width="6"
                  height="6"
                  fill={j % 2 ? "#d68d72" : "#e5d39b"}
                />
                <rect
                  x={695 + i * 58 + (j % 2) * 16}
                  y={400 + Math.floor(j / 2) * 19}
                  width="2"
                  height="6"
                  fill="#5b8050"
                />
              </g>
            ))}
          </g>
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <g
            key={i}
            transform={`translate(${40 + i * 40} ${48 + (i % 2) * 7})`}
          >
            <path d="M0 0h19v8H0zM4-5h11v5H4z" fill="#668b56" />
            <path d="M3 0h9v3H3z" fill="#87a765" />
          </g>
        ))}
        {layer === "shade" &&
          facilities.map((f) => {
            const r = byId[f.id];
            return (
              <g key={f.id} opacity={r?.shade_ratio ?? f.shade}>
                <path
                  d={`M${f.x - 38} ${f.y - 3}h${58 + (hour < 12 ? 20 : 0)}v38h-58z`}
                  fill="#315f4d"
                  opacity=".42"
                />
              </g>
            );
          })}
        {trees
          .sort((a, b) => a.y - b.y)
          .map((t, i) => (
            <Tree key={i} {...t} />
          ))}
        <path
          d="M299 546h7v36h-7zm56 0h7v36h-7zM295 540h71v8h-71z"
          fill="#716e4b"
        />
        <path d="M303 528h55v12h-55z" fill="#e5c996" />
        <text
          x="330"
          y="537"
          textAnchor="middle"
          className="map-mini-label"
          fill="#596a48"
        >
          ACORN PARK
        </text>
        <path d="M855 492h43v25h-43z" fill="#dcbb85" />
        <path d="M859 496h35v17h-35z" fill="#78956a" />
        {layer === "flow" &&
          facilities.map((f) => {
            const r = byId[f.id];
            return r ? (
              <g key={f.id}>
                <rect
                  x={f.x - 28}
                  y={f.y - 18}
                  width={56}
                  height={45}
                  fill="#dca968"
                  opacity={Math.min(0.75, r.visits / 95)}
                />
                <rect
                  x={f.x - 38}
                  y={f.y - 28}
                  width={76}
                  height={65}
                  fill="#dc9b5c"
                  opacity={Math.min(0.25, r.visits / 200)}
                />
              </g>
            ) : null;
          })}
        {facilities.map((f) => {
          const r = byId[f.id];
          const isSelected = selected === f.id;
          const isHighlight = highlight.includes(f.name);
          const ratio = r ? r.occupied / f.capacity : 0;
          const color =
            ratio >= 0.8 ? "#b9674f" : ratio >= 0.5 ? "#c69845" : "#497c60";
          return (
            <g
              key={f.id}
              className={`map-facility ${isSelected ? "selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${f.name}，${r?.occupied ?? 0}/${f.capacity}人，查看详情`}
              onClick={() => onSelect(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(f.id);
                }
              }}
            >
              <title>
                {f.name} · {r?.occupied ?? 0}/{f.capacity} 人
              </title>
              {(isSelected || isHighlight) && (
                <rect
                  x={f.x - 39}
                  y={f.y - 44}
                  width="78"
                  height="88"
                  fill="none"
                  stroke={isSelected ? "#f8efcb" : "#d17b50"}
                  strokeWidth="3"
                  strokeDasharray="7 4"
                />
              )}
              <rect
                className="facility-hit"
                x={f.x - 35}
                y={f.y - 45}
                width="70"
                height="96"
                fill="transparent"
              />
              <g
                transform={`translate(${f.x} ${f.y})`}
                filter="url(#mapShadow)"
              >
                <FacilityIcon f={f} />
              </g>
              <g transform={`translate(${f.x - 22} ${f.y + 31})`}>
                <rect
                  width="44"
                  height="17"
                  fill={isSelected ? "#244d3e" : "#f5edd6"}
                />
                <rect
                  x="4"
                  y="6"
                  width="5"
                  height="5"
                  fill={isSelected ? "#c4d794" : color}
                />
                <text
                  x="26"
                  y="12"
                  textAnchor="middle"
                  fill={isSelected ? "#f6efda" : "#385745"}
                  className="map-count"
                >
                  {layer === "flow"
                    ? (r?.visits ?? "–")
                    : layer === "shade"
                      ? `${Math.round((r?.shade_ratio ?? f.shade) * 100)}%`
                      : `${r?.occupied ?? "–"}/${f.capacity}`}
                </text>
              </g>
            </g>
          );
        })}
        {rows.flatMap((r, fi) =>
          Array.from(
            { length: Math.min(5, Math.ceil(r.occupied / 5)) },
            (_, j) => {
              const f = facilities.find((f) => f.id === r.facility_id)!;
              const x = f.x - 32 + ((fi * 19 + j * 23) % 65),
                y = f.y - 19 + ((j * 17 + fi * 11) % 46);
              const shirt = [
                "#d48460",
                "#f0deb1",
                "#6e8c9f",
                "#a87675",
                "#e9bd67",
              ][(fi + j) % 5];
              return (
                <g
                  key={`${fi}-${j}`}
                  className="pixel-person"
                  style={{
                    animationDelay: `-${(fi + j) * 0.7}s`,
                    transformOrigin: `${x}px ${y}px`,
                  }}
                >
                  <path d={`M${x} ${y}h5v4h-5z`} fill="#edc99a" />
                  <path d={`M${x - 1} ${y + 4}h7v6h-7z`} fill={shirt} />
                  <path
                    d={`M${x} ${y + 10}h2v4h-2zm3 0h2v4h-2z`}
                    fill="#53654f"
                  />
                </g>
              );
            },
          ),
        )}
      </g>
      <g className="map-zone-labels">
        <text x="130" y="139">
          林 荫 步 道
        </text>
        <text x="490" y="255">
          橡 果 湖
        </text>
        <text x="427" y="472">
          野 餐 草 坪
        </text>
        <text x="725" y="465">
          四 季 花 园
        </text>
      </g>
      <g transform="translate(897 65)" fill="#355d48">
        <path d="M0-18l-7 19h14z" />
        <path d="M0 12V-9" stroke="#355d48" strokeWidth="2" />
        <text
          x="0"
          y="-26"
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
        >
          N
        </text>
      </g>
    </svg>
  );
}
