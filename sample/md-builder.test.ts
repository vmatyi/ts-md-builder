// https://www.markdownguide.org/basic-syntax/
// https://www.npmjs.com/package/markdown-it
// https://markdown-it.github.io/

import { expect, test } from "vitest";

import { md, MdBuilder } from "../src/index";
import fs from "fs";

function showDiff(a: string, b: string) {
  // Vitest is not very good at comparing whitespaces at line ends...
  const wrap = (s: string) => "👉" + s.replace(/\n/g, "👈\n👉") + "👈";
  if (a !== b) console.log(wrap(a) + "\n---------------\n" + wrap(b));
}

function toStringTest(from: MdBuilder.Element, to: string, options?: MdBuilder.ToStringOptions, onErrors?: MdBuilder.ErrorHandler<never>) {
  test("toStringTest: " + MdBuilder.trimLength(to.trim(), 100).replace(/\t/g, "⇥").replace(/\n/g, "↵"), () => {
    const mdStr = from.toString(
      options,
      onErrors ?? ((output, errors) => output + "\\\\ errors:" + errors.map((error) => error.errorType).join(","))
    );
    showDiff(mdStr, to);
    expect(mdStr).toBe(to);
  });
}

function testRun() {
  if (true) {
    toStringTest(md.t`# Not a heading`, "\\# Not a heading");
    toStringTest(md.t`#Not a heading either`, "\\#Not a heading either");
    toStringTest(md.t` # Not a heading either`, " \\# Not a heading either");
    toStringTest(md.t`Still not heading\n=`, "Still not heading  \n\\=");
    toStringTest(md.t`Still not heading\n====`, "Still not heading  \n\\====");
    toStringTest(md.t`Still not heading\n-`, "Still not heading  \n\\-");
    toStringTest(md.t`>Not a quote`, "\\>Not a quote");
    toStringTest(md.t` > No quoting`, " \\> No quoting");
    toStringTest(md.t`> > > No quoting`, "\\> \\> \\> No quoting");
    toStringTest(md.t`- Not a list`, "\\- Not a list");
    toStringTest(md.t`-Still not a list`, "-Still not a list");
    toStringTest(md.t`+ Not a list`, "\\+ Not a list");
    toStringTest(md.t`+Still not a list`, "+Still not a list");
    toStringTest(md.t` +  Not a list`, " \\+  Not a list");
    toStringTest(md.t` +Not a list`, " +Not a list");
    toStringTest(md.t`*Not list`, "\\*Not list");
    toStringTest(md.t`* No list for old man`, "\\* No list for old man");
    toStringTest(md.t`1. Not an unordered list`, "1\\. Not an unordered list");
    toStringTest(md.t`1. Not an unordered list`, "1\\. Not an unordered list");
    toStringTest(md.t`  1) Not an unordered list`, " 1\\) Not an unordered list");
    toStringTest(md.t`1)Not an unordered list`, "1)Not an unordered list");
    toStringTest(md.t`  1. Not an unordered list`, " 1\\. Not an unordered list");
    toStringTest(md.t`1.Not an unordered list`, "1.Not an unordered list");
    toStringTest(md.t`    Indented, but not code`, " Indented, but not code");
    toStringTest(md.t`	Not code, with Tab indentation`, " Not code, with Tab indentation");
    toStringTest(md.t`\`\`\``, "\\`\\`\\`");
    toStringTest(md.t`\`\`\`\` @#$%^!`, "\\`\\`\\`\\` @#$%^!");
    toStringTest(md.t`~~~`, "\\~\\~\\~");
    toStringTest(
      md.t`not _italic_ not **bold** not ~~strikethrough~~ not \`code\``,
      "not \\_italic\\_ not \\*\\*bold\\*\\* not \\~\\~strikethrough\\~\\~ not \\`code\\`"
    );
    toStringTest(md.t`[Not a link](http://not.a.link)`, "\\[Not a link\\](http://not.a.link)");
    toStringTest(
      md.t`![Neither a link nor an image](http://not.a.link "Not a title")`,
      '!\\[Neither a link nor an image\\](http://not.a.link "Not a title")'
    );
    toStringTest(md.t`<http://not.an.url/>`, "\\<http://not.an.url/\\>");
    toStringTest(md.t`<not@an.email>`, "\\<not@an.email\\>");

    toStringTest(
      md.t`!${md.link("Link, but not an image", "http:\\localhost", "Link to localhost")}`,
      `\\![Link, but not an image](http:\\localhost "Link to localhost")`
    );
    toStringTest(
      md.t`!${md.t`${md.t``}${md.t``}${md.link("Link, but not an image", "http:\\localhost", "Link to localhost")}`}`,
      `\\![Link, but not an image](http:\\localhost "Link to localhost")`
    );
    toStringTest(
      md.t`No!${md.raw`[Raw link, but not an image](http:\\localhost "Link to localhost")`}`,
      `No\\![Raw link, but not an image](http:\\localhost "Link to localhost")`
    );
    toStringTest(
      md.t`
| Not      | A |  Table |
| -------- | - | -----: |
| Header   |   | Title  |
| Paragraph|   | Text   |
`,
      `\\
| Not      | A |  Table |  
\\| -------- | - | -----: |  
| Header   |   | Title  |  
| Paragraph|   | Text   |  
`
    );

    const linkRefLong = md.linkUrl(
      "http://localhost/missing-missing-a-long-long-long-long-long-long-long-long-long-long-long-long-link-link-link-link-link-link-link-link-link-link",
      "Localhost missing"
    );
    test("long element description", () => {
      const mdStr = linkRefLong._describe(MdBuilder.getDefaultContext());
      const to = `[1]: <http://localhost/missing-missing-a-long-long-long-long-long-long-long-long-long-long-long-long-link-link-link-link-link-link-link-link-link-link> "Localh…`;
      showDiff(mdStr, to);
      expect(mdStr).toBe(to);
    });

    {
      const linkRef = md.linkUrl("http://localhost", "Localhost");
      const linkRefDup = md.linkUrl("http://localhost/dup", "Localhost dup");
      const linkRefMissing = md.linkUrl("http://localhost/missing", "Localhost missing");
      const linkRefUnreferenced = md.linkUrl("http://localhost/unreferenced", "Localhost unreferenced");
      const linkReferenceTest = md.section(
        null,
        md.p`linkRef: ${md.link("linkRef", linkRef)} linkRef again: ${md.link("linkRef", linkRef)} missing: ${md.link(
          "linkRefMissing",
          linkRefMissing
        )} duplicate: ${md.link("linkRefDup", linkRefDup)}`,
        linkRef,
        linkRefDup,
        linkRefDup,
        linkRefUnreferenced
      );
      test("link reference checks", () => {
        const mdStr = linkReferenceTest.toString({ autoReferences: false }, (output, errors) => errors.map((error) => error.errorType).join(","));
        const to = "LINK_REFERENCE_MISSING,LINK_REFERENCE_DUPLICATE,LINK_REFERENCE_NOT_USED";
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
      test("link reference autoReferences", () => {
        const mdStr = linkReferenceTest.toString(undefined, (output, errors) => errors.map((error) => error.errorType).join(","));
        const to = "LINK_REFERENCE_DUPLICATE,LINK_REFERENCE_NOT_USED";
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
      test("link reference dedup+autoReferences", () => {
        const mdStr = linkReferenceTest.toString({ autoReferences: true, dedupReferences: true }, (output, errors) => output);
        const to = `
linkRef: [linkRef][1] linkRef again: [linkRef][1] missing: [linkRefMissing][2] duplicate: [linkRefDup][3]

[1]: <http://localhost> "Localhost"

[3]: <http://localhost/dup> "Localhost dup"

[4]: <http://localhost/unreferenced> "Localhost unreferenced"

[2]: <http://localhost/missing> "Localhost missing"
`;
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
    }
    {
      const footnote = md.footnote("A footnote");
      const footnoteDup = md.footnote(md.p`A duplicated footnote`);
      const footnoteMissing = md.footnote`A missing footnote`;
      const footnoteUnreferenced = md.footnote("http://localhost/unreferenced").push(md.p`Unreferenced, but added to the document...`);
      const footnoteTest = md.section(
        null,
        md.p`footnote ref: ${footnote.ref} ref again: ${footnote.ref} missing: ${footnoteMissing.ref} duplicate: ${footnoteDup.ref}`,
        footnote,
        footnoteDup,
        footnoteDup,
        footnoteUnreferenced
      );
      test("footnote checks", () => {
        const mdStr = footnoteTest.toString({ autoReferences: false, dedupReferences: false }, (output, errors) =>
          errors.map((error) => error.errorType).join(",")
        );
        const to = "FOOTNOTE_MISSING,FOOTNOTE_DUPLICATE,FOOTNOTE_NOT_USED";
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
      test("footnote defaults", () => {
        const mdStr = footnoteTest.toString(undefined, (output, errors) => errors.map((error) => error.errorType).join(","));
        const to = "FOOTNOTE_DUPLICATE,FOOTNOTE_NOT_USED";
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
      test("footnote dedup+autoReferences", () => {
        const mdStr = footnoteTest.toString({ autoReferences: true, dedupReferences: true }, (output, errors) => output);
        const to = `
footnote ref: [^1] ref again: [^1] missing: [^2] duplicate: [^3]

[^1]: A footnote

[^3]: A duplicated footnote

[^4]: http://localhost/unreferenced

    Unreferenced, but added to the document...

[^2]: A missing footnote
`;
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
    }
  }

  toStringTest(md.h`Title`.concat(md.t` `.concat`${md.b`1`}`), `\n# Title **1**\n`);
  toStringTest(md.url("http:\\\\localhost"), `<http:\\\\localhost>`);
  //!!toStringTest(md.t`${md.raw("* <html>").concat`[]`.concat("</html>")}`, `* <html>[]</html>`);
  toStringTest(md.raw("* <html>").concat`[]`.concat("</html>"), `* <html>[]</html>`);
  toStringTest(md.link("Link text", "http:\\\\localhost", "Link title"), `[Link text](http:\\\\localhost "Link title")`);
  toStringTest(
    md.p`${md.link("Reference-style link", md.linkUrl("http://localhost", "Localhost"))}`,
    `\n[Reference-style link][1]\n\n[1]: <http://localhost> "Localhost"\n`
  );
  toStringTest(md.img("Image alt", "http:\\\\localhost\\image.jpg", "Image title"), `![Image alt](http:\\\\localhost\\image.jpg "Image title")`);
  toStringTest(md.section(md.h`Title`).push(md.h`Subtitle`), `\n# Title\n\n## Subtitle\n`);

  test("dumpEscape", () => {
    const mdStr = md.p`!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`.toString({
      smartEscape: false,
    });
    const to = `\n\\!"\\#$%&'()\\*\\+,\\-\\./0123456789:;\\<=\\>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\[\\\\\\]^\\_\\\`abcdefghijklmnopqrstuvwxyz\\{\\|\\}\\~\n`;
    showDiff(mdStr, to);
    expect(mdStr).toBe(to);
  });

  toStringTest(
    md.p`Reference`.concat(md.footnote("Footnote of reference").setId("refId").ref),
    `\nReference[^refId]\n\n[^refId]: Footnote of reference\n`
  );

  toStringTest(
    md.list([md.t`item 1`, md.list([md.t`item 1.1`, md.t`item 1.2`])]).push(md.t`item 2`, md.p`paragraph`, md.t`item 3`),
    `\n- item 1\n\n    - item 1.1\n    - item 1.2\n\n- item 2\n\n    paragraph\n\n- item 3\n`
  );
  toStringTest(
    md.list([md.t`item 1`, md.list([md.t`item 1.1`, md.t`item 1.2`])]).push(md.t`item 2`, md.p`paragraph`, md.t`item 3`),
    `\n- item 1\n\n    + item 1.1\n    + item 1.2\n\n- item 2\n\n    paragraph\n\n- item 3\n`,
    { unorderedList: ["-", "+", "*"] }
  );
  toStringTest(md.hr(), `\n---\n`);
  toStringTest(md.hr(), `\n===\n`, { hr: ["---", "==="], headingLevel: 2 });
  toStringTest(md.codeblock("{\n  // comment ```` ~~~~\n  goto 10;\n}"), "\n```\n{\n  // comment ```` ~~~~\n  goto 10;\n}\n```\n");
  toStringTest(md.codeblock("{\n  ```` ~~~~\n  ").concat("goto 10;\n}").setLanguage("Basic"), "\n```Basic\n{\n  ```` ~~~~\n  goto 10;\n}\n```\n");
  toStringTest(md.codeblock("{\n  ```` \n  goto 10;\n}"), "\n`````\n{\n  ```` \n  goto 10;\n}\n`````\n");
  toStringTest(md.codeblock("{\n  ^v^v \n  goto 10;\n}"), "\n^v^v^v^v\n{\n  ^v^v \n  goto 10;\n}\n^v^v^v^v\n", { codeblock: { fence: "^v^v" } });
  toStringTest(md.blockquote("I've never said that").push(md.p`Dude`), "\n> I've never said that\n> \n> Dude\n");
  toStringTest(md.blockquote(md.t`I've never said that`).push(md.p`Dude`), "\n> I've never said that\n> \n> Dude\n");
  toStringTest(md.blockquote(md.p`I've never said that`).push(md.p`Dude`), "\n> I've never said that\n> \n> Dude\n");
  // toStringTest(md.codeblock("{\n  // comment ```` ~~~~\n  goto 10;\n}"), "\n    \n    {\n      // comment ```` ~~~~\n      goto 10;\n    }\n", {
  //   codeblock: { indent: "    " },
  // });

  //   const positiveTestStr = md
  //     .section(
  //       md.h`Title  \n alma \n  `,
  //       md.p`lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
  //        ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
  // ${md.link("Link text", "http:\\\\localhost", "Link title")}
  // ${md.link("Reference-style link", linkRef)}
  // ${md.link("Auto-added link", linkRefMissing)}
  // ${md.img("Image alt", "http:\\\\localhost\\image.jpg", "Image title")}
  // `,
  //       md.codeblock(
  //         `~~~
  // A code block example inside a code block
  // ~~~

  // some harmless quotes \`\`\`\`

  // \`\`\`js
  // // another example, in Javascript
  // for (let i=0; i<Infinity; i++) {}
  //  \`\`\``,
  //         "js"
  //       ),
  //       linkRef,
  //       md.section(
  //         md.h`Subtitle`,
  //         md.p`Text ${md.b`bold ${md.i`italic ${md.s`strikethrough ${md.sub`subscript`}${md.sup`superscript`}`}`}`}
  // ${md.code("md.h` this is a code with ````-s ending with a `")}\n
  // ${md.sup`superscript is non-standard markup`}`
  //       )
  //     )
  //     .toString();

  //   console.log(positiveTestStr);
}

testRun();
