import { md } from "../src/index";

const templateStringMarkdown = md.section(
  md.h`Main section header`,
  md.p`The first parameter of a section is a header (or you can pass null if you don't want a header).
This section has no parent, and heading level was not specified, thus will become ${md.i`Heading 1`}`,
  md.p`The section can contain any number of block-type elements, like this paragraph...`,
  md.list([
    md.t`a list`,
    md.list([md.t`with sub-lists`, md.p`and sub-paragraphs`]),
    md.t`with some ${md.b`formatted ${md.i`text`}`} ${md.s`or`}and more`,
  ]),
  md.codeblock(
    `// a code block...
for (let i=0; i<Infinity; i+=2) {}`,
    "js"
  ),
  md.blockquote`a block quote...`,

  md.section(
    md.h`or a sub-section with automatic heading level`,
    md.p`A sub section will inherit the heading level from it's parent section by deafult`,

    md.section(md.h4`or a sub-section with manual level, e.g. Heading 4`, md.p`using ${md.code(" md.h4`...title...` ")}`)
  )
);

const dynamicMarkdown = md.section(md.h`Dynamic content`);
dynamicMarkdown.push(
  md.p`You can dynamically build your content using `.concat(
    md.code`.push(...)`,
    md.t` on ${md.b`BlockElements`} and `,
    md.code(`.concat\`...\``),
    md.t` on ${md.b`InlineElements`}`
  )
);
{
  const sampleList = md.list();
  dynamicMarkdown.push(sampleList);
  for (let i = 1; i <= 3; i++) {
    const item = md.t`list item ${md.b`${"" + i}`}`;
    sampleList.push(item);
    for (let j = 1; j <= i; j++) item.concat` *`; // set @typescript-eslint/no-unused-expressions { "allowTaggedTemplates": true } to avoid a false positive: https://github.com/eslint/eslint/issues/8268
  }
}
dynamicMarkdown.push(md.codeblock(`// a code block...\n`).concat(`for (let i=0; i<Infinity; i+=2) {}`).setLanguage("js"));

console.log(md.blockquote(templateStringMarkdown).toString());
console.log(md.blockquote(dynamicMarkdown).toString());
