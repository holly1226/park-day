import test from "node:test";
import assert from "node:assert/strict";
import { AVA } from "@antv/ava";
import { observations, toCSV } from "../src/data.ts";

test("published AVA loads the actual dataset and agrees with independently calculated totals", async () => {
  const ava = new AVA({ llm: { model: "not-needed-for-sql" } });
  try {
    await ava.source({ type: "csv", options: { csv: toCSV(observations) } });
    const r = await ava.query(
      "SELECT COUNT(*) AS n,SUM(occupied) AS occupied FROM data WHERE weather='hot' AND hour=14",
    );
    assert.equal(Number(r.data[0].n), 12);
    assert.equal(
      Number(r.data[0].occupied),
      observations
        .filter((r) => r.weather === "hot" && r.hour === 14)
        .reduce((s, r) => s + r.occupied, 0),
    );
    const seats = await ava.query(
      "SELECT SUM(capacity-occupied) AS n FROM data WHERE weather='mild' AND hour=14 AND kind IN ('座椅','凉亭')",
    );
    assert.equal(
      Number(seats.data[0].n),
      observations
        .filter(
          (r) =>
            r.weather === "mild" &&
            r.hour === 14 &&
            ["座椅", "凉亭"].includes(r.kind),
        )
        .reduce((s, r) => s + r.capacity - r.occupied, 0),
    );
  } finally {
    await ava.dispose();
  }
});
