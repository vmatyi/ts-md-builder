// https://www.markdownguide.org/basic-syntax/
// https://www.npmjs.com/package/markdown-it
// https://markdown-it.github.io/

import { md } from "../src/index";

function testRun() {
  const escapeTestStr = md.p`
# Not a heading
#Not a heading either
 # Not a heading either

Still not heading
=

Still not heading
====

Still not heading
----

Still not heading
-

>Not a quote
 > No quoting
> > > No quoting

- Not a list
-Still not a list

+ Not a list
+Still not a list
 +  Not a list
 +Not a list

*Not list
* No list for old man

1. Not an unordered list
1. Not an unordered list
  1) Not an unordered list
1)Not an unordered list

  1. Not an unordered list
1.Not an unordered list

    Indented, but not code

	Not code, with Tab indentation

\`\`\`
not a fenced code
\`\`\`

\`\`\`\` @#$%^!
not a fenced code,
\`\`\`\`

~~~
still not a fenced code
~~~


not _italic_ not **bold** not ~~strikethrough~~ not \`code\`

[Not a link](http://not.a.link)
![Neither a link nor an image](http://not.a.link "Not a title")

<http://not.an.url/>
<not@an.email>

!${md.link("Link, but not an image", "http:\\localhost", "Link to localhost")}
!${md.t`${md.t``}${md.t``}${md.link("Link, but not an image", "http:\\localhost", "Link to localhost")}`}
No!${md.raw`[Link, but not an image](http:\\localhost "Link to localhost")`}

| Not      | A |  Table |
| -------- | - | -----: |
| Header   |   | Title  |
| Paragraph|   | Text   |
`.toString();

  const linkRef = md.linkRef("http://localhost", "Localhost");
  const linkRefDup = md.linkRef("http://localhost/dup", "Localhost dup");
  const linkRefMissing = md.linkRef(
    "http://localhost/missing-missing-a-long-long-long-long-long-long-long-long-long-long-long-long-link-link-link-link-link-link-link-link-link-link",
    "Localhost missing"
  );
  const linkRefUnreferenced = md.linkRef("http://localhost/unreferenced", "Localhost unreferenced");
  const linkErrorStr = md
    .section(
      md.h`Title  \n alma \n  `,
      md.p`linkRef: ${md.link("linkRef", linkRef)} linkRef again: ${md.link("linkRef", linkRef)} missing: ${md.link(
        "linkRefMissing",
        linkRefMissing
      )} dpulicate: ${md.link("linkRefDup", linkRefDup)}`,
      linkRef,
      linkRefDup,
      linkRefDup,
      linkRefUnreferenced
    )
    .toString(undefined, (output, errors) => {
      return output + "\n\n" + JSON.stringify(errors, null, 2);
    });

  console.log(linkErrorStr);

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

  console.log("===============\n", escapeTestStr.replace(/\n/g, "<\n"));
  console.log(escapeTestStr);
  console.log(positiveTestStr);
}

testRun();
