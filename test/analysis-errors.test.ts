import assert from "node:assert/strict";
import test from "node:test";
import {
  getAnalysisErrorMessage,
  getVtoErrorMessage,
} from "../lib/analysis-errors";

test("classifies DOMException TimeoutError as an analysis timeout", () => {
  assert.equal(
    getAnalysisErrorMessage(new DOMException("timed out", "TimeoutError")),
    "The analysis took too long. Please choose the photo again to retry.",
  );
});

test("classifies DOMException TimeoutError as a VTO timeout", () => {
  assert.equal(
    getVtoErrorMessage(new DOMException("timed out", "TimeoutError")),
    "The virtual try-on took too long. Please choose the shade again to retry.",
  );
});
