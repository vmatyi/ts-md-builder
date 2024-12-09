// https://www.markdownguide.org/basic-syntax/
// https://www.npmjs.com/package/markdown-it
// https://markdown-it.github.io/

import { expect, test } from "vitest";

import { mdb, MdBuilder } from "../src/index";

function showDiff(a: string, b: string) {
  // Vitest is not very good at comparing whitespaces at line ends...
  const wrap = (s: string) => "👉" + s.replace(/\n/g, "👈\n👉") + "👈";
  if (a !== b) console.log(wrap(a) + "\n---------------\n" + wrap(b));
}

const testOutpus: string[] = [];
function toStringTest<C extends MdBuilder.Context>(
  from: MdBuilder.Element<C>,
  to: string,
  toBe: (exp: ReturnType<typeof expect<string>>, to: string) => void,
  options?: MdBuilder.Context extends C ? MdBuilder.ToStringOptions<C> | undefined : MdBuilder.ToStringOptions<C>,
  onErrors?: MdBuilder.ErrorHandler<never> | "throw"
) {
  test(
    "toStringTest: " +
      (onErrors === "throw" ? "expect to throw: " : "") +
      MdBuilder.trimLength(to.trim(), 100).replace(/\t/g, "⇥").replace(/\n/g, "↵"),
    () => {
      if (onErrors === "throw") {
        toBe(
          expect(() => from.toString(options ?? ({} as MdBuilder.ToStringOptions<C>))),
          to
        );
      } else {
        const mdStr = from.toString(
          options ?? ({} as MdBuilder.ToStringOptions<C>),
          onErrors ?? ((output, errors) => output + "\\\\ errors:" + errors.map((error) => error.errorType).join(","))
        );
        showDiff(mdStr, to);
        testOutpus.push(mdStr);
        return toBe(expect(mdStr), to);
      }
    }
  );
}

