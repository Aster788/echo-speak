import { describe, expect, it } from "vitest";
import {
  computeGapCandidateIds,
  planGapRefresh,
} from "@/services/gap-detector";

describe("computeGapCandidateIds", () => {
  it("flags transcript phrases missing from Feishu on the same set", () => {
    const ids = computeGapCandidateIds([
      { id: "t1", phrase: "let go of something", source_type: "transcript" },
      { id: "t2", phrase: "behind the scenes", source_type: "transcript" },
      { id: "f1", phrase: "let go of", source_type: "feishu" },
    ]);
    expect(ids).toEqual(["t2"]);
  });

  it("treats empty Feishu set as all transcript phrases being candidates", () => {
    const ids = computeGapCandidateIds([
      { id: "t1", phrase: "iced latte", source_type: "transcript" },
      { id: "t2", phrase: "on the way", source_type: "transcript" },
    ]);
    expect(ids).toEqual(["t1", "t2"]);
  });

  it("does not use Feishu phrases from outside the provided set (cross-video)", () => {
    // Caller scopes expressions to one video; Feishu on another video is absent here.
    const ids = computeGapCandidateIds([
      { id: "t1", phrase: "figure it out", source_type: "transcript" },
    ]);
    expect(ids).toEqual(["t1"]);
  });

  it("collapses via canonicalKey (case / placeholders)", () => {
    const ids = computeGapCandidateIds([
      { id: "t1", phrase: "Let Go Of Something", source_type: "transcript" },
      { id: "f1", phrase: "let go of", source_type: "feishu" },
    ]);
    expect(ids).toEqual([]);
  });
});

describe("planGapRefresh", () => {
  it("inserts new candidates and deletes stale pending", () => {
    const plan = planGapRefresh(
      ["t1", "t2"],
      [
        { id: "g-stale", expression_id: "t-old", status: "pending" },
        { id: "g-keep", expression_id: "t1", status: "pending" },
      ]
    );
    expect(plan.insertExpressionIds).toEqual(["t2"]);
    expect(plan.deleteGapIds).toEqual(["g-stale"]);
  });

  it("keeps ignored sticky (does not re-insert or reopen)", () => {
    const plan = planGapRefresh(
      ["t1"],
      [{ id: "g1", expression_id: "t1", status: "ignored" }]
    );
    expect(plan.insertExpressionIds).toEqual([]);
    expect(plan.deleteGapIds).toEqual([]);
  });

  it("keeps accepted unchanged when still a candidate", () => {
    const plan = planGapRefresh(
      ["t1"],
      [{ id: "g1", expression_id: "t1", status: "accepted" }]
    );
    expect(plan.insertExpressionIds).toEqual([]);
    expect(plan.deleteGapIds).toEqual([]);
  });

  it("does not delete ignored when no longer a candidate", () => {
    const plan = planGapRefresh(
      [],
      [{ id: "g1", expression_id: "t1", status: "ignored" }]
    );
    expect(plan.deleteGapIds).toEqual([]);
  });
});
