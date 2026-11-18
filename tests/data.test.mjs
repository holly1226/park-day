import test from "node:test";
import assert from "node:assert/strict";
import {
  facilities,
  observations,
  slots,
  toCSV,
  simulate,
  shadeAt,
  solarState,
  validateLayout,
  placementIssue,
  buildObservations,
  clock,
  timeSlot,
} from "../src/data.ts";
test("all scenario/weather/time observations are unique, and visitors reconcile exactly with facility and park totals", () => {
  assert.equal(observations.length, 4 * 48 * (facilities.length + 1));
  assert.equal(
    new Set(
      observations.map(
        (r) => `${r.scenario}/${r.weather}/${r.hour}/${r.facility_id}`,
      ),
    ).size,
    observations.length,
  );
  for (const weather of ["mild", "hot"])
    for (const hour of slots) {
      const { records, visitors } = simulate(facilities, weather, hour);
      const park = records.at(-1);
      const fs = records.filter((r) => r.record_type === "facility");
      assert.equal(visitors.length, park.occupied);
      assert.equal(new Set(visitors.map((v) => v.id)).size, visitors.length);
      assert.equal(park.walking + park.resting, park.occupied);
      assert.equal(
        fs.reduce((s, r) => s + r.occupied, 0),
        park.resting,
      );
      assert.equal(
        fs.reduce((s, r) => s + r.unserved, 0),
        park.unserved,
      );
      for (const r of fs) {
        assert.ok(r.occupied >= 0 && r.occupied <= r.capacity);
        assert.ok(r.shade_ratio >= 0 && r.shade_ratio <= 1);
      }
    }
});
test("layout changes redistribute a fixed population and can create unmet demand", () => {
  const crowded = facilities
    .filter((f) => ["路灯", "树木"].includes(f.kind) || f.id === "b1")
    .map((f) => (f.id === "b1" ? { ...f, capacity: 1 } : f));
  const initial = simulate(facilities, "mild", 17.5).records.at(-1);
  const modified = simulate(crowded, "mild", 17.5).records.at(-1);
  assert.equal(initial.occupied, modified.occupied);
  assert.ok(modified.unserved > initial.unserved);
  assert.equal(modified.resting, 1);
  const rows = buildObservations(crowded);
  assert.equal(
    rows.filter((r) => r.scenario === "baseline").length,
    2 * 48 * (facilities.length + 1),
  );
  assert.equal(
    rows.filter((r) => r.scenario === "current").length,
    2 * 48 * (crowded.length + 1),
  );
});
test("tree placement changes shade, night lights affect choices, and time covers the complete day", () => {
  const bench = { ...facilities[1], id: "testbench", x: 430, y: 365 };
  const tree = {
    id: "testtree",
    name: "测试树",
    kind: "树木",
    capacity: 0,
    x: 430,
    y: 355,
    zone: "草坪",
    shade: 0,
    description: "",
  };
  assert.ok(shadeAt(bench, 12, [bench, tree]) > shadeAt(bench, 12, [bench]));
  assert.equal(solarState(12).night, false);
  assert.equal(solarState(22).night, true);
  assert.notEqual(solarState(8).shadowX, solarState(16).shadowX);
  assert.equal(slots[0], 0);
  assert.equal(slots.at(-1), 23.5);
  assert.equal(clock(23 + 59 / 60), "23:59");
  assert.equal(timeSlot(13 + 25 / 60), 13);
  const lampsRemoved = facilities.filter((f) => f.kind !== "路灯");
  assert.ok(
    simulate(facilities, "mild", 22).records.filter(
      (r) => r.record_type === "facility" && r.light,
    ).length >
      simulate(lampsRemoved, "mild", 22).records.filter(
        (r) => r.record_type === "facility" && r.light,
      ).length,
  );
});
test("invalid imported layouts and unbuildable locations are rejected", () => {
  assert.equal(validateLayout(facilities).length, facilities.length);
  assert.deepEqual(validateLayout([]), []);
  assert.throws(() => validateLayout([{ ...facilities[0], x: Infinity }]));
  assert.throws(() => validateLayout([facilities[0], facilities[0]]));
  assert.throws(() => validateLayout(Array(33).fill(facilities[0])));
  assert.match(placementIssue(facilities, 530, 140), /湖面/);
  assert.match(placementIssue(facilities, 329, 400), /步道/);
  assert.equal(placementIssue(facilities, 430, 365), "");
});
test("CSV preserves embedded commas, quotes and CJK text", () => {
  assert.equal(
    toCSV([{ name: '树下,"长椅"', value: 2 }]),
    '\uFEFFname,value\n"树下,""长椅""","2"',
  );
  assert.equal(toCSV([]), "");
});
