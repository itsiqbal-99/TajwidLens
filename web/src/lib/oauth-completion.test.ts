import { expect, it } from "vitest";
import { isOAuthCompletion, isOAuthCompletionId } from "./oauth-completion";

it("accepts only credential-free OAuth completion notices", () => {
  const message = { type: "complete", id: "12345678-abcd-1234-abcd-123456789abc" };
  expect(isOAuthCompletion(message)).toBe(true);
  for (const value of [null, {}, { ...message, type: "ack" }, { ...message, id: "bad" }, { ...message, token: "secret" }])
    expect(isOAuthCompletion(value)).toBe(false);
  expect(isOAuthCompletionId(message.id)).toBe(true);
  expect(isOAuthCompletionId("token")).toBe(false);
});
