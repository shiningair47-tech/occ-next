import { describe, it, expect } from "vitest";
import {
  isQualified,
  isFlagged,
  isPending,
  isUnworked,
  matchesCloserFilter,
  isIntakeLead,
  isInCloserPipeline,
  filterSetterQueue,
  filterCloserPipeline,
  countBySetterStatus,
  QUALIFIED_STATUSES,
  FLAGGED_STATUSES,
  getSetterLabel,
} from "./statusFilters";

describe("isQualified", () => {
  it.each([
    ["qualified", true],
    ["appointment_fixed", true],
    ["pending", false],
    ["bad", false],
    ["wrong_number", false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("returns %s for %j", (status, expected) => {
    expect(isQualified(status)).toBe(expected);
  });
});

describe("isFlagged", () => {
  it.each([
    ["bad", true],
    ["wrong_number", true],
    ["qualified", false],
    ["appointment_fixed", false],
    ["pending", false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("returns %s for %j", (status, expected) => {
    expect(isFlagged(status)).toBe(expected);
  });
});

describe("isPending", () => {
  it.each([
    ["pending", true],
    [null, true],
    [undefined, true],
    ["qualified", false],
    ["appointment_fixed", false],
    ["bad", false],
  ])("returns %s for %j", (status, expected) => {
    expect(isPending(status)).toBe(expected);
  });
});

describe("isUnworked", () => {
  it.each([
    ["", true],
    [null, true],
    [undefined, true],
    ["new", false],
    ["hot", false],
    ["arrived", false],
    ["lost", false],
  ])("returns %s for %j", (status, expected) => {
    expect(isUnworked(status)).toBe(expected);
  });
});

describe("matchesCloserFilter", () => {
  describe("filter = 'all'", () => {
    it("returns true for any status", () => {
      expect(matchesCloserFilter("hot", "all")).toBe(true);
      expect(matchesCloserFilter("", "all")).toBe(true);
      expect(matchesCloserFilter(null, "all")).toBe(true);
    });
  });

  describe("filter = 'new'", () => {
    it("matches 'new', empty string, null, and undefined", () => {
      expect(matchesCloserFilter("new", "new")).toBe(true);
      expect(matchesCloserFilter("", "new")).toBe(true);
      expect(matchesCloserFilter(null, "new")).toBe(true);
      expect(matchesCloserFilter(undefined, "new")).toBe(true);
    });

    it("does not match other statuses", () => {
      expect(matchesCloserFilter("hot", "new")).toBe(false);
      expect(matchesCloserFilter("arrived", "new")).toBe(false);
      expect(matchesCloserFilter("lost", "new")).toBe(false);
    });
  });

  describe("filter = specific status (hot, cold, arrived, lost)", () => {
    it("does exact match", () => {
      expect(matchesCloserFilter("hot", "hot")).toBe(true);
      expect(matchesCloserFilter("arrived", "arrived")).toBe(true);
      expect(matchesCloserFilter("lost", "lost")).toBe(true);
      expect(matchesCloserFilter("cold", "cold")).toBe(true);
    });

    it("does not match different statuses", () => {
      expect(matchesCloserFilter("hot", "cold")).toBe(false);
      expect(matchesCloserFilter("arrived", "lost")).toBe(false);
      expect(matchesCloserFilter("", "hot")).toBe(false);
    });
  });
});

describe("isIntakeLead", () => {
  it("matches pending handoff with empty/null closer_status", () => {
    expect(isIntakeLead("pending", "")).toBe(true);
    expect(isIntakeLead("pending", null)).toBe(true);
    expect(isIntakeLead("pending", undefined)).toBe(true);
  });

  it("does not match when handoff is not pending", () => {
    expect(isIntakeLead("accepted", "")).toBe(false);
    expect(isIntakeLead("accepted", null)).toBe(false);
  });

  it("does not match when closer_status is set", () => {
    expect(isIntakeLead("pending", "new")).toBe(false);
    expect(isIntakeLead("pending", "hot")).toBe(false);
  });
});

describe("isInCloserPipeline", () => {
  it("matches accepted handoff", () => {
    expect(isInCloserPipeline("accepted")).toBe(true);
  });

  it("does not match other statuses", () => {
    expect(isInCloserPipeline("pending")).toBe(false);
    expect(isInCloserPipeline("")).toBe(false);
    expect(isInCloserPipeline(null)).toBe(false);
  });
});

describe("filterSetterQueue", () => {
  const leads = [
    { setter_status: "pending" },
    { setter_status: "qualified" },
    { setter_status: "appointment_fixed" },
    { setter_status: "bad" },
    { setter_status: "wrong_number" },
  ];

  it("returns all leads for 'all' filter", () => {
    expect(filterSetterQueue(leads, "all")).toHaveLength(5);
  });

  it("filters by exact status match", () => {
    expect(filterSetterQueue(leads, "qualified")).toHaveLength(1);
    expect(filterSetterQueue(leads, "appointment_fixed")).toHaveLength(1);
    expect(filterSetterQueue(leads, "bad")).toHaveLength(1);
    expect(filterSetterQueue(leads, "wrong_number")).toHaveLength(1);
  });
});

describe("filterCloserPipeline", () => {
  const leads = [
    { closer_status: "" },
    { closer_status: "new" },
    { closer_status: "hot" },
    { closer_status: "cold" },
    { closer_status: "arrived" },
    { closer_status: "lost" },
  ];

  it("returns all for 'all' filter", () => {
    expect(filterCloserPipeline(leads, "all")).toHaveLength(6);
  });

  it("filters by 'new' including empty string", () => {
    const result = filterCloserPipeline(leads, "new");
    expect(result).toHaveLength(2); // '' and 'new'
  });

  it("filters by specific statuses", () => {
    expect(filterCloserPipeline(leads, "hot")).toHaveLength(1);
    expect(filterCloserPipeline(leads, "arrived")).toHaveLength(1);
    expect(filterCloserPipeline(leads, "lost")).toHaveLength(1);
  });
});

describe("countBySetterStatus", () => {
  const leads = [
    { setter_status: "qualified" },
    { setter_status: "appointment_fixed" },
    { setter_status: "qualified" },
    { setter_status: "pending" },
    { setter_status: "bad" },
  ];

  it("counts leads matching any of the given statuses", () => {
    expect(countBySetterStatus(leads, QUALIFIED_STATUSES)).toBe(3);
    expect(countBySetterStatus(leads, FLAGGED_STATUSES)).toBe(1);
  });

  it("returns 0 when no leads match", () => {
    expect(countBySetterStatus(leads, ["wrong_number"])).toBe(0);
  });
});

describe("getSetterLabel", () => {
  it.each([
    ["pending", "Pending"],
    ["qualified", "Qualified"],
    ["appointment_fixed", "Appt Fixed"],
    ["bad", "Bad Lead"],
    ["wrong_number", "Wrong #"],
    [null, ""],
    [undefined, ""],
    ["unknown_status", "unknown_status"],
  ])("returns %j for %j", (status, expected) => {
    expect(getSetterLabel(status)).toBe(expected);
  });
});
