# ts-md-builder

Typescript Markdown Builder with template string support, minimal size, no external dependencies.

```
npm install ts-md-builder
```

Sample usage:
```js
import md from "ts-md-builder";

const sampleMarkdown = md.section(
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

console.log(sampleMarkdown.toString());
```

Output:

> # Main section header
> 
> The first parameter of a section is a header (or you can pass null if you don't want a header).  
> This section has no parent, and heading level was not specified, thus will become *Heading 1*
> 
> The section can contain any number of block-type elements, like this paragraph...
> 
> - a list
> 
> - with sub-lists
> 
>     and sub-paragraphs
> - with some **formatted *text*** ~~or~~and more
> 
> 
> ````js
> // a code block...
> for (let i=0; i<Infinity; i+=2) {}
> ````
> 
> > a block quote...
> 
> ## or a sub-section with automatic heading level
> 
> A sub section will inherit the heading level from it's parent section by deafult
> 
> #### or a sub-section with manual level, e.g. Heading 4
> 
> using `` md.h4`...title...` ``
>

Or a procedural approach for more dynamic content:
```js
import md from "ts-md-builder";

const sampleMarkdown2 = md.section(md.h`Dynamic content`);
sampleMarkdown2.push(
  md.p`You can dynamically build your content using `.concat(
    md.code`.push(...)`,
    md.t` on ${md.b`BlockElements`} and `,
    md.code(`.concat\`...\``),
    md.t` on ${md.b`InlineElements`}`
  )
);
{
  const sampleList = md.list();
  sampleMarkdown2.push(sampleList);
  for (let i = 1; i <= 3; i++) {
    const item = md.t`list item ${md.b`${"" + i}`}`;
    sampleList.push(item);
    for (let j = 1; j <= i; j++) item.concat` *`; // set @typescript-eslint/no-unused-expressions { "allowTaggedTemplates": true } to avoid a false positive: https://github.com/eslint/eslint/issues/8268
  }
}

console.log(sampleMarkdown2.toString());
```

> # Dynamic content
> 
> You can dynamically build your content using ``.push(...)`` on **BlockElements** and ``.concat`...` `` on **InlineElements**
> 
> - list item **1** \*
> - list item **2** \* \*
> - list item **3** \* \* \*
> 
> 
> ````js
> // a code block...
> for (let i=0; i<Infinity; i+=2) {}
> ````
> 
