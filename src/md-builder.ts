// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MdBuilder {
  export type Context = {
    /** Horizontal rule "---" | "___" | "***" | ("---"+ | "___"+ | "***"+)[] 3 characters or more. Specify an Array to use different markers depending on section heading level   */
    hr: string | string[];
    /** Bold text marker "**" | "__" | <b> | <strong> */
    bold: string;
    /** Italic text marker "*" | "_" | <em> | <i> */
    italic: string;
    /** Strike-through text marker "~~" | "<s>" */
    strikethrough: string;
    /** Subscript text marker "~" | "<sub>" */
    subscript: string;
    /** Supercript text marker "^" | "<sup>" */
    superscript: string;
    /** Block quote marker "> " | ">" */
    blockquote: string;
    /** Inline code marker "`" */
    code: string;
    /** Code Block marker { indent: "    " } | { fence: "```" } | { fence: "~~~" } */
    codeblock: { indent: string } | { fence: string; indent?: string };
    /** Newline within paragraph "  \n" | "<br>\n" | "\\\n" */
    nl: string;
    /** Marker after the number for ordered lists "." | ")" Stick to "." if possible. */
    orderedList: string;
    /** Bullet marker for unordered lists "-" | "+" | "*" | ("-" | "+" | "*")[] Specify an Array to use different markers for sub-lists */
    unorderedList: string | string[];

    // Line start:
    //   # heading
    //   > block quote
    //   = - Heading 1/2 underline
    //   2+space/tab List/Codeblock indentation (can't be escaped, should be trimmed/coalesced as they usually don't display anyway)
    //   * + - Unordered list
    //   [0-9]+\. Ordered list
    //   ``` ~~~ Codeblock fence, ` is escaped individually, and ~~ for strikethrough so no need for it on paragraph level (extended syntax)
    //   :---:|--- table (complicated rules, but it must contain at least one --- and no other characters than - : | space tab (extended syntax)
    // In text:
    //   _ * Bold/Italic
    //   ^ ~ Superscript/Subscript/Strike-through(extended syntax)
    //   ` Code / Codeblock
    //   [ ] links
    //   <> url/email
    //   ![ Image. Look for text ending with ! and peek if the next non-empty inline element starts with [
    // In tables
    //   | Should it be \ or &#124; ? (extended syntax)
    /** set to false to escape all escapable characters (smartEscape mode is context-sensitive, leaving ~ # + \ - . ! characters unescaped wherever possible) */
    smartEscape: boolean;
    /** set to false to escape all RFC2396 non-standard characters in URL-s (smartUrlEscape mode only escapes the ( ) " characters, otherwise encodeURI is applied ) */
    smartUrlEscape: boolean;
    /** Add missing Reference and LinkReference elements to the end of the document */
    autoReferences: true;
    /** Link reference strictness. false - do not check, true - verify that all the References are included in the document, "strict" - also verify that ReferenceLinks are unique (the same MD Object was not included twice. It will still allow two with the same href) */
    checkReferences: boolean | "strict";

    /** Root heading level (1) */
    headingLevel: number;
    /** Root list level (1) */
    listLevel: number;
    /** Reference number to start numbering [Markdown link][1] referenced link from */
    referencedLinkSeq: number;

    /** we are caching the reference numbers in the context (not storing it in a member variable) to keep LinkReference stateless. One might try generating multiple documents from prebuilt paragraphs, stateful ELemnts would be a mess... */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _referenceCache?: Map<LinkReference<any, any>, { refNumber: number; referenced: number; included: number }>;
  };

  export const defaultOptions: Context = {
    hr: "---",
    bold: "**",
    italic: "*",
    strikethrough: "~~",
    subscript: "~",
    superscript: "^",
    blockquote: "> ",
    code: "`",
    codeblock: { fence: "```" },
    nl: "  \n",
    orderedList: ".",
    unorderedList: "-",
    smartEscape: true,
    smartUrlEscape: true,
    autoReferences: true,
    checkReferences: "strict",

    headingLevel: 1,
    listLevel: 1,
    referencedLinkSeq: 1,
  };

  export abstract class ExtensibleMd<T, C extends Context & Record<string, unknown>> {
    static _templateToArray<V>(template: string | TemplateStringsArray, values: V[]) {
      if (typeof template === "string") {
        if (values.length) throw new Error("MdBuilder: function should be called with a TemplateString literal, or a single string parameter");
        return [template];
      } else {
        return template.flatMap((str, index) => {
          return index < values.length ? [str, values[index]] : [str];
        });
      }
    }

    static _toString<T, C extends Context & Record<string, unknown>>(
      md: ExtensibleMd<T, C>,
      content: T,
      context: C,
      peekLength: number | undefined
    ): string {
      return md._toString(content, context, peekLength);
    }

    protected abstract _toString(content: T, context: C, peekLength: number | undefined): string;

    /*
     * md.section(
     *   md.h`Main title`,
     *   md.section(
     *     md.h`Subtitle A`,
     *     md.p`Sub section A`,
     *     md.cb`function sampleCode() {}`
     *   ),
     *   md.section(
     *     md.h`Subtitle B`,
     *     md.p`Sub section B`
     *   ),
     * )
     */

    /** Create a section consisting of a heading and a list of blocks (paragraphs, code blocks, lists, etc.) / sub-sections */
    section(heading: Heading<T, C> | null, ...content: BlockElement<C>[]) {
      return new Section<T, C>(heading, content);
    }

    // h(title: string): Heading<T, C>; - Would be nice, but would allow md.h(`${md.b("Title")`) by accident, which passes the evaluated string, not the TemplateString, causing troubles with custom Options and LinkRefertences
    /** Create a heading with automatically determined level from the document structure (nested sections) */
    h(title: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Heading<T, C>(this, undefined, ExtensibleMd._templateToArray(title, values));
    }

    /** Create a heading with a specific level */
    hN(level: number, title: InlineElement) {
      return new Heading<T, C>(this, level, [title]);
    }

    /** Heading 1 */
    h1(title: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Heading<T, C>(this, 1, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 2 */
    h2(title: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Heading<T, C>(this, 2, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 3 */
    h3(title: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Heading<T, C>(this, 3, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 4 */
    h4(title: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Heading<T, C>(this, 4, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 5 */
    h5(title: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Heading<T, C>(this, 5, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 6 */
    h6(title: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Heading<T, C>(this, 6, ExtensibleMd._templateToArray(title, values));
    }

    /** Paragraph */
    p(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Paragraph<T, C>(this, ExtensibleMd._templateToArray(content, values));
    }

    /** Normal text (no formatting) */
    t(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values));
    }
    /** Bold */
    b(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "bold");
    }

    /** Italic */
    i(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "italic");
    }

    /** Strike-through */
    s(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "strikethrough");
    }

    /** Superscript */
    sup(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "superscript");
    }

    /** Subscript */
    sub(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "subscript");
    }

    /** Inline code. For multiline code-block use md.cb`` */
    code(codeStr: string | TemplateStringsArray, ..._never: never[]) {
      return new Code<T, C>(this, ExtensibleMd._templateToArray(codeStr, _never).join(""));
    }

    /** Use href="http://url" for normal links, href = "#headingId" for intra-page link or href = md.linkRef(...) for reference-style links */
    link(text: string | InlineElement<C> | T, href: string, title: string): Link<T, C>;
    link(text: string | InlineElement<C> | T, linkRef: LinkReference): Link<T, C>;
    link(text: string | InlineElement<C> | T, hrefOrLinkRef: string | LinkReference, title?: string): Link<T, C>;
    link(text: string | InlineElement<C> | T, hrefOrLinkRef: string | LinkReference, title?: string) {
      return new Link<T, C>(this, text, hrefOrLinkRef, title);
    }

    /** A link reference to be used in a reference-style md.link() */
    linkRef(href: string, title: string) {
      return new LinkReference<T, C>(this, href, title);
    }

    /** Simple url or e-mail address, the visible text is the same as the link url. For more control, use md.link(name, href, title?) */
    url(urlStr: string | TemplateStringsArray, ..._never: never[]) {
      return new Url<T, C>(this, ExtensibleMd._templateToArray(urlStr, _never).join(""));
    }

    /** Custom html or markdown to add without any escaping */
    raw(rawContent: string | TemplateStringsArray, ..._never: never[]) {
      return new Raw<T, C>(this, ExtensibleMd._templateToArray(rawContent, _never).join(""));
    }

    /** Horizontal Rule */
    hr() {
      return new Hr<T, C>(this);
    }

    /** Block quote: "> Some quoted text..." */
    blockquote(...content: (BlockElement | string | InlineElement<C>)[]): Blockquote<T, C>;
    blockquote(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]): Blockquote<T, C>;
    blockquote(
      content: (BlockElement | string | InlineElement<C>) | TemplateStringsArray,
      ...values: (BlockElement | string | InlineElement<C> | T)[]
    ) {
      if (typeof content === "string" || content instanceof InlineElement || content instanceof BlockElement) {
        return new Blockquote<T, C>(this, [content]);
      } else {
        return new Blockquote<T, C>(this, ExtensibleMd._templateToArray(content, values));
      }
    }

    /** Block code. For short, inline code use md.c`` */
    codeblock(code: string, language?: string) {
      return new Codeblock<T, C>(this, code, language);
    }

    /** Image */
    img(alt: string, href: string, title?: string) {
      return new Link<T, C>(this, alt, href, title, true);
    }

    /** Unordered list (a list with bullet points, without numbering) */
    list(items: (string | InlineElement<C> | T | BlockElement<C>)[] = []) {
      return new List<T, C>(this, items);
    }

    /** Ordered list (a list with numbering) */
    ordered(items: (string | InlineElement<C> | T | BlockElement<C>)[]) {
      return new List<T, C>(this, items, 1);
    }
    /** Ordered list (a list with numbering starting from the specified value) */
    orderedFrom(start: number, items: (string | InlineElement<C> | T | BlockElement<C>)[]) {
      return new List<T, C>(this, items, start);
    }
  }

  export class Md extends ExtensibleMd<never, Context> {
    protected _toString(content: string | InlineElement<Context>, context: Context) {
      return InlineElement._toString(this, content, context, undefined);
    }
  }

  export function escapeRegExpLiteral(s: string) {
    // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& -> the whole matched string
  }

  export enum ErrorType {
    /** a LinkReference is missing from the document, but referenced by a reference style Link */
    LINK_REFERENCE_MISSING = "LINK_REFERENCE_MISSING",
    /** a LinkReference is included multiple times in the document */
    LINK_REFERENCE_DUPLICATE = "LINK_REFERENCE_DUPLICATE",
    /** a LinkReference was included in the document, but there are not reference-style Link-s to it */
    LINK_REFERENCE_NOT_USED = "LINK_REFERENCE_NOT_USED",
  }
  export type ErrorInfo = {
    message: string;
    errorType: string;
    element?: Element;
  };

  export abstract class Element<C extends Context = Context> {
    protected static _escapeText(text: string, context: Pick<Context, "smartEscape" | "nl">) {
      const escaped = context.smartEscape ? text.replace(/([\\*_`[\]{}<>]|(?<=~)~)/g, "\\$1") : text.replace(/([\\*_`|[\]{}<>~#+\-.!])/g, "\\$1");
      return escaped.replace(/\n/g, context.nl);
    }

    protected static _escapeTitle(title: string, context: Pick<Context, "smartEscape" | "nl">) {
      return context.smartEscape ? title.replace(/(")/g, "\\$1") : InlineElement._escapeText(title, { smartEscape: false, nl: "\n" });
    }

    protected static _escapeUrl(urlStr: string, context: Pick<Context, "smartUrlEscape">, quote: "(" | "<") {
      return context.smartUrlEscape
        ? urlStr.replace(quote === "(" ? /(["()])/g : /([<>])/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
        : // : urlStr.replace(/[^A–Za–z0–9\-_.!~*'();/?:@&=+$,#]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
          encodeURI(urlStr);
    }

    toString: Context extends C
      ? <T = never>(
          context?: Omit<C, keyof Context> & Partial<Pick<C, keyof Context>>,
          onErrors?: (output: string, errors: ErrorInfo[]) => T
        ) => string | T
      : <T = never>(
          context: Omit<C, keyof Context> & Partial<Pick<C, keyof Context>>,
          onErrors?: (output: string, errors: ErrorInfo[]) => T
        ) => string | T = <T = never>(
      context: Omit<C, keyof Context> & Partial<Pick<C, keyof Context>> = {} as Omit<C, keyof Context> & Partial<Pick<C, keyof Context>>,
      onErrors?: (output: string, errors: ErrorInfo[]) => T
    ) => {
      const _context = Object.entries(context).reduce(
        (o, [k, v]) => {
          if (v !== undefined) {
            (o as Record<string, unknown>)[k] = v;
          }
          return o;
        },
        { ...defaultOptions }
      ) as C;

      _context._referenceCache = new Map();

      let output = this._toString(_context, undefined);

      if (_context.autoReferences && _context._referenceCache) {
        for (const [link, entry] of _context._referenceCache) {
          if (entry.referenced && !entry.included) {
            output += Element.__toString(link, _context, undefined);
          }
        }
      }
      if (_context.checkReferences && _context._referenceCache) {
        const errors: ErrorInfo[] = [];
        for (const [link, entry] of _context._referenceCache) {
          if (entry.referenced && !entry.included) {
            errors.push({
              message: "Link reference missing: " + link.describe(_context),
              errorType: ErrorType.LINK_REFERENCE_MISSING,
              element: link,
            });
          } else if (entry.included && !entry.referenced && _context.checkReferences === "strict") {
            errors.push({ message: "Reference not used: " + link.describe(_context), errorType: ErrorType.LINK_REFERENCE_NOT_USED, element: link });
          } else if (entry.included > 1 && _context.checkReferences === "strict") {
            errors.push({
              message: "Link reference duplicated: " + link.describe(_context),
              errorType: ErrorType.LINK_REFERENCE_DUPLICATE,
              element: link,
            });
          }
        }
        if (errors.length) {
          if (onErrors) {
            return onErrors(output, errors);
          } else {
            throw new Error(
              `MdBuilder - errors during serialization (checkReferences:${JSON.stringify(
                _context.checkReferences
              )} and no .toString(..., onError:()=>{}) handler was specified):\n` + errors.map((link) => "- " + link.message).join("\n")
            );
          }
        }
      }
      return output;
    };

    static __toString(element: Element, context: Context, peekLength: number | undefined) {
      return element._toString(context, peekLength);
    }

    static _peekPiece(peekLength: number | undefined, piece: string | (() => string), lengthUpdate: (remaining: number) => void) {
      if (peekLength !== undefined && peekLength <= 0) return "";
      let str = typeof piece === "string" ? piece : piece();
      if (peekLength !== undefined) {
        if (str.length > peekLength) str = str.substring(0, peekLength);
        lengthUpdate(peekLength - str.length);
      }
      return str;
    }
    protected abstract _toString(context: C, peekLength: number | undefined): string;
  }

  /** InlineElement and BlockElement has no properties, thus duck typing would consider them interchangeable, allowing calls like md.section(md.h`Title`, md.t`This should be a block, not text!`) */
  export const typeduckSymbol = Symbol("typeduc");

  // ======================= Inline elements ===========================

  /** An inline element, like plain/blod/italic text or link */
  export abstract class InlineElement<C extends Context = Context> extends Element<C> {
    private readonly [typeduckSymbol] = InlineElement;

    protected static _bracketMark<T, C extends Context>(
      md: ExtensibleMd<T, C>,
      content: string | InlineElement<C> | T | (string | InlineElement<C> | T)[],
      context: C,
      mark: string,
      peekLength: number | undefined
    ) {
      return (
        Element._peekPiece(peekLength, mark, (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => InlineElement._toString(md, content, context, peekLength),
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(
          peekLength,
          () => {
            const htmlTagMatch = mark.match(/\s*<(?<tagName>[a-zA-Z]+)[^>]*>\s*/);
            if (htmlTagMatch) {
              return `</${htmlTagMatch.groups?.tagName}>`;
            } else {
              return mark;
            }
          },
          (remaining) => (peekLength = remaining)
        )
      );
    }

    static _toString<T, C extends Context>(
      md: ExtensibleMd<T, C>,
      content: string | InlineElement<C> | T | (string | InlineElement<C> | T)[],
      context: C,
      peekLength: number | undefined
    ): string {
      if (typeof content === "string") {
        return Element._peekPiece(
          peekLength,
          () => InlineElement._escapeText(content, context),
          (remaining) => (peekLength = remaining)
        );
      } else if (Array.isArray(content)) {
        return content
          .map((item, index) =>
            Element._peekPiece(
              peekLength,
              () => {
                let str = this._toString(md, item, context, peekLength);
                if (context.smartEscape && str.endsWith("!")) {
                  for (let idx = index + 1; idx < content.length; idx++) {
                    // avoid concatenating a trailing "...!" with a "[..." link which would turn it into an Image
                    const peekStr = InlineElement._toString(md, content[idx], context, 1);
                    if (peekStr.startsWith("[")) {
                      str = str.substring(0, str.length - 1) + "\\" + str.substring(str.length - 1);
                      break;
                    } else if (peekStr) {
                      break;
                    }
                  }
                }
                return str;
              },
              (remaining) => (peekLength = remaining)
            )
          )
          .join("");
      } else if (content instanceof InlineElement) {
        return content._toString(context, peekLength);
      } else {
        return ExtensibleMd._toString(md, content, context, peekLength);
      }
    }
  }

  export class Code<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, public code: string, readonly mark?: "`") {
      super();
    }

    concat(codeStr: string | TemplateStringsArray, ..._never: never[]) {
      this.code += ExtensibleMd._templateToArray(codeStr, _never).join("");
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      let mark = this.mark ?? context.code;
      let code = this.code;
      const trimmedMark = mark.trim();
      if (trimmedMark.length) {
        const markChars = Array.from(new Set(trimmedMark.split("")));
        let maxLength = trimmedMark.length;
        code.replace(new RegExp("((?:" + markChars.map((char) => escapeRegExpLiteral(char)).join("|") + ")+)", "g"), (fullMatch, markMatch) => {
          if (markMatch.length > maxLength) maxLength = markMatch.length;
          return fullMatch;
        });
        if (maxLength >= trimmedMark.length) {
          mark =
            markChars.length === 1 ? markChars[0].repeat(maxLength + 1) : trimmedMark.repeat(Math.ceil(maxLength / trimmedMark.length + 1 / 256));
        }
        if (code.endsWith(mark.substring(0, 1)) && code.endsWith(trimmedMark.substring(0, 1))) {
          // a trailing ` in the code would screw up the closing mark
          code = code + " ";
        }
      }
      return mark + code + mark;
    }
  }

  export class Link<T = never, C extends Context = Context> extends InlineElement<C> {
    // TODO consider smartEscape not to escape [ ], except when the output can actually be misinterpreted as a link/link reference. But might cause more confusion than it's benefits.
    constructor(md: ExtensibleMd<T, C>, text: string | InlineElement<C> | T, href: string, title?: string, isImage?: boolean);
    constructor(md: ExtensibleMd<T, C>, text: string | InlineElement<C> | T, reference: LinkReference, unused?: undefined, isImage?: boolean);
    constructor(
      md: ExtensibleMd<T, C>,
      text: string | InlineElement<C> | T,
      hrefOrLinkRef: string | LinkReference,
      title?: string,
      isImage?: boolean
    );
    constructor(
      readonly md: ExtensibleMd<T, C>,
      readonly text: string | InlineElement<C> | T,
      readonly hrefOrLinkRef: string | LinkReference,
      readonly title?: string,
      readonly isImage?: boolean
    ) {
      super();
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return (
        Element._peekPiece(peekLength, this.isImage ? "![" : "[", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => InlineElement._toString(this.md, this.text, context, peekLength),
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(peekLength, "]", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => {
            if (this.hrefOrLinkRef instanceof LinkReference) {
              return `[${this.hrefOrLinkRef.getRefNumber(context, peekLength === undefined)}]`;
            } else {
              return `(${InlineElement._escapeUrl(this.hrefOrLinkRef, context, "(")}${
                this.title ? ` "${Element._escapeTitle(this.title, context)}"` : ""
              })`;
            }
          },
          (remaining) => (peekLength = remaining)
        )
      );
    }
  }

  export class Raw<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, public rawContent: string) {
      super();
    }

    concat(rawContent: string | TemplateStringsArray, ..._never: never[]) {
      this.rawContent += ExtensibleMd._templateToArray(rawContent, _never).join("");
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return this.rawContent;
    }
  }

  export class Text<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(
      readonly md: ExtensibleMd<T, C>,
      readonly content: (string | InlineElement<C> | T)[],
      readonly emphasis?: keyof Pick<Context, "bold" | "italic" | "strikethrough" | "superscript" | "subscript">
    ) {
      super();
    }

    concat(content: TemplateStringsArray, ...values: (string | InlineElement<C> | T)[]) {
      this.content.push(...ExtensibleMd._templateToArray(content, values));
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return this.emphasis
        ? InlineElement._bracketMark(this.md, this.content, context, context[this.emphasis], peekLength)
        : InlineElement._toString(this.md, this.content, context, peekLength);
    }
  }

  export class Url<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly urlStr: string) {
      super();
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return `<${InlineElement._escapeUrl(this.urlStr, context, "<")}>`;
    }
  }

  // ======================= Block elements ===========================

  /** A block element, like a paragraph, block-quote or code-block */
  export abstract class BlockElement<C extends Context = Context> extends Element<C> {
    private readonly [typeduckSymbol] = BlockElement;
    protected static _toString<C extends Context>(item: BlockElement<C>, context: C, peekLength: number | undefined) {
      return item._toString(context, peekLength);
    }
  }

  export class Blockquote<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly content: (BlockElement<C> | string | InlineElement<C> | T)[]) {
      super();
    }

    push(...content: (BlockElement<C> | string | InlineElement<C> | T)[]) {
      this.content.push(...content);
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined): string {
      const blockquote = context.blockquote;
      let inlines: (string | InlineElement<C> | T)[] = [];
      const blocks: (BlockElement<C> | typeof inlines)[] = [];
      this.content.forEach((item) => {
        if (item instanceof BlockElement) {
          if (inlines.length) blocks.push(inlines);
          inlines = [];
          blocks.push(item);
        } else {
          inlines.push(item);
        }
      });
      if (inlines.length) blocks.push(inlines);
      return blocks
        .map((block) => {
          if (block instanceof BlockElement) {
            return BlockElement._toString(block, context, peekLength).replace(/\n/g, "\n" + blockquote);
          } else {
            return (
              Element._peekPiece(peekLength, "\n" + blockquote, (remaining) => (peekLength = remaining)) +
              Element._peekPiece(
                peekLength,
                () => InlineElement._toString(this.md, block, context, peekLength).replace(/\n/g, "\n" + blockquote),
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
            );
          }
        })
        .join("");
    }
  }

  export class Codeblock<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, public code: string, public language?: string) {
      super();
    }

    concat(codeStr: string | TemplateStringsArray, ..._never: never[]) {
      this.code += ExtensibleMd._templateToArray(codeStr, _never).join("");
      return this;
    }

    setLanguage(language: string | undefined) {
      this.language = language;
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      const mark = context.codeblock;
      const indent = "indent" in mark ? mark.indent : "";
      return (
        Element._peekPiece(peekLength, "\n" + indent, (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => {
            let fence = "fence" in mark ? mark.fence : null;
            const code = this.code;
            if (fence?.trim().length) {
              const trimmedFence = fence.trim();
              const fenceChars = Array.from(new Set(trimmedFence.split("")));
              let maxLength = trimmedFence.length;
              code.replace(
                new RegExp("(?:^|\n)[ \t]*((?:" + fenceChars.map((char) => escapeRegExpLiteral(char)).join("|") + ")+)[ \t]*(?:\n|$)", "g"),
                (fullMatch, fenceMatch) => {
                  if (fenceMatch.length > maxLength) maxLength = fenceMatch.length;
                  return fullMatch;
                }
              );
              if (maxLength >= trimmedFence.length) {
                fence =
                  fenceChars.length === 1
                    ? fenceChars[0].repeat(maxLength + 1)
                    : trimmedFence.repeat(Math.ceil(maxLength / trimmedFence.length + 1 / 256));
              }
            }

            const codeWithFence = fence ? fence + (fence && this.language ? this.language : "") + "\n" + code + "\n" + fence : code;
            return codeWithFence.replace(/\n/g, "\n" + indent);
          },
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
      );
    }
  }

  export class Heading<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(
      readonly md: ExtensibleMd<T, C>,
      readonly level: number | undefined,
      readonly title: (string | InlineElement<C> | T)[],
      readonly headingId?: string
    ) {
      super();
    }

    concat(...content: (string | InlineElement<C> | T)[]) {
      this.title.push(...content);
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      const headingLevel = this.level ?? context.headingLevel;
      return (
        Element._peekPiece(peekLength, "\n" + "#".repeat(headingLevel) + " ", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => InlineElement._toString(this.md, this.title, { ...context, headingLevel: headingLevel + 1, nl: " " }, peekLength),
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(peekLength, this.headingId ? ` {#${this.headingId}}` : "", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
      );
    }
  }

  export class Hr<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly mark?: "---" | "___" | "***") {
      super();
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return (
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => {
            let mark = this.mark ?? context.hr;
            if (typeof mark !== "string") {
              if (mark.length === 0) mark = "---";
              else mark = mark[Math.max(Math.min(context.headingLevel - 1, mark.length - 1), 0)];
            }
            return mark;
          },
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
      );
    }
  }

  export class LinkReference<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly href: string, readonly title?: string) {
      super();
    }

    protected _getRefEntry(context: Context) {
      if (!context._referenceCache) throw new Error("MdBuilder: Context._referenceCache is " + context._referenceCache);
      let entry = context._referenceCache.get(this);
      if (!entry) {
        entry = { refNumber: context.referencedLinkSeq++, referenced: 0, included: 0 };
        context._referenceCache.set(this, entry);
      }
      return entry;
    }

    getRefNumber(context: Context, isReferenced?: boolean) {
      const entry = this._getRefEntry(context);
      if (isReferenced) entry.referenced++;
      return entry.refNumber;
    }

    describe(context: C) {
      const descLength = 160;
      let peekStr = this._toString(
        { ...defaultOptions, smartEscape: true, smartUrlEscape: true, checkReferences: false, _referenceCache: context._referenceCache },
        descLength + 1
      );
      if (peekStr.length >= descLength) peekStr = peekStr.trim().substring(0, descLength - 1) + "…";
      else peekStr = peekStr.trim();
      return peekStr;
    }

    protected _toString(context: Context, peekLength: number | undefined) {
      if (peekLength === undefined && context._referenceCache) {
        this._getRefEntry(context).included++;
      }
      return (
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => {
            return `[${this.getRefNumber(context)}]: <${Element._escapeUrl(this.href, context, "<")}>${
              this.title ? ` "${Element._escapeTitle(this.title, context)}"` : ""
            }`;
          },
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
      );
    }
  }

  export class List<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(
      readonly md: ExtensibleMd<T, C>,
      readonly items: (string | InlineElement<C> | T | BlockElement<C>)[],
      readonly mark?: "-" | "*" | "+" | number
    ) {
      super();
    }

    push(...items: (string | InlineElement<C> | T | BlockElement<C>)[]) {
      this.items.push(...items);
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      const listLevel = context.listLevel;
      let mark = this.mark ?? context.unorderedList;
      if (typeof mark !== "string" && typeof mark !== "number") {
        // mark is a string[] to use different marks at different levels
        if (mark.length === 0) mark = "-";
        else if (mark.length === 1) mark = mark[0];
        else mark = mark[Math.max((((listLevel - 1) % mark.length) + mark.length) % mark.length, 0)]; // % + % to handle negative levels
      }
      if (typeof mark === "string" && !mark.endsWith(" ")) mark += " ";
      return this.items
        .map((item, index, array) => {
          if (item instanceof BlockElement) {
            const indent = "    ";
            return Element._peekPiece(
              peekLength,
              () => BlockElement._toString(item, { ...context, listLevel: listLevel + 1 }, peekLength).replace(/\n(?!$)/g, "\n" + indent),
              (remaining) => (peekLength = remaining)
            );
          } else {
            return (
              Element._peekPiece(peekLength, index === 0 ? "\n" : "", (remaining) => (peekLength = remaining)) +
              Element._peekPiece(
                peekLength,
                () => (typeof mark === "number" ? mark + index + context.orderedList + " " : mark),
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(
                peekLength,
                () => InlineElement._toString(this.md, item, context, peekLength),
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(peekLength, index === array.length - 1 ? "\n\n" : "\n", (remaining) => (peekLength = remaining))
            );
          }
        })
        .join("");
    }
  }

  export class Paragraph<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly content: (string | InlineElement<C> | T)[]) {
      super();
    }

    concat(...content: (string | InlineElement<C> | T)[]) {
      this.content.push(...content);
      return this;
    }

    protected static smartEscapeRegExp = /((?<=^\s*|\n\s*)(?:[#>]|[=-]+[ \t]*(?=\n|$)|[*+-][ \t]))/g;
    protected static smartEscapeOrderedListRegExp = /((?<=^\s*|\n\s*[0-9]+))([.)][ \t])/g;
    protected static smartTrimRegExp = /(?:(?<=^|\n)[ \t]+)|(?:[ \t]+(?=$))/g; // space can not be escaped, and space on line start doesn't usually display anyway
    protected static smartPipeRegExp = /(?<=^|\n)([ \t]*)([|]?[-:| \t]*---[-:| \t]*)(?=\n|$)/g; // some parser would accept it if there is at least one --- in the header separator
    protected static smartEscape<C extends Context>(content: string, context: C) {
      if (context.smartEscape) {
        return content
          .replace(this.smartEscapeRegExp, "\\$1")
          .replace(this.smartEscapeOrderedListRegExp, "$1\\$2")
          .replace(this.smartTrimRegExp, " ")
          .replace(this.smartPipeRegExp, "$1\\$2");
      } else {
        return content;
      }
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return (
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => Paragraph.smartEscape(InlineElement._toString(this.md, this.content, context, peekLength), context),
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
      );
    }
  }

  export class Section<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly heading: Heading<T, C> | null, readonly content: BlockElement<C>[]) {
      super();
    }

    push(...content: BlockElement<C>[]) {
      this.content.push(...content);
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      const headingStr = Element._peekPiece(
        peekLength,
        () => (this.heading ? BlockElement._toString(this.heading, context, peekLength) : ""),
        (remaining) => (peekLength = remaining)
      );
      const contentStr = this.content
        .map((item) =>
          Element._peekPiece(
            peekLength,
            () => BlockElement._toString(item, { ...context, headingLevel: (this.heading?.level ?? context.headingLevel) + 1 }, peekLength),
            (remaining) => (peekLength = remaining)
          )
        )
        .join("");
      return headingStr + contentStr;
    }
  }
}
