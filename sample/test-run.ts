// https://www.markdownguide.org/basic-syntax/
// https://www.npmjs.com/package/markdown-it
// https://markdown-it.github.io/

import { expect, test } from "vitest";

import { md, MdBuilder } from "../src/index";
import fs from "fs";

function escapetest(from: MdBuilder.Element, to: string) {
  test("escape test", () =>
    expect(md.p`${from.toString(undefined, (output, errors) => output + "\\\\ errors:" + errors.map((error) => error.errorType).join(","))}`).toBe(
      to
    ));
}

function testRun() {
  escapetest(md.t`# Not a heading`, "# Not a heading");
  escapetest(md.t`#Not a heading either`, "#Not a heading either");
  escapetest(md.t` # Not a heading either`, " # Not a heading either");
  escapetest(md.t`Still not heading\n=`, "Still not heading\\n\\=");
  escapetest(md.t`Still not heading\n====`, "Still not heading\n\\====");
  escapetest(md.t`Still not heading\n-`, "Still not heading\n\\-");
  escapetest(md.t`>Not a quote`, "\\>Not a quote");
  escapetest(md.t` > No quoting`, " \\> No quoting");
  escapetest(md.t`> > > No quoting`, "\\> > > No quoting");
  escapetest(md.t`- Not a list`, "\\- Not a list");
  escapetest(md.t`-Still not a list`, "\\-Still not a list");
  escapetest(md.t`+ Not a list`, "\\+ Not a list");
  escapetest(md.t`+Still not a list`, "\\+Still not a list");
  escapetest(md.t` +  Not a list`, " \\+  Not a list");
  escapetest(md.t` +Not a list`, " \\+Not a list");
  escapetest(md.t`*Not list`, "\\*Not list");
  escapetest(md.t`* No list for old man`, "\\* No list for old man");
  escapetest(md.t`1. Not an unordered list`, "\\1. Not an unordered list");
  escapetest(md.t`1. Not an unordered list`, "\\1. Not an unordered list");
  escapetest(md.t`  1) Not an unordered list`, "  \\1) Not an unordered list");
  escapetest(md.t`1)Not an unordered list`, "1)Not an unordered list");
  escapetest(md.t`  1. Not an unordered list`, "  \\1. Not an unordered list");
  escapetest(md.t`1.Not an unordered list`, "1.Not an unordered list");
  escapetest(md.t`    Indented, but not code`, " Indented, but not code");
  escapetest(md.t`	Not code, with Tab indentation`, " Not code, with Tab indentation");
  escapetest(md.t`\`\`\``, "\\`\\`\\`");
  escapetest(md.t`\`\`\`\` @#$%^!`, "\\`\\`\\`\\` @#$%^!");
  escapetest(md.t`~~~`, "\\~\\~\\~");
  escapetest(
    md.t`not _italic_ not **bold** not ~~strikethrough~~ not \`code\``,
    "not \\_italic\\_ not \\*\\*bold\\*\\* not \\~\\~strikethrough\\~\\~ not \\`code\\`"
  );
  escapetest(md.t`[Not a link](http://not.a.link)`, "\\[Not a link](http://not.a.link)");
  escapetest(
    md.t`![Neither a link nor an image](http://not.a.link "Not a title")`,
    '!\\[Neither a link nor an image](http://not.a.link "Not a title")'
  );
  escapetest(md.t`<http://not.an.url/>`, "\\<http://not.an.url/>");
  escapetest(md.t`<not@an.email>`, "\\<not@an.email>");

  escapetest(md.t`!${md.link("Link, but not an image", "http:\\localhost", "Link to localhost")}`, "");
  escapetest(md.t`!${md.t`${md.t``}${md.t``}${md.link("Link, but not an image", "http:\\localhost", "Link to localhost")}`}`, "");
  escapetest(md.t`No!${md.raw`[Link, but not an image](http:\\localhost "Link to localhost")`}`, "");
  escapetest(
    md.t`
| Not      | A |  Table |
| -------- | - | -----: |
| Header   |   | Title  |
| Paragraph|   | Text   |
`,
    `
| Not      | A |  Table |
| \\-------- | - | -----: |
| Header   |   | Title  |
| Paragraph|   | Text   |
`
  );

  const linkRef = md.linkUrl("http://localhost", "Localhost");
  const linkRefDup = md.linkUrl("http://localhost/dup", "Localhost dup");
  const linkRefMissing = md.linkUrl(
    "http://localhost/missing-missing-a-long-long-long-long-long-long-long-long-long-long-long-long-link-link-link-link-link-link-link-link-link-link",
    "Localhost missing"
  );
  const linkRefUnreferenced = md.linkUrl("http://localhost/unreferenced", "Localhost unreferenced");
  const linkErrorStr = md
    .section(
      md.h`Title  \n alma \n  `,
      md.p`linkRef: ${md.link("linkRef", linkRef)} linkRef again: ${md.link("linkRef", linkRef)} missing: ${md.link(
        "linkRefMissing",
        linkRefMissing
      )} duplicate: ${md.link("linkRefDup", linkRefDup)}`,
      linkRef,
      linkRefDup,
      linkRefDup,
      linkRefUnreferenced
    )
    .toString(undefined, (output, errors) => {
      return output + "\n\n" + JSON.stringify(errors, null, 2);
    });

  console.log(linkErrorStr);

  const footnote = md.footnote("A footnote");
  const footnoteDup = md.footnote("A duplicated footnote");
  const footnoteMissing = md.footnote("A missing footnote", "Let's hope it will auto-add...");
  const footnoteUnreferenced = md.footnote("http://localhost/unreferenced", "Localhost unreferenced");
  const footnoteErrorStr = md
    .section(
      md.h`Title  \n alma \n  `,
      md.p`footnote ref: ${footnote.ref} ref again: ${footnote.ref} missing: ${footnoteMissing.ref} duplicate: ${footnoteDup.ref}`,
      footnote,
      footnoteDup,
      footnoteDup,
      footnoteUnreferenced
    )
    .toString(undefined, (output, errors) => {
      return output + "\n\n" + JSON.stringify(errors, null, 2);
    });
  console.log(footnoteErrorStr);

  const positiveTestStr = md
    .section(
      md.h`Title  \n alma \n  `,
      md.p`lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
       ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
${md.link("Link text", "http:\\\\localhost", "Link title")}
${md.link("Reference-style link", linkRef)}
${md.link("Auto-added link", linkRefMissing)}
${md.img("Image alt", "http:\\\\localhost\\image.jpg", "Image title")}
`,
      md.codeblock(
        `~~~
A code block example inside a code block
~~~

some harmless quotes \`\`\`\`

\`\`\`js
// another example, in Javascript
for (let i=0; i<Infinity; i++) {}
 \`\`\``,
        "js"
      ),
      linkRef,
      md.section(
        md.h`Subtitle`,
        md.p`Text ${md.b`bold ${md.i`italic ${md.s`strikethrough ${md.sub`subscript`}${md.sup`superscript`}`}`}`}
${md.code("md.h` this is a code with ````-s ending with a `")}\n
${md.sup`superscript is non-standard markup`}`
      )
    )
    .toString();

  console.log(positiveTestStr);
}

testRun();