function testRun() {
  if (true) {
    toStringTest(mdb.t`# Not a heading`, "\\# Not a heading", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`#Not a heading either`, "\\#Not a heading either", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t` # Not a heading either`, " \\# Not a heading either", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`Still not heading\n=`, "Still not heading  \n\\=", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`Still not heading\n====`, "Still not heading  \n\\=\\=\\==", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`Still not heading\n-`, "Still not heading  \n\\-", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`>Not a quote`, "\\>Not a quote", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t` > No quoting`, " \\> No quoting", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`> > > No quoting`, "\\> \\> \\> No quoting", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`- Not a list`, "\\- Not a list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`-Still not a list`, "-Still not a list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`+ Not a list`, "\\+ Not a list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`+Still not a list`, "+Still not a list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t` +  Not a list`, " \\+  Not a list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t` +Not a list`, " +Not a list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`*Not list`, "\\*Not list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`* No list for old man`, "\\* No list for old man", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`1. Not an unordered list`, "1\\. Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`1. Not an unordered list`, "1\\. Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`  1) Not an unordered list`, " 1\\) Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`1)Not an unordered list`, "1)Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`  1. Not an unordered list`, " 1\\. Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`1.Not an unordered list`, "1.Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`:Not a definition`, ":Not a definition", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`: Not a definition`, "\\: Not a definition", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t` : Not a definition`, " \\: Not a definition", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`    Indented, but not code`, " Indented, but not code", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`	Not code, with Tab indentation`, " Not code, with Tab indentation", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`\`\`\``, "\\`\\`\\`", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`\`\`\`\` @#$%!`, "\\`\\`\\`\\` @#$%!", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`~~~`, "\\~\\~\\~", (exp, to) => exp.toBe(to));
    toStringTest(
      mdb.t`not _italic_ not **bold** not ~~strikethrough~~ not \`code\` not ~sub~ not ^super^ not ==highlight==`,
      "not \\_italic\\_ not \\*\\*bold\\*\\* not \\~\\~strikethrough\\~\\~ not \\`code\\` not \\~sub\\~ not \\^super\\^ not \\==highlight\\==",
      (exp, to) => exp.toBe(to)
    );
    toStringTest(mdb.t`keep_underscore _in_the_middle_`, "keep_underscore \\_in_the_middle\\_", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`[Not a link](http://not.a.link)`, "\\[Not a link\\](http://not.a.link)", (exp, to) => exp.toBe(to));
    toStringTest(
      mdb.t`![Neither a link nor an image](http://not.a.link "Not a title")`,
      `!\\[Neither a link nor an image\\](http://not.a.link "Not a title")`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(mdb.t`!`.concat` Doesn't look like an image...`, `! Doesn't look like an image...`, (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`<http://not.an.url/>`, "\\<http://not.an.url/\\>", (exp, to) => exp.toBe(to));
    toStringTest(mdb.t`<not@an.email>`, "\\<not@an.email\\>", (exp, to) => exp.toBe(to));

    toStringTest(
      mdb.t`!${mdb.link("Link, but not an image", "http:\\localhost", "Link to localhost")}`,
      `\\![Link, but not an image](http:\\localhost "Link to localhost")`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(
      mdb.t`!${mdb.t`${mdb.t``}${mdb.t``}${mdb.link("Link, but not an image", "http:\\localhost")}`}`,
      `\\![Link, but not an image](http:\\localhost)`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(
      mdb.t`No!${mdb.raw`[Raw link, but not an image](http:\\localhost "Link to localhost")`}`,
      `No\\![Raw link, but not an image](http:\\localhost "Link to localhost")`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(
      mdb.t`
| Not      | A |  Table |
| -------- | - | -----: |
| Header   |   | Title  |
| Paragraph|   | Text   |
`,
      `\\\n| Not      | A |  Table |  \n\\| -------- | - | -----: |  \n| Header   |   | Title  |  \n| Paragraph|   | Text   |  \n`,
      (exp, to) => exp.toBe(to)
    );

    const linkRefLong = mdb.linkUrl(
      "http://localhost/missing-missing-a-long-long-long-long-long-long-long-long-long-long-long-long-link-link-link-link-link-link-link-link-link-link",
      "Localhost missing"
    );
    test("long element description", () => {
      const mdStr = linkRefLong._describe(MdBuilder.getDefaultContext());
      const to = `[1]: <http://localhost/missing-missing-a-long-long-long-long-long-long-long-long-long-long-long-long-link-link-link-link-link-link-link-link-link-link> "Localh…`;
      showDiff(mdStr, to);
      expect(mdStr).toBe(to);
    });

    toStringTest(
      mdb.link("A link", "http://localhost/missing", 'Localhost "missing"'),
      '[A link](http://localhost/missing "Localhost \\"missing\\"")',
      (exp, to) => exp.toBe(to),
      { smartEscape: false }
    );
    {
      const linkRef = mdb.linkRef("http://localhost", "Localhost");
      const linkRefDup = mdb.linkUrl("http://localhost/dup");
      const linkRefMissing = mdb.linkUrl("http://localhost/missing", 'Localhost "missing"');
      const linkRefUnreferenced = mdb.linkUrl("http://localhost/unreferenced", "Localhost (unreferenced)");
      const linkReferenceTest = mdb.section(
        null,
        mdb.p`linkRef: ${mdb.link("linkRef", linkRef)} linkRef again: ${mdb.link("linkRef", linkRef)} missing: ${mdb.link(
          "linkRefMissing",
          linkRefMissing
        )} duplicate: ${mdb.link("linkRefDup", linkRefDup)}`,
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

[3]: <http://localhost/dup>

[4]: <http://localhost/unreferenced> "Localhost (unreferenced)"

[2]: <http://localhost/missing> "Localhost \\"missing\\""
`;
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
    }
    {
      const footnote = mdb.footnote(mdb.t`A multi`, mdb.p`paragraph`, "foot-note");
      const footnoteDup = mdb.footnote(mdb.p`A duplicated footnote`);
      const footnoteMissing = mdb.footnote`A missing footnote`;
      const footnoteUnreferenced = mdb.footnote("Unreferenced").push(mdb.p`but added to the document...`);
      const footnoteTest = mdb.section(
        null,
        mdb.p`footnote ref: ${footnote.ref} ref again: ${footnote.ref} missing: ${footnoteMissing.ref} duplicate: ${footnoteDup.ref}`,
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

[^1]: A multi

    paragraph

    foot-note

[^3]: A duplicated footnote

[^4]: Unreferenced

    but added to the document...

[^2]: A missing footnote
`;
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
    }
  }

  toStringTest(mdb.h`Title`.concat(mdb.t` `.concat`${mdb.b`1`}`), `\n# Title **1**\n`, (exp, to) => exp.toBe(to));
  toStringTest(mdb.url("http:\\\\localhost\\alma?chars=<[\\]>"), `<http:\\\\localhost\\alma?chars=%3C[\\]%3E>`, (exp, to) => exp.toBe(to));
  toStringTest(mdb.url("http:\\\\localhost\\alma?chars=<[\\]>"), `<http:\\\\localhost\\alma?chars=%3C%5B\\%5D%3E>`, (exp, to) => exp.toBe(to), {
    smartUrlEscape: false,
  });
  toStringTest(mdb.t`${mdb.raw("* <html>").concat`[]`.concat("</html>")}`, `\\* <html>[]</html>`, (exp, to) => exp.toBe(to));
  toStringTest(
    mdb.blockquote(mdb.raw("* <html>").concat`[]`, "some Array[]", mdb.raw`</html>`),
    `\n> * <html>[]\n> \n> some Array\\[\\]\n> \n> </html>\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(mdb.link("Link text", "http:\\\\localhost", "Link title"), `[Link text](http:\\\\localhost "Link title")`, (exp, to) => exp.toBe(to));
  toStringTest(
    mdb.p`${mdb.link("Reference-style link", mdb.linkUrl("http://localhost", "Localhost"))}`,
    `\n[Reference-style link][1]\n\n[1]: <http://localhost> "Localhost"\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    mdb.img("Image [alt]", "http:\\\\localhost\\image.jpg", "Image title"),
    `![Image \\[alt\\]](http:\\\\localhost\\image.jpg "Image title")`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    mdb
      .section(mdb.h`Title ${"1"}`)
      .push(mdb.h`Subtitle`)
      .push(mdb.hN(4, mdb.t`H4a`), mdb.hN(4, `H4b`))
      .push(mdb.h1`H1`, mdb.h2(`H2`), mdb.h3`H3`, mdb.h4`H4`, mdb.h5`H5`, mdb.h6`H6`, mdb.h`H7`.setLevel(7)),
    `\n# Title 1\n\n## Subtitle\n\n#### H4a\n\n#### H4b\n\n# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6\n\n####### H7\n`,
    (exp, to) => exp.toBe(to)
  );

  test("dumpEscape", () => {
    const mdStr = mdb.p`!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`.toString({
      smartEscape: false,
    });
    const to = `\n\\!"\\#$%&'()\\*\\+,\\-\\./0123456789\\:;\\<=\\>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\[\\\\\\]\\^\\_\\\`abcdefghijklmnopqrstuvwxyz\\{\\|\\}\\~\n`;
    showDiff(mdStr, to);
    expect(mdStr).toBe(to);
  });

  test("noEscape", () => {
    const mdStr = mdb.p`!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`.toString({
      smartEscape: "noEscape",
    });
    const to = `\n!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~\n`;
    showDiff(mdStr, to);
    expect(mdStr).toBe(to);
  });

  toStringTest(
    mdb.section(
      mdb.h`Title`,
      mdb.p`Plain text toString ${mdb.b`bold ${mdb.i`italic ${mdb.s`strikethrough ${mdb.sub`subscript`} ${mdb.sup`superscript`} ${mdb.highlight`highlight`}`}`}`}`,
      mdb.list([mdb.t`item 1`, mdb.t`item 2`]),
      mdb.codeblock("void main() { return 0; }").setLanguage("C")
    ),
    "\n# Title\n\nPlain text toString bold italic strikethrough subscript superscript highlight\n\n- item 1\n- item 2\n\n    void main() { return 0; }\n",
    (exp, to) => exp.toBe(to),
    MdBuilder.noFormattingNoEscapeOptions
  );

  toStringTest(
    mdb.p`Reference`.concat(mdb.footnote("Footnote of reference").setId("refId").ref),
    `\nReference[^refId]\n\n[^refId]: Footnote of reference\n`,
    (exp, to) => exp.toBe(to)
  );

  toStringTest(
    mdb
      .list(mdb.t`item 1`, mdb.list(mdb.t`item 1.1`, mdb.t`item 1.2`))
      .push(mdb.task`item 2`.setChecked(), mdb.p`paragraph`, mdb.task`item`.concat` [3]`),
    `\n- item 1\n\n    - item 1.1\n    - item 1.2\n\n- [x] item 2\n\n    paragraph\n\n- [ ] item \\[3\\]\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    mdb.list([mdb.t`item 1`, mdb.list([mdb.t`item 1.1`, mdb.t`item 1.2`])]).push(mdb.t`item 2`, mdb.p`paragraph`, mdb.t`item 3`),
    `\n- item 1\n\n    + item 1.1\n    + item 1.2\n\n- item 2\n\n    paragraph\n\n- item 3\n`,
    (exp, to) => exp.toBe(to),
    { unorderedList: ["-", "+", "*"] }
  );
  toStringTest(mdb.list([mdb.t`item 1`, mdb.t`item 2`]), `\n- item 1\n- item 2\n`, (exp, to) => exp.toBe(to), { unorderedList: [] });
  toStringTest(
    mdb
      .ordered([mdb.t`item 1`, mdb.orderedFrom(6, [mdb.t`item 1.6`, mdb.t`item 1.7`])])
      .push(mdb.t`item 2`, mdb.p`paragraph`, mdb.list([mdb.t`item 2.1`, mdb.t`item 2.2`]).setOrdered(1)),
    `\n1. item 1\n\n    6. item 1.6\n    7. item 1.7\n\n2. item 2\n\n    paragraph\n\n    1. item 2.1\n    2. item 2.2\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    mdb.ordered(mdb.t`item 1`, mdb.orderedFrom(6, mdb.t`item 1.6`, mdb.t`item 1.7`)),
    `\n1. item 1\n\n    6. item 1.6\n    7. item 1.7\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(mdb.hr(), `\n---\n`, (exp, to) => exp.toBe(to));
  toStringTest(mdb.hr(), `\n***\n`, (exp, to) => exp.toBe(to), { hr: ["---", "***"], headingLevel: 2 });
  toStringTest(mdb.hr(), `\n\n`, (exp, to) => exp.toBe(to), { hr: ["---", "***", ""], headingLevel: 3 });
  toStringTest(mdb.hr(), `\n---\n`, (exp, to) => exp.toBe(to), { hr: [], headingLevel: 3 });
  toStringTest(mdb.codeblock("{\n  // comment ```` ~~~~\n  goto 10;\n}"), "\n```\n{\n  // comment ```` ~~~~\n  goto 10;\n}\n```\n", (exp, to) =>
    exp.toBe(to)
  );
  toStringTest(mdb.codeblock("{\n  ```` ~~~~\n  ", "Basic").concat("goto 10;\n}"), "\n```Basic\n{\n  ```` ~~~~\n  goto 10;\n}\n```\n", (exp, to) =>
    exp.toBe(to)
  );
  toStringTest(
    mdb.codeblock("{\n  ```` ~~~~\n  ").concat("indented codeblock:\n  goto 10;\n}").setLanguage("Basic"),
    "\n    {\n      ```` ~~~~\n      indented codeblock:\n      goto 10;\n    }\n",
    (exp, to) => exp.toBe(to),
    { codeblock: { indent: "    " } }
  );
  toStringTest(mdb.codeblock("{\n  ```` \n  goto 10;\n}"), "\n`````\n{\n  ```` \n  goto 10;\n}\n`````\n", (exp, to) => exp.toBe(to));
  toStringTest(mdb.codeblock`{\n  ^v^v \n  goto 10;\n}`, "\n^v^v^v^v\n{\n  ^v^v \n  goto 10;\n}\n^v^v^v^v\n", (exp, to) => exp.toBe(to), {
    codeblock: { fence: "^v^v" },
  });
  toStringTest(mdb.code("{\n  ^v^v \n  goto 10;\n}"), "^v^v^v^v{\n ^v^v \n goto 10;\n}^v^v^v^v", (exp, to) => exp.toBe(to), { code: "^v^v" });
  toStringTest(mdb.blockquote`I've never said ${mdb.t`that`}`.push(mdb.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(mdb.blockquote(mdb.t`I've never said that`).push(mdb.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(mdb.blockquote(mdb.p`I've never said that`).push(mdb.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(mdb.blockquote(mdb.p`I've never said that`).push(mdb.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(
    mdb.p`Text ${mdb.b`bold ${mdb.i`italic ${mdb.s`strikethrough ${mdb.sub`subscript`} ${mdb.sup`superscript`} ${mdb.highlight`highlight`}`}`}`}`,
    "\nText **bold *italic ~~strikethrough ~subscript~ ^superscript^ ==highlight==~~***\n",
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    mdb.p`Text ${mdb.b`bold ${mdb.i`italic ${mdb.s`strikethrough ${mdb.sub`subscript`} ${mdb.sup`superscript`}`}`}`}`,
    "\nText <b>bold <i>italic <s>strikethrough <sub>subscript</sub> <sup>superscript</sup></s></i></b>\n",
    (exp, to) => exp.toBe(to),
    { smartEscape: false, bold: "<b>", italic: "<i>", strikethrough: "<s>", subscript: "<sub>", superscript: "<sup>" }
  );
  toStringTest(
    mdb.p`Text ${mdb.code(" this is a code with ````-s").concat(" ending with a `")}`,
    "\nText ````` this is a code with ````-s ending with a ` `````\n",
    (exp, to) => exp.toBe(to)
  );

  {
    const ExtensionTest = class extends MdBuilder.ExtensibleMd<Date, { locales?: string; timeZone?: string } & MdBuilder.Context> {
      protected _toString(content: Date, context: { locales: string; timeZone?: string } & MdBuilder.Context): string {
        const date = new Date(content);
        return date.toLocaleString(context.locales, { timeZone: context.timeZone });
      }
    };
    const emd = new ExtensionTest();
    const now = new Date();
    toStringTest(
      emd.p`now is: ${now} ${emd.raw`in Auckland`}`,
      "\nnow is: " + now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" }) + " in Auckland\n",
      (exp, to) => exp.toBe(to),
      { locales: "en-US", timeZone: "Pacific/Auckland" }
    );
    toStringTest(emd.raw`It is ${now} here`, "It is " + now.toLocaleString() + " here", (exp, to) => exp.toBe(to));
  }
  toStringTest(
    mdb.p`${mdb.footnote`Footnote not included`.ref}`,
    "Footnote not included",
    (exp, to) => exp.toThrowError(to),
    { autoReferences: false },
    "throw"
  );
  toStringTest(mdb.p`Invalid type ${null as unknown as string}`, "_toString called on Md", (exp, to) => exp.toThrowError(to), undefined, "throw");
  {
    const heading = mdb.h`Title`.setId("custom({id})");
    toStringTest(
      mdb.section(heading, mdb.p`Paragraph ${mdb.link("Title", heading)}`),
      "\n# Title {#custom(\\{id\\})}\n\nParagraph [Title](#custom\\({id}\\))\n",
      (exp, to) => exp.toBe(to)
    );
  }
  toStringTest(mdb.link("Title", mdb.h`Heading-without-id`), "Heading-without-id", (exp, to) => exp.toThrowError(to), undefined, "throw");
  toStringTest(mdb.definition(mdb.t`term`, mdb.t`definition of the term`), "\nterm\n: definition of the term\n", (exp, to) => exp.toBe(to));
  toStringTest(
    mdb.t`smart escape :smiley:smiley:SMILEY: :s :smiley smiley: :) :@ C:/ http://`,
    "smart escape \\:smiley\\:smiley:SMILEY: \\:s :smiley smiley: \\:) \\:@ C:/ http://",
    (exp, to) => exp.toBe(to)
  );
  toStringTest(mdb.t`${mdb.emoji("smiley")} ${mdb.emoji`:smiley:`} ${mdb.emoji(":*")} ${mdb.emoji(":)")}`, ":smiley: :smiley: :* :)", (exp, to) =>
    exp.toBe(to)
  );
  toStringTest(mdb.t`dumb escape :smiley: :smiley :) :@`, "dumb escape \\:smiley\\: \\:smiley \\:) \\:@", (exp, to) => exp.toBe(to), {
    smartEscape: false,
  });
  toStringTest(mdb.t`dont't escape :smiley: :( :) :@`, "dont't escape :smiley: :( :) :@", (exp, to) => exp.toBe(to), { escapeEmojisInText: false });
  // escaped: :$ :( :) :* :/ :@ :D :O :P :o :s :z :|
  toStringTest(
    mdb.t`smart smiley escape :! :" :# :$ :% :& :' :( :) :* :+ :, :- :. :/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 :: :; :< := :> :? :@ :A :B :C :D :E :F :G :H :I :J :K :L :M :N :O :P :Q :R :S :T :U :V :W :X :Y :Z :[ :\ :\ :] :^ :_ :\\ :\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n :o :p :q :r :s :t :u :v :w :x :y :z :{ :| :} :~`,
    `smart smiley escape :! :" :# \\:$ :% :& :' \\:( \\:) :\\* :+ :, :- :. \\:/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 :: :; :\\< := :\\> :? \\:@ :A :B :C \\:D :E :F :G :H :I :J :K :L :M :N \\:O \\:P :Q :R :S :T :U :V :W :X :Y :Z :\\[ :\ :\ :\\] :\\^ :\\_ :\\\\ :\\\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n \\:o :p :q :r \\:s :t :u :v :w :x :y \\:z :\\{ \\:| :\\} :\\~`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    mdb.t`allSpecChars smiley escape :! :" :# :$ :% :& :' :( :) :* :+ :, :- :. :/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 :: :; :< := :> :? :@ :A :B :C :D :E :F :G :H :I :J :K :L :M :N :O :P :Q :R :S :T :U :V :W :X :Y :Z :[ :\ :\ :] :^ :_ :\\ :\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n :o :p :q :r :s :t :u :v :w :x :y :z :{ :| :} :~`,
    `allSpecChars smiley escape \\:! \\:" \\:# \\:$ \\:% \\:& \\:' \\:( \\:) \\:\\* \\:+ \\:, \\:- \\:. \\:/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 \\:: \\:; \\:\\< \\:= \\:\\> \\:? \\:@ :A :B :C \\:D :E :F :G :H :I :J :K :L :M :N \\:O \\:P :Q :R :S :T :U :V :W :X :Y :Z \\:\\[ \\:\ \\:\ \\:\\] \\:\\^ \\:\\_ \\:\\\\ \\:\\\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n \\:o :p :q :r \\:s :t :u :v :w :x :y \\:z \\:\\{ \\:| \\:\\} \\:\\~`,
    (exp, to) => exp.toBe(to),
    { escapeEmojisInText: "allSpecChars" }
  );
  {
    const table = mdb
      .table(
        [mdb.t`header 1`, mdb.th(`header 2`).setAlign(MdBuilder.CENTER), mdb.th`header |3|`.setAlign(MdBuilder.RIGHT)],
        [mdb.t`cell 1`, mdb.t`cell 2`, mdb.t`cell |3|`]
      )
      .push(mdb.tr(`cell 4`, mdb.t`cell 5`).push(mdb.t`cell |6|`));
    toStringTest(
      table,
      "\n| header 1 | header 2 | header \\|3\\| |\n" +
        "| -------- | :------: | -----------: |\n" +
        "| cell 1   |  cell 2  |   cell \\|3\\| |\n" +
        "| cell 4   |  cell 5  |   cell \\|6\\| |\n",
      (exp, to) => exp.toBe(to)
    );
  }
  {
    const nColumns = 3;
    const nRows = 2;
    const header = [];
    for (let i = 0; i < nColumns; i++) {
      header.push(mdb.th`header `.concat`${i + 1}${" ".padEnd(3 + i * 8, "+")}`.setAlign(i === 0 ? MdBuilder.LEFT : MdBuilder.CENTER));
    }
    const rows = [];
    for (let r = 0; r < nRows; r++) {
      const row = [];
      for (let c = 0; c < nColumns; c++) {
        row.push(mdb.t`cell ${r + 1 + ""}.${c + 1 + ""}`);
      }
      if (r === 0) rows.push(row);
      else rows.push(mdb.tr(...row));
    }
    const table = mdb.table(header, ...rows);
    const tableResult =
      "\n| header 1 ++ | header 2 ++++++++++ | header 3 ++++++++++++++++++ |\n" +
      "| :---------- | :-----------------: | :------------------: |\n" +
      "| cell 1.1    |      cell 1.2       |       cell 1.3       |\n" +
      "| cell 2.1    |      cell 2.2       |       cell 2.3       |\n";
    toStringTest(table, tableResult, (exp, to) => exp.toBe(to));
    toStringTest(mdb.table(header).push(...rows), tableResult, (exp, to) => exp.toBe(to));
  }
  test("Markdown outputs", () => {
    console.log(testOutpus.join("\n\n"));
  });
}

testRun();
