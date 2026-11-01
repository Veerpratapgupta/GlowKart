const DEFAULT_ANALYSIS_ERROR =
  "We couldn’t analyze that photo. Please try again.";
const ANALYSIS_TIMEOUT_ERROR =
  "The analysis took too long. Please choose the photo again to retry.";
const VTO_TIMEOUT_ERROR =
  "The virtual try-on took too long. Please choose the shade again to retry.";

export function getAnalysisErrorMessage(
  error: unknown,
  timedOut = false,
): string {
  if (
    timedOut ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.message.toLowerCase().includes("too long"))
  ) {
    return ANALYSIS_TIMEOUT_ERROR;
  }
  if (error instanceof Error && error.message === DEFAULT_ANALYSIS_ERROR) {
    return DEFAULT_ANALYSIS_ERROR;
  }

  if (
    error instanceof Error &&
    (error.message.startsWith("That file") ||
      error.message.startsWith("Please upload") ||
      error.message.startsWith("We couldn’t read"))
  ) {
    return error.message;
  }
  return DEFAULT_ANALYSIS_ERROR;
}

export function getVtoErrorMessage(error: unknown, timedOut = false): string {
  if (
    timedOut ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.message.toLowerCase().includes("too long"))
  ) {
    return VTO_TIMEOUT_ERROR;
  }
  if (error instanceof Error && error.message) return error.message;
  return "We couldn’t render this shade. Please try again.";
}
