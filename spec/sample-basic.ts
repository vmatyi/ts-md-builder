/* eslint-disable prettier/prettier */
import { md } from "../src/index";

export const basicMarkdown = md.section(
  md.h`My Document`,
  md.p`Here is a paragraph with ${md.b`bold`} and ${md.i`italic`} text.`,
  md.list(
    md.t`List item 1`,
    md.t`List item 2`,
  ),
  md.blockquote`Quoted text`
);
