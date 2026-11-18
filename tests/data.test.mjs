import test from "node:test";
import assert from "node:assert/strict";
import { facilities, observations, slots, toCSV } from "../src/data.ts";

test("every weather/slot/facility has exactly one valid observation", () => {
  assert.equal(observations.length, 2 * 31 * 12);
  assert.equal(
    new Set(observations.map((r) => `${r.weather}/${r.hour}/${r.facility_id}`))
      .size,
    observations.length,
  );
  for (const r of observations) {
    assert.ok(r.occupied >= 0 && r.occupied <= r.capacity);
    assert.ok(r.visits >= r.occupied);
    assert.ok(r.shade_ratio >= 0 && r.shade_ratio <= 1);
    assert.ok(Number.isFinite(r.dwell) && r.dwell > 0);
    assert.ok(facilities.some((f) => f.id === r.facility_id));
  }
  assert.equal(slots[0], 6);
  assert.equal(slots.at(-1), 21);
});
test("CSV preserves embedded commas, quotes and CJK text", () => {
  assert.equal(
    toCSV([{ name: '树下,"长椅"', value: 2 }]),
    '\uFEFFname,value\n"树下,""长椅""","2"',
  );
  assert.equal(toCSV([]), "");
});
