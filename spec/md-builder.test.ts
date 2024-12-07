// https://www.markdownguide.org/basic-syntax/
// https://www.npmjs.com/package/markdown-it
// https://markdown-it.github.io/

import { expect, test } from "vitest";

import { md, MdBuilder } from "../src/index";

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
    toStringTest(md.t`# Not a heading`, "\\# Not a heading", (exp, to) => exp.toBe(to));
    toStringTest(md.t`#Not a heading either`, "\\#Not a heading either", (exp, to) => exp.toBe(to));
    toStringTest(md.t` # Not a heading either`, " \\# Not a heading either", (exp, to) => exp.toBe(to));
    toStringTest(md.t`Still not heading\n=`, "Still not heading  \n\\=", (exp, to) => exp.toBe(to));
    toStringTest(md.t`Still not heading\n====`, "Still not heading  \n\\=\\=\\==", (exp, to) => exp.toBe(to));
    toStringTest(md.t`Still not heading\n-`, "Still not heading  \n\\-", (exp, to) => exp.toBe(to));
    toStringTest(md.t`>Not a quote`, "\\>Not a quote", (exp, to) => exp.toBe(to));
    toStringTest(md.t` > No quoting`, " \\> No quoting", (exp, to) => exp.toBe(to));
    toStringTest(md.t`> > > No quoting`, "\\> \\> \\> No quoting", (exp, to) => exp.toBe(to));
    toStringTest(md.t`- Not a list`, "\\- Not a list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`-Still not a list`, "-Still not a list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`+ Not a list`, "\\+ Not a list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`+Still not a list`, "+Still not a list", (exp, to) => exp.toBe(to));
    toStringTest(md.t` +  Not a list`, " \\+  Not a list", (exp, to) => exp.toBe(to));
    toStringTest(md.t` +Not a list`, " +Not a list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`*Not list`, "\\*Not list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`* No list for old man`, "\\* No list for old man", (exp, to) => exp.toBe(to));
    toStringTest(md.t`1. Not an unordered list`, "1\\. Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`1. Not an unordered list`, "1\\. Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`  1) Not an unordered list`, " 1\\) Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`1)Not an unordered list`, "1)Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`  1. Not an unordered list`, " 1\\. Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`1.Not an unordered list`, "1.Not an unordered list", (exp, to) => exp.toBe(to));
    toStringTest(md.t`:Not a definition`, ":Not a definition", (exp, to) => exp.toBe(to));
    toStringTest(md.t`: Not a definition`, "\\: Not a definition", (exp, to) => exp.toBe(to));
    toStringTest(md.t` : Not a definition`, " \\: Not a definition", (exp, to) => exp.toBe(to));
    toStringTest(md.t`    Indented, but not code`, " Indented, but not code", (exp, to) => exp.toBe(to));
    toStringTest(md.t`	Not code, with Tab indentation`, " Not code, with Tab indentation", (exp, to) => exp.toBe(to));
    toStringTest(md.t`\`\`\``, "\\`\\`\\`", (exp, to) => exp.toBe(to));
    toStringTest(md.t`\`\`\`\` @#$%!`, "\\`\\`\\`\\` @#$%!", (exp, to) => exp.toBe(to));
    toStringTest(md.t`~~~`, "\\~\\~\\~", (exp, to) => exp.toBe(to));
    toStringTest(
      md.t`not _italic_ not **bold** not ~~strikethrough~~ not \`code\` not ~sub~ not ^super^ not ==highlight==`,
      "not \\_italic\\_ not \\*\\*bold\\*\\* not \\~\\~strikethrough\\~\\~ not \\`code\\` not \\~sub\\~ not \\^super\\^ not \\==highlight\\==",
      (exp, to) => exp.toBe(to)
    );
    toStringTest(md.t`keep_underscore _in_the_middle_`, "keep_underscore \\_in_the_middle\\_", (exp, to) => exp.toBe(to));
    toStringTest(md.t`[Not a link](http://not.a.link)`, "\\[Not a link\\](http://not.a.link)", (exp, to) => exp.toBe(to));
    toStringTest(
      md.t`![Neither a link nor an image](http://not.a.link "Not a title")`,
      `!\\[Neither a link nor an image\\](http://not.a.link "Not a title")`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(md.t`!`.concat` Doesn't look like an image...`, `! Doesn't look like an image...`, (exp, to) => exp.toBe(to));
    toStringTest(md.t`<http://not.an.url/>`, "\\<http://not.an.url/\\>", (exp, to) => exp.toBe(to));
    toStringTest(md.t`<not@an.email>`, "\\<not@an.email\\>", (exp, to) => exp.toBe(to));

    toStringTest(
      md.t`!${md.link("Link, but not an image", "http:\\localhost", "Link to localhost")}`,
      `\\![Link, but not an image](http:\\localhost "Link to localhost")`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(
      md.t`!${md.t`${md.t``}${md.t``}${md.link("Link, but not an image", "http:\\localhost")}`}`,
      `\\![Link, but not an image](http:\\localhost)`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(
      md.t`No!${md.raw`[Raw link, but not an image](http:\\localhost "Link to localhost")`}`,
      `No\\![Raw link, but not an image](http:\\localhost "Link to localhost")`,
      (exp, to) => exp.toBe(to)
    );
    toStringTest(
      md.t`
| Not      | A |  Table |
| -------- | - | -----: |
| Header   |   | Title  |
| Paragraph|   | Text   |
`,
      `\\\n| Not      | A |  Table |  \n\\| -------- | - | -----: |  \n| Header   |   | Title  |  \n| Paragraph|   | Text   |  \n`,
      (exp, to) => exp.toBe(to)
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

    toStringTest(
      md.link("A link", "http://localhost/missing", 'Localhost "missing"'),
      '[A link](http://localhost/missing "Localhost \\"missing\\"")',
      (exp, to) => exp.toBe(to),
      { smartEscape: false }
    );
    {
      const linkRef = md.linkRef("http://localhost", "Localhost");
      const linkRefDup = md.linkUrl("http://localhost/dup");
      const linkRefMissing = md.linkUrl("http://localhost/missing", 'Localhost "missing"');
      const linkRefUnreferenced = md.linkUrl("http://localhost/unreferenced", "Localhost (unreferenced)");
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

[3]: <http://localhost/dup>

[4]: <http://localhost/unreferenced> "Localhost (unreferenced)"

[2]: <http://localhost/missing> "Localhost \\"missing\\""
`;
        showDiff(mdStr, to);
        expect(mdStr).toBe(to);
      });
    }
    {
      const footnote = md.footnote(md.t`A multi`, md.p`paragraph`, "foot-note");
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

[^1]: A multi

    paragraph

    foot-note

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

  toStringTest(md.h`Title`.concat(md.t` `.concat`${md.b`1`}`), `\n# Title **1**\n`, (exp, to) => exp.toBe(to));
  toStringTest(md.url("http:\\\\localhost\\alma?chars=<[\\]>"), `<http:\\\\localhost\\alma?chars=%3C[\\]%3E>`, (exp, to) => exp.toBe(to));
  toStringTest(md.url("http:\\\\localhost\\alma?chars=<[\\]>"), `<http:\\\\localhost\\alma?chars=%3C%5B\\%5D%3E>`, (exp, to) => exp.toBe(to), {
    smartUrlEscape: false,
  });
  toStringTest(md.t`${md.raw("* <html>").concat`[]`.concat("</html>")}`, `\\* <html>[]</html>`, (exp, to) => exp.toBe(to));
  toStringTest(md.raw("* <html>").concat`[]`.concat("</html>"), `* <html>[]</html>`, (exp, to) => exp.toBe(to));
  toStringTest(md.link("Link text", "http:\\\\localhost", "Link title"), `[Link text](http:\\\\localhost "Link title")`, (exp, to) => exp.toBe(to));
  toStringTest(
    md.p`${md.link("Reference-style link", md.linkUrl("http://localhost", "Localhost"))}`,
    `\n[Reference-style link][1]\n\n[1]: <http://localhost> "Localhost"\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    md.img("Image [alt]", "http:\\\\localhost\\image.jpg", "Image title"),
    `![Image \\[alt\\]](http:\\\\localhost\\image.jpg "Image title")`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    md
      .section(md.h`Title`)
      .push(md.h`Subtitle`)
      .push(md.hN(4, md.t`H4`))
      .push(md.h1`H1`, md.h2`H2`, md.h3`H3`, md.h4`H4`, md.h5`H5`, md.h6`H6`),
    `\n# Title\n\n## Subtitle\n\n#### H4\n\n# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6\n`,
    (exp, to) => exp.toBe(to)
  );

  test("dumpEscape", () => {
    const mdStr = md.p`!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`.toString({
      smartEscape: false,
    });
    const to = `\n\\!"\\#$%&'()\\*\\+,\\-\\./0123456789\\:;\\<=\\>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\[\\\\\\]\\^\\_\\\`abcdefghijklmnopqrstuvwxyz\\{\\|\\}\\~\n`;
    showDiff(mdStr, to);
    expect(mdStr).toBe(to);
  });

  toStringTest(
    md.p`Reference`.concat(md.footnote("Footnote of reference").setId("refId").ref),
    `\nReference[^refId]\n\n[^refId]: Footnote of reference\n`,
    (exp, to) => exp.toBe(to)
  );

  toStringTest(
    md
      .list([md.t`item 1`, md.list([md.t`item 1.1`, md.t`item 1.2`])])
      .push(md.task`item 2`.setChecked(), md.p`paragraph`, md.task`item`.concat` [3]`),
    `\n- item 1\n\n    - item 1.1\n    - item 1.2\n\n- [x] item 2\n\n    paragraph\n\n- [ ] item \\[3\\]\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    md.list([md.t`item 1`, md.list([md.t`item 1.1`, md.t`item 1.2`])]).push(md.t`item 2`, md.p`paragraph`, md.t`item 3`),
    `\n- item 1\n\n    + item 1.1\n    + item 1.2\n\n- item 2\n\n    paragraph\n\n- item 3\n`,
    (exp, to) => exp.toBe(to),
    { unorderedList: ["-", "+", "*"] }
  );
  toStringTest(md.list([md.t`item 1`, md.t`item 2`]), `\n- item 1\n- item 2\n`, (exp, to) => exp.toBe(to), { unorderedList: [] });
  toStringTest(
    md.ordered([md.t`item 1`, md.orderedFrom(6, [md.t`item 1.6`, md.t`item 1.7`])]).push(md.t`item 2`, md.p`paragraph`, md.t`item 3`),
    `\n1. item 1\n\n    6. item 1.6\n    7. item 1.7\n\n2. item 2\n\n    paragraph\n\n3. item 3\n`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(md.hr(), `\n---\n`, (exp, to) => exp.toBe(to));
  toStringTest(md.hr(), `\n***\n`, (exp, to) => exp.toBe(to), { hr: ["---", "***"], headingLevel: 2 });
  toStringTest(md.hr(), `\n\n`, (exp, to) => exp.toBe(to), { hr: ["---", "***", ""], headingLevel: 3 });
  toStringTest(md.hr(), `\n---\n`, (exp, to) => exp.toBe(to), { hr: [], headingLevel: 3 });
  toStringTest(md.codeblock("{\n  // comment ```` ~~~~\n  goto 10;\n}"), "\n```\n{\n  // comment ```` ~~~~\n  goto 10;\n}\n```\n", (exp, to) =>
    exp.toBe(to)
  );
  toStringTest(
    md.codeblock("{\n  ```` ~~~~\n  ").concat("goto 10;\n}").setLanguage("Basic"),
    "\n```Basic\n{\n  ```` ~~~~\n  goto 10;\n}\n```\n",
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    md.codeblock("{\n  ```` ~~~~\n  ").concat("indented codeblock:\n  goto 10;\n}").setLanguage("Basic"),
    "\n    {\n      ```` ~~~~\n      indented codeblock:\n      goto 10;\n    }\n",
    (exp, to) => exp.toBe(to),
    { codeblock: { indent: "    " } }
  );
  toStringTest(md.codeblock("{\n  ```` \n  goto 10;\n}"), "\n`````\n{\n  ```` \n  goto 10;\n}\n`````\n", (exp, to) => exp.toBe(to));
  toStringTest(md.codeblock("{\n  ^v^v \n  goto 10;\n}"), "\n^v^v^v^v\n{\n  ^v^v \n  goto 10;\n}\n^v^v^v^v\n", (exp, to) => exp.toBe(to), {
    codeblock: { fence: "^v^v" },
  });
  toStringTest(md.code("{\n  ^v^v \n  goto 10;\n}"), "^v^v^v^v{\n ^v^v \n goto 10;\n}^v^v^v^v", (exp, to) => exp.toBe(to), { code: "^v^v" });
  toStringTest(md.blockquote`I've never said ${md.t`that`}`.push(md.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(md.blockquote(md.t`I've never said that`).push(md.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(md.blockquote(md.p`I've never said that`).push(md.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(md.blockquote(md.p`I've never said that`).push(md.p`Dude`), "\n> I've never said that\n> \n> Dude\n", (exp, to) => exp.toBe(to));
  toStringTest(
    md.p`Text ${md.b`bold ${md.i`italic ${md.s`strikethrough ${md.sub`subscript`}${md.sup`superscript`}${md.highlight`highlight`}`}`}`}`,
    "\nText **bold *italic ~~strikethrough ~subscript~^superscript^==highlight==~~***\n",
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    md.p`Text ${md.b`bold ${md.i`italic ${md.s`strikethrough ${md.sub`subscript`}${md.sup`superscript`}`}`}`}`,
    "\nText <b>bold <i>italic <s>strikethrough <sub>subscript</sub><sup>superscript</sup></s></i></b>\n",
    (exp, to) => exp.toBe(to),
    { smartEscape: false, bold: "<b>", italic: "<i>", strikethrough: "<s>", subscript: "<sub>", superscript: "<sup>" }
  );
  toStringTest(
    md.p`Text ${md.code(" this is a code with ````-s").concat(" ending with a `")}`,
    "\nText ````` this is a code with ````-s ending with a ` `````\n",
    (exp, to) => exp.toBe(to)
  );

  {
    const ExtensionTest = class extends MdBuilder.ExtensibleMd<Date, { timeZone?: string } & MdBuilder.Context> {
      protected _toString(content: Date, context: { timeZone?: string } & MdBuilder.Context): string {
        const date = new Date(content);
        return date.toLocaleString("en-US", { timeZone: context.timeZone });
      }
    };
    const emd = new ExtensionTest();
    const now = new Date();
    toStringTest(
      emd.p`now is: ${now} in Auckland`,
      "\nnow is: " + now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" }) + " in Auckland\n",
      (exp, to) => exp.toBe(to),
      { timeZone: "Pacific/Auckland" }
    );
  }
  toStringTest(
    md.p`${md.footnote`Footnote not included`.ref}`,
    "Footnote not included",
    (exp, to) => exp.toThrowError(to),
    { autoReferences: false },
    "throw"
  );
  toStringTest(md.p`Invalid type ${5 as unknown as string}`, "_toString called on Md", (exp, to) => exp.toThrowError(to), undefined, "throw");
  {
    const heading = md.h`Title`.setId("custom({id})");
    toStringTest(
      md.section(heading, md.p`Paragraph ${md.link("Title", heading)}`),
      "\n# Title {#custom(\\{id\\})}\n\nParagraph [Title](#custom\\({id}\\))\n",
      (exp, to) => exp.toBe(to)
    );
  }
  toStringTest(md.link("Title", md.h`Heading-without-id`), "Heading-without-id", (exp, to) => exp.toThrowError(to), undefined, "throw");
  toStringTest(md.definition(md.t`term`, md.t`definition of the term`), "\nterm\n: definition of the term\n", (exp, to) => exp.toBe(to));
  toStringTest(
    md.t`smart escape :smiley:smiley:SMILEY: :s :smiley smiley: :) :@ C:/ http://`,
    "smart escape \\:smiley\\:smiley:SMILEY: \\:s :smiley smiley: \\:) \\:@ C:/ http://",
    (exp, to) => exp.toBe(to)
  );
  toStringTest(md.t`${md.emoji("smiley")} ${md.emoji(":smiley:")} ${md.emoji(":*")} ${md.emoji(":)")}`, ":smiley: :smiley: :* :)", (exp, to) =>
    exp.toBe(to)
  );
  toStringTest(md.t`dumb escape :smiley: :smiley :) :@`, "dumb escape \\:smiley\\: \\:smiley \\:) \\:@", (exp, to) => exp.toBe(to), {
    smartEscape: false,
  });
  toStringTest(md.t`dont't escape :smiley: :( :) :@`, "dont't escape :smiley: :( :) :@", (exp, to) => exp.toBe(to), { escapeEmojisInText: false });
  // escaped: :$ :( :) :* :/ :@ :D :O :P :o :s :z :|
  toStringTest(
    md.t`smart smiley escape :! :" :# :$ :% :& :' :( :) :* :+ :, :- :. :/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 :: :; :< := :> :? :@ :A :B :C :D :E :F :G :H :I :J :K :L :M :N :O :P :Q :R :S :T :U :V :W :X :Y :Z :[ :\ :\ :] :^ :_ :\\ :\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n :o :p :q :r :s :t :u :v :w :x :y :z :{ :| :} :~`,
    `smart smiley escape :! :" :# \\:$ :% :& :' \\:( \\:) :\\* :+ :, :- :. \\:/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 :: :; :\\< := :\\> :? \\:@ :A :B :C \\:D :E :F :G :H :I :J :K :L :M :N \\:O \\:P :Q :R :S :T :U :V :W :X :Y :Z :\\[ :\ :\ :\\] :\\^ :\\_ :\\\\ :\\\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n \\:o :p :q :r \\:s :t :u :v :w :x :y \\:z :\\{ \\:| :\\} :\\~`,
    (exp, to) => exp.toBe(to)
  );
  toStringTest(
    md.t`allSpecChars smiley escape :! :" :# :$ :% :& :' :( :) :* :+ :, :- :. :/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 :: :; :< := :> :? :@ :A :B :C :D :E :F :G :H :I :J :K :L :M :N :O :P :Q :R :S :T :U :V :W :X :Y :Z :[ :\ :\ :] :^ :_ :\\ :\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n :o :p :q :r :s :t :u :v :w :x :y :z :{ :| :} :~`,
    `allSpecChars smiley escape \\:! \\:" \\:# \\:$ \\:% \\:& \\:' \\:( \\:) \\:\\* \\:+ \\:, \\:- \\:. \\:/ :0 :1 :2 :3 :4 :5 :6 :7 :8 :9 \\:: \\:; \\:\\< \\:= \\:\\> \\:? \\:@ :A :B :C \\:D :E :F :G :H :I :J :K :L :M :N \\:O \\:P :Q :R :S :T :U :V :W :X :Y :Z \\:\\[ \\:\ \\:\ \\:\\] \\:\\^ \\:\\_ \\:\\\\ \\:\\\` :a :b :c :d :e :f :g :h :i :j :k :l :m :n \\:o :p :q :r \\:s :t :u :v :w :x :y \\:z \\:\\{ \\:| \\:\\} \\:\\~`,
    (exp, to) => exp.toBe(to),
    { escapeEmojisInText: "allSpecChars" }
  );
  {
    const table = md.table(
      [md.t`header 1`, md.th`header 2`.setAlign(MdBuilder.CENTER), md.th`header |3|`.setAlign(MdBuilder.RIGHT)],
      [md.t`cell 1`, md.t`cell 2`, md.t`cell |3|`],
      md.tr(`cell 4`, md.t`cell 5`, md.t`cell |6|`)
    );
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
      header.push(md.th`header ${i + 1 + " ".padEnd(3 + i * 8, "+")}`.setAlign(i === 0 ? MdBuilder.LEFT : MdBuilder.CENTER));
    }
    const rows = [];
    for (let r = 0; r < nRows; r++) {
      const row = [];
      for (let c = 0; c < nColumns; c++) {
        row.push(md.t`cell ${r + 1 + ""}.${c + 1 + ""}`);
      }
      rows.push(row);
    }
    const table = md.table(header, ...rows);
    toStringTest(
      table,
      "\n| header 1 ++ | header 2 ++++++++++ | header 3 ++++++++++++++++++ |\n" +
        "| :---------- | :-----------------: | :------------------: |\n" +
        "| cell 1.1    |      cell 1.2       |       cell 1.3       |\n" +
        "| cell 2.1    |      cell 2.2       |       cell 2.3       |\n",
      (exp, to) => exp.toBe(to)
    );
  }
  test("Markdown outputs", () => {
    console.log(testOutpus.join("\n\n"));
  });
}

testRun();
