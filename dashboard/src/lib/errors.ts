import { AxiosError } from "axios";

/** Best-effort human-readable message from an axios/API error. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: unknown } | undefined;
    if (typeof data?.error === "string") return data.error;
    if (data?.error && typeof data.error === "object") return "Validation failed. Check your input.";
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
