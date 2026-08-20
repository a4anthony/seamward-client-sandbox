import { describe, expect, it } from "vitest";
import { createConfiguredCollector } from "../src/seamward.js";

describe("sandbox Seamward configuration", () => {
  it("starts from one public Connection key and one ingest secret", async () => {
    const { collector, integrationKey } = createConfiguredCollector({
      SEAMWARD_CONNECTION_KEY:
        "sw_conn_v1.M8nQ3wR6tY9pL2sV.K7mP4xQ9vT2nW6cR.demo",
      SEAMWARD_INGEST_TOKEN: `sw_ing_${"s".repeat(43)}`,
      SEAMWARD_INGEST_URL: "http://127.0.0.1:4100/ingest",
    });

    expect(integrationKey).toBe("sw_int_K7mP4xQ9vT2nW6cR");
    expect(collector.stats()).toMatchObject({ enqueued: 0, shipped: 0 });
    await collector.stop();
  });
});
