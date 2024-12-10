
# ts-md-builder

Typescript Markdown Builder with template literals support, minimal size, no external dependencies

## Features

- Support for all common and extended Markdown elements
- Reference validation for links and footnotes
- Smart escaping to keep \\-ing at minimum
- Customizable formatting options
- Type-safe interface
- Extendable builder API: add your own types to the template literals

## Installation

```bash
npm install ts-md-builder
```

## Basic Usage

```typescript
import { md } from "ts-md-builder";

const basicMarkdown = md.section(
  md.h`My Document`,
  md.p`Here is a paragraph with ${md.b`bold`} and ${md.i`italic`} text.`,
  md.list(
    md.t`List item 1`,
    md.t`List item 2`,
  ),
  md.blockquote`Quoted text`
);

console.log(basicMarkdown)
```

> ## My Document
> 
> Here is a paragraph with **bold** and *italic* text.
> 
> - List item 1
> - List item 2
> 
> > Quoted text

## Lists

```typescript
import { md } from "ts-md-builder";

const listMarkdown = md.list(
  md.t`Item ${md.b`1`}`,
  md.list(
    md.t`Nested item ${md.i`1.1`}`,
    md.t`Nested item ${md.i`1.2`}`,
    md.ordered(
      md.t`Nested ordered item 1`,
      md.t`Nested ordered item 2`,
    ),
  ),
  md.t`Item ${md.b`2`}`,
);
```

> 
> - Item **1**
> 
>     - Nested item *1.1*
>     - Nested item *1.2*
>     
>         1. Nested ordered item 1
>         2. Nested ordered item 2
> 
> - Item **2**
> 

## Tables

```typescript
import { md } from "ts-md-builder";

const tableMarkdown = md.table(
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
```

> 
> | Header 1 | Header 2 | Header 3 |
> | -------- | :------: | -------: |
> | Row 1    | cell.1.2 | **data** |
> | Row 2    | cell.2.2 | link to [localhost](http://localhost "Localhost") |
> 

## Structure aware sections

```typescript
import { md } from "ts-md-builder";

const structureAwareMarkdown = md.section(
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
```

> 
> # Main section header
> 
> The first parameter of a section is a header (or you can pass null if you don't want a header).This section has no parent, and heading level was not specified, thus will become *Heading 1*
> 
> The section can contain any number of block-type elements, like this paragraph...
> 
> - a list
> 
>     - with sub-lists
>     
>         and sub-paragraphs
> 
> - with some **formatted *text*** ~~or~~ and more
> 
> ```js
> // a code block...
> for (let i=0; i<Infinity; i+=2) {}
> ```
> 
> > a block quote...
> 
> ## or a sub-section with automatic heading level
> 
> A sub section will inherit the heading level from it's parent section by deafult
> 
> #### or a sub-section with manually set level, e.g. Heading 4
> 
> using `` md.h4`...title...` ``
> 

## Dynamic building

```typescript
import { mdb } from "ts-md-builder";

const dynamicMarkdown = mdb.section(mdb.h("Dynamic content"));
dynamicMarkdown.push(
  mdb.p("You can dynamically build your content using ").concat(
    mdb.code(".concat(...)"),
    mdb.t(" on paragraphs and inline elements."),
    mdb.code`.push(...)`,
    mdb.t` on block contrainers (sectiions, lists, tables, footnotes, blockquotes) and `,
  ),
  mdb.p`You can use the usual ${mdb.code("md")} or the ${mdb.code("mdb")} import. `
     .concat`${mdb.code("mdb")} allows additional call signatures: e.g. both ${mdb.code('md.t`text`')}`
     .concat(" and ", mdb.code('md.t("text")'), " to make dynamic content building easier.")
);
{
  const sampleList = mdb.list();
  dynamicMarkdown.push(sampleList);
  for (let i = 1; i <= 3; i++) {
    const item = mdb.t("list item ").concat(mdb.b`${"" + i}`);
    sampleList.push(item);
    for (let j = 1; j <= i; j++) item.concat(" *");
  }
}
```

> 
> # Dynamic content
> 
> You can dynamically build your content using `.concat(...)` on paragraphs and inline elements.`.push(...)` on block contrainers (sectiions, lists, tables, footnotes, blockquotes) and 
> 
> You can use the usual `md` or the `mdb` import. `mdb` allows additional call signatures: e.g. both ``md.t`text` `` and `md.t("text")` to make dynamic content building easier.
> 
> - list item **1** \*
> - list item **2** \* \*
> - list item **3** \* \* \*
> 

## Extensible builder API

```typescript
import { MdBuilder } from "ts-md-builder";

type MyTypes = Date | number;
type MyContext = { fixedDigits?: number; locales?: string; timeZone?: string } & MdBuilder.Context;

class MyMd extends MdBuilder.ExtensibleMd<MyTypes, MyContext> {
  protected _toString(value: MyTypes, context: MyContext): string {
    if (typeof value === "number") {
      return context.fixedDigits === undefined ? value.toString() : value.toFixed(context.fixedDigits);
    } else {
      const date = new Date(value);
      return date.toLocaleString(context.locales, { timeZone: context.timeZone });
    }
  }
}

const myMd = new MyMd();
const myMarkdown = myMd.i`Moon landing was at ${new Date("1969-07-20T20:17:40z")} Houston time, and my secret number is ${myMd.s`${123456}`}`;

const myMarkdownStr = myMarkdown.toString({ fixedDigits: 2, locales: "en-US", timeZone: "America/Chicago" });

console.log(myMarkdownStr);
```

> *Moon landing was at 7/20/1969, 3:17:40 PM Houston time, and my secret number is ~~123456.00~~*

## Useful things to know

### Tagged template literals vs dynamic building

The library exports two default builders: `md` and `mdb` which are functionally interchangeable.

The `mdb` import allows both `md.t("text")` and ``md.t`text` `` call signatures to make dynamic content building easier.

The `md` import does not allow passing a string parameter when invoked with parentheses, to prevent the accidental use of  
 ``md.t(`text ${md.b`bold`}`)`` instead of ``md.t`text ${md.b`bold`}` `` as they have different meanings:

- ``md.t(`text ${md.b`bold`}`)`` will immediately convert the template literal into a string without context-aware processing,
- ``md.t`text ${md.b`bold`}` `` will defer the evaluation of the template literal until the markdown string is actually produced.

### ESLint configuration

eslint considers calling a function with tagged template syntax an unused expression if the return value is not used (e.g. ``for (const v of ["A","B"]) cell.concat` and ${n}`;``) as it doesn't consider the side effects by default. If you are using tagged templates while building dynamically, you might want to add the following rule to your eslint config to avoid false positives: https://github.com/eslint/eslint/issues/8268

```json
"rules": {
  "@typescript-eslint/no-unused-expressions": ["error", { "allowTaggedTemplates": true }]
}
```

## License

MIT
