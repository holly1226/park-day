import test from "node:test";
import assert from "node:assert/strict";
import { AVA } from "@antv/ava";
import {
  observations,
  toCSV,
  facilities,
  buildObservations,
  simulate,
} from "../src/data.ts";
test("real AVA totals match the simulator and layout comparison reads the edited dataset", async () => {
  const layout = facilities
    .filter((f) => f.kind === "路灯" || f.id === "b1")
    .map((f) => (f.id === "b1" ? { ...f, capacity: 1 } : f));
  const data = buildObservations(layout);
  const ava = new AVA({ llm: { model: "not-needed-for-sql" } });
  try {
    await ava.source({ type: "csv", options: { csv: toCSV(data) } });
    const result = await ava.query(
      "SELECT scenario,occupied,walking,resting,unserved FROM data WHERE record_type='park' AND weather='mild' AND hour=17.5 ORDER BY scenario",
    );
    assert.equal(result.data.length, 2);
    for (const row of result.data) {
      const expected = simulate(
        row.scenario === "baseline" ? facilities : layout,
        "mild",
        17.5,
      ).records.at(-1);
      for (const key of ["occupied", "walking", "resting", "unserved"])
        assert.equal(Number(row[key]), expected[key]);
    }
    assert.equal(
      Number(result.data[0].occupied),
      Number(result.data[1].occupied),
    );
    assert.ok(
      Number(result.data[1].unserved) > Number(result.data[0].unserved),
    );
  } finally {
    await ava.dispose();
  }
});
