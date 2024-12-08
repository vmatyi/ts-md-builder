/* eslint-disable prettier/prettier */
import { md } from "../src/index";

export const tableMarkdown = md.table(
  [
    md.th`Header 1`,
    md.th`Header 2`.setAlign("center"),
    md.th`Header 3`.setAlign("right"),
  ],
  [
    md.t`Row 1`,
    md.t`cell.1.2`,
    md.t`${md.b`data`}`,
  ],
  [
    md.t`Row 2`,
    md.t`cell.2.2`,
    md.t`link to ${md.link("localhost", "http://localhost", "Localhost")}`,
  ],
);
