/* eslint-disable prettier/prettier */
import { md } from "../src/index";

export const listMarkdown = md.list(
  md.t`Item ${md.b`1`}`,
  md.list(
    md.t`Nested item ${md.i`1.1`}`,
    md.t`Nested item ${md.i`1.2`}`,
    md.ordered(
      md.t`Nested ordered item 1`,
      md.t`Nested ordered item 2`,
    ),
  ),
  md.t`Item ${md.b`2`}`,
);
