import { md } from "../src/index";
import * as fs from "fs";
import * as path from "path";

import { basicMarkdown } from "./sample-basic";
import { structureAwareMarkdown } from "./sample-structure-aware";
import { dynamicMarkdown } from "./sample-dynamic";
import { listMarkdown } from "./sample-list";
import { tableMarkdown } from "./sample-table";
import { myMarkdownStr } from "./sample-extension";

function readSample(filename: string) {
  const sampleCode = fs
    .readFileSync(path.join(__dirname, filename), "utf8")
    .replace(/\/\* eslint-disable prettier\/prettier \*\/\r?\n/, "")
    .replace(/(?<=\n)export /g, "")
    .replace(/ from "..\/src\/index"/g, ' from "ts-md-builder"')
    .replace(/^\n+|\n+$/, "");
  if (/eslint-disable/.test(sampleCode)) {
    throw new Error(`Sample code contains eslint-disable directive: ${filename}`);
  }
  if (/ from ["'](?!ts-md-builder["'])/.test(sampleCode)) {
    throw new Error(`Sample code contains relative import: ${filename}`);
  }
  return sampleCode;
}

export function generateReadme() {
  return md.section(
    md.h`ts-md-builder`,
    md.p`Typescript Markdown Builder with template literals support, minimal size, no external dependencies`,
    md.h`Features`,
    md.list(
      md.t`Support for all common and extended Markdown elements`,
      md.t`Reference validation for links and footnotes`,
      md.t`Smart escaping to keep \\-ing at minimum`,
      md.t`Customizable formatting options`,
      md.t`Type-safe interface`,
      md.t`Extendable builder API: add your own types to the template literals`
    ),

    md.h`Installation`,
    md.codeblock(`npm install ts-md-builder`).setLanguage("bash"),

    md.h`Basic Usage`,
    md.codeblock(readSample("sample-basic.ts") + "\n\nconsole.log(basicMarkdown)").setLanguage("typescript"),
    md.blockquote(basicMarkdown),

    md.h`Lists`,
    md.codeblock(readSample("sample-list.ts")).setLanguage("typescript"),
    md.blockquote(md.raw(listMarkdown.toString())),

    md.h`Tables`,
    md.codeblock(readSample("sample-table.ts")).setLanguage("typescript"),
    md.blockquote(md.raw(tableMarkdown.toString())),

    md.h`Structure aware sections`,
    md.codeblock(readSample("sample-structure-aware.ts")).setLanguage("typescript"),
    md.blockquote(md.raw(structureAwareMarkdown.toString())),

    md.h`Dynamic building`,
    md.codeblock(readSample("sample-dynamic.ts")).setLanguage("typescript"),
    md.blockquote(md.raw(dynamicMarkdown.toString())),

    md.h`Extensible builder API`,
    md.codeblock(readSample("sample-extension.ts")).setLanguage("typescript"),
    md.blockquote(md.raw(myMarkdownStr)),

    md.section(
      md.h`Useful things to know`,

      md.h`Tagged template literals vs dynamic building`,
      md.p`The library exports two default builders: ${md.code("md")} and ${md.code("mdb")} which are functionally interchangeable.`,
      md.p`The ${md.code("mdb")} import allows both ${md.code('md.t("text")')} and ${md.code(
        "md.t`text`"
      )} call signatures to make dynamic content building easier.`,
      md.p`The ${md.code("md")} import does not allow passing a string parameter when invoked with parentheses, to prevent the accidental use of
         ${md.code("md.t(`text ${md.b`bold`}`)")} instead of ${md.code("md.t`text ${md.b`bold`}`")} as they have different meanings:`,
      md.list(
        md.t`${md.code("md.t(`text ${md.b`bold`}`)")} will immediately convert the template literal into a string without context-aware processing,`,
        md.t`${md.code("md.t`text ${md.b`bold`}`")} will defer the evaluation of the template literal until the markdown string is actually produced.`
      ),

      md.h`ESLint configuration`,
      md.p`eslint considers calling a function with tagged template syntax an unused expression if the return value is not used (e.g. ${md.code(
        'for (const v of ["A","B"]) cell.concat` and ${n}`;'
      )}) as it doesn't consider the side effects by default. If you are using tagged templates while building dynamically, you might want to add the following rule to your eslint config to avoid false positives: https://github.com/eslint/eslint/issues/8268`,
      md.codeblock(
        `"rules": {
  "@typescript-eslint/no-unused-expressions": ["error", { "allowTaggedTemplates": true }]
}`,
        "json"
      )
    ),
    md.h`License`,
    md.p`MIT`
  );
}

if (process.argv.includes("--emit")) {
  const readmePath = path.join(__dirname, "..", "README.md");
  fs.writeFileSync(readmePath, generateReadme().toString());
}
