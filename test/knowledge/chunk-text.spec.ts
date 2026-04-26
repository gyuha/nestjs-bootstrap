import { describe, expect, it } from "vitest";
import { chunkText } from "../../src/modules/knowledge/application/chunk-text";

describe("chunkText", () => {
  it("splits text into overlapping chunks", () => {
    const chunks = chunkText("one two three four five six", {
      maxWords: 3,
      overlapWords: 1,
    });

    expect(chunks.map((chunk) => chunk.content)).toEqual([
      "one two three",
      "three four five",
      "five six",
    ]);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual([0, 1, 2]);
  });

  it("drops blank chunks", () => {
    expect(chunkText("   \n\n  ", { maxWords: 3, overlapWords: 1 })).toEqual([]);
  });

  it("advances by one word when overlap is greater than or equal to max words", () => {
    const chunks = chunkText("one two three four", {
      maxWords: 2,
      overlapWords: 2,
    });

    expect(chunks.map((chunk) => chunk.content)).toEqual(["one two", "two three", "three four"]);
  });
});
