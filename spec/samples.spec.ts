import { expect, test } from "vitest";
import { generateReadme } from "./generate-readme";

test("Generate README", () => {
  const readme = generateReadme();
  expect(readme.toString()).toBeTypeOf("string");
});
