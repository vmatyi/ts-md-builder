/* eslint-disable prettier/prettier */
import { md } from "../src/index";

export const structureAwareMarkdown = md.section(
  md.h`Main section header`,
  md.p`The first parameter of a section is a header (or you can pass null if you don't want a header).`
    .concat`This section has no parent, and heading level was not specified, thus will become ${md.i`Heading 1`}`,
  md.p`The section can contain any number of block-type elements, like this paragraph...`,
  md.list(
    md.t`a list`,
    md.list(
      md.t`with sub-lists`,
      md.p`and sub-paragraphs`
    ),
    md.t`with some ${md.b`formatted ${md.i`text`}`} ${md.s`or`} and more`,
  ),
  md.codeblock(`// a code block...
for (let i=0; i<Infinity; i+=2) {}`,
    "js"
  ),
  md.blockquote`a block quote...`,

  md.section(
    md.h`or a sub-section with automatic heading level`,
    md.p`A sub section will inherit the heading level from it's parent section by deafult`,

    md.section(md.h4`or a sub-section with manually set level, e.g. Heading 4`, md.p`using ${md.code(" md.h4`...title...` ")}`)
  )
);
