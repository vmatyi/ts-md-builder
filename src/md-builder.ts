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
    /** Highlight text marker "==" | "<mark>" */
    highlight: string;
    /** Block quote marker "> " | ">" */
    blockquote: string;
    /** footnote sub-paragraph indentation "    " | "\t" */
    footnoteIndent: string;
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
    //   : definition (extended syntax)
    //   = - Heading 1/2 underline
    //   2+space/tab List/Codeblock indentation (can't be escaped, should be trimmed/coalesced as they usually don't display anyway)
    //   * + - Unordered list
    //   [0-9]+\. Ordered list
    //   ``` ~~~ Codeblock fence, ` is escaped individually, and ~~ for strikethrough so no need for it on paragraph level (extended syntax)
    //   :---:|--- table (complicated rules, but it must contain at least one --- and no other characters than - : | space tab (extended syntax)
    // In text:
    //   * Bold/Italic
    //   _ Bold/Italic except inside words, eg do_not_escape
    //   ^ ~ Superscript/Subscript/Strike-through(extended syntax)
    //   == Highlight (extended syntax)
    //   ` Code / Codeblock
    //   [ ] links
    //   <> url/email
    //   ![ Image. Look for text ending with ! and peek if the next non-empty inline element starts with [
    // In tables
    //   | Should it be \ or &#124; ? (extended syntax)
    /** set to false to escape all escapable characters (smartEscape mode is context-sensitive, leaving ~ # + \ - . ! characters unescaped wherever possible) */
    smartEscape: boolean;
    /** Escape :emojis: in text (you can include emojis using ${md.emoji`smile`} ) set ot "allSpecChars" to escape all old-school character combinations like :^ (standard emoji combinations like :) are escaped by default) */
    escapeEmojisInText: boolean | "allSpecChars";
    /** set to false to escape all RFC2396 non-standard characters in URL-s (smartUrlEscape mode only escapes the ( ) " characters, otherwise encodeURI is applied ) */
    smartUrlEscape: boolean;
    /** Add missing Footnote and linkUrl elements to the end of the document */
    autoReferences: boolean;
    /** Deduplicate Footnote and linkUrl elements (ignore the subsequent ones if included multiple times) */
    dedupReferences: boolean;
    /** Link reference strictness. false - do not check, true - verify that all the References are included in the document, "strict" - also verify that ReferenceLinks are unique (the same MD Object was not included twice. It will still allow two with the same href) */
    checkReferences: boolean | "strict";

    /** Root heading level (1) */
    headingLevel: number;
    /** Root list level (1) */
    listLevel: number;

    _state: {
      /** Reference number to start numbering [Markdown link][1] referenced link from */
      referencedLinkSeq: number;
      /** Reference number to start numbering [Markdown link][1] referenced link from */
      footnoteSeq: number;

      /** we are caching the link reference numbers in the context (not storing it in a member variable) to keep LinkUrl stateless. One might try generating multiple documents from prebuilt paragraphs, stateful Elemnts would be a mess... */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _linkUrlCache: Map<LinkUrl<any, any>, { refNumber: number; referenced: number; included: number }>;
      /** we are caching the footnote reference numbers in the context (not storing it in a member variable) to keep Footnote stateless. One might try generating multiple documents from prebuilt paragraphs, stateful Elemnts would be a mess... */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _footnoteRefCache: Map<Footnote<any, any>, { refId: string | number; referenced: number; included: number }>;
    };
  };

  export type ToStringOptions<C extends Context = Context> = Omit<C, keyof Context> & Partial<Pick<C, keyof Context>>;
  export type ErrorHandler<T> = (output: string, errors: ErrorInfo[]) => T;

  export const LEFT = "left";
  export const CENTER = "center";
  export const RIGHT = "right";
  export type TableHeaderAlign = typeof LEFT | typeof CENTER | typeof RIGHT;

  const _defaultOptions: Omit<Context, "headingLevel" | "listLevel" | "_state"> = {
    hr: "---",
    bold: "**",
    italic: "*",
    strikethrough: "~~",
    subscript: "~",
    superscript: "^",
    highlight: "==",
    blockquote: "> ",
    footnoteIndent: "    ",
    code: "`",
    codeblock: { fence: "```" },
    nl: "  \n",
    orderedList: ".",
    unorderedList: "-",
    smartEscape: true,
    escapeEmojisInText: true,
    smartUrlEscape: true,
    autoReferences: true,
    dedupReferences: false,
    checkReferences: "strict",
  };

  export function getDefaultContext(): Context {
    return {
      ..._defaultOptions,
      headingLevel: 1,
      listLevel: 1,
      _state: {
        referencedLinkSeq: 1,
        footnoteSeq: 1,
        _footnoteRefCache: new Map(),
        _linkUrlCache: new Map(),
      },
    };
  }

  export type InlineContent<T, C extends Context> = string | InlineElement<C> | RawElement<C> | T;

  export abstract class ExtensibleMd<T, C extends Context & Record<string, unknown>> {
    static _templateToArray<V>(template: string | TemplateStringsArray, values: V[]) {
      if (typeof template === "string") {
        return [template, ...values];
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

    // h(title: string): Heading<T, C>; - Would be nice, but would allow md.h(`${md.b("Title")`) by accident, which passes the evaluated string, not the TemplateString, causing troubles with custom Options and linkUrl-s
    /** Create a heading with automatically determined level from the document structure (nested sections) */
    h(title: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Heading<T, C>(this, undefined, ExtensibleMd._templateToArray(title, values));
    }

    /** Create a heading with a specific level */
    hN(level: number, title: InlineElement) {
      return new Heading<T, C>(this, level, [title]);
    }

    /** Heading 1 */
    h1(title: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Heading<T, C>(this, 1, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 2 */
    h2(title: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Heading<T, C>(this, 2, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 3 */
    h3(title: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Heading<T, C>(this, 3, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 4 */
    h4(title: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Heading<T, C>(this, 4, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 5 */
    h5(title: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Heading<T, C>(this, 5, ExtensibleMd._templateToArray(title, values));
    }
    /** Heading 6 */
    h6(title: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Heading<T, C>(this, 6, ExtensibleMd._templateToArray(title, values));
    }

    /** Paragraph */
    p(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Paragraph<T, C>(this, ExtensibleMd._templateToArray(content, values));
    }

    /** Normal text (no formatting) */
    t(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values));
    }
    /** **Bold** */
    b(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "bold");
    }

    /** ==Highlight== */
    highlight(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "highlight");
    }

    /** _Italic_ */
    i(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "italic");
    }

    /** ~~Strike-through~~ */
    s(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "strikethrough");
    }

    /** ^Superscript^ */
    sup(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "superscript");
    }

    /** ~Subscript~ */
    sub(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Text<T, C>(this, ExtensibleMd._templateToArray(content, values), "subscript");
    }

    /** Inline code. For multiline code-block use md.cb`` */
    code(codeStr: string | TemplateStringsArray, ..._never: never[]) {
      return new Code<T, C>(this, ExtensibleMd._templateToArray(codeStr, _never).join(""));
    }

    /** Use href="http://url" for normal links, href = "#headingId" for intra-page link or href = md.linkUrl(...) for reference-style links */
    link(text: InlineContent<T, C>, href: string, title: string): Link<T, C>;
    link(text: InlineContent<T, C>, target: LinkUrl | Heading): Link<T, C>;
    link(text: InlineContent<T, C>, hrefOrTarget: string | LinkUrl | Heading, title?: string): Link<T, C>;
    link(text: InlineContent<T, C>, hrefOrTarget: string | LinkUrl | Heading, title?: string) {
      return new Link<T, C>(this, text, hrefOrTarget, title);
    }

    /** @deprecated Use linkUrl(href, title) instead */
    linkRef(href: string, title: string) {
      return this.linkUrl(href, title);
    }

    /** A link reference to be used in a reference-style md.link() */
    linkUrl(href: string, title?: string) {
      return new LinkUrl<T, C>(this, href, title);
    }

    footnote(content0: InlineContent<never, C> | BlockElement, ...content: (InlineContent<T, C> | BlockElement)[]): Footnote<T, C>;
    footnote(content: TemplateStringsArray, ...values: InlineContent<T, C>[]): Footnote<T, C>;
    footnote(content: (InlineContent<never, C> | BlockElement) | TemplateStringsArray, ...values: (InlineContent<T, C> | BlockElement)[]) {
      if (typeof content === "string" || content instanceof InlineElement || content instanceof RawElement || content instanceof BlockElement) {
        return new Footnote<T, C>(this, [content, ...values]);
      } else {
        return new Footnote<T, C>(this, ExtensibleMd._templateToArray(content, values));
      }
    }

    /** Simple url or e-mail address, the visible text is the same as the link url. For more control, use md.link(name, href, title?) */
    url(urlStr: string | TemplateStringsArray, ..._never: never[]) {
      return new Url<T, C>(this, ExtensibleMd._templateToArray(urlStr, _never).join(""));
    }

    /** Custom html or markdown to add without any escaping or processing. You can use it as a BlockElement or an InlineElement.
     * When used as an InlineElement the resulting paragraph will still be processed as a paragraph.
     * When used as a paragraph, you have to manally add a new line before and after the raw content (if needed).
     */
    raw(rawContent: string | TemplateStringsArray, ..._never: never[]) {
      return new RawElement<T, C>(this, ExtensibleMd._templateToArray(rawContent, _never).join(""));
    }

    /** Horizontal Rule */
    hr() {
      return new Hr<T, C>(this);
    }

    /** Block quote: "> Some quoted text..." */
    blockquote(content0: InlineContent<never, C> | BlockElement, ...content: (InlineContent<T, C> | BlockElement)[]): Blockquote<T, C>;
    blockquote(content: TemplateStringsArray, ...values: InlineContent<T, C>[]): Blockquote<T, C>;
    blockquote(content: (InlineContent<never, C> | BlockElement) | TemplateStringsArray, ...values: (InlineContent<T, C> | BlockElement)[]) {
      if (typeof content === "string" || content instanceof InlineElement || content instanceof RawElement || content instanceof BlockElement) {
        return new Blockquote<T, C>(this, [content, ...values]);
      } else {
        return new Blockquote<T, C>(this, ExtensibleMd._templateToArray(content, values));
      }
    }

    /** Block code. For short, inline code use md.c`` */
    codeblock(code: string, language?: string) {
      return new Codeblock<T, C>(this, code, language);
    }

    definition(term: Text<never, Context>, definition: Text<never, Context>) {
      return new Definition<T, C>(this, term, definition);
    }

    /** Emoji: unescaped character sequence without limitations, thus can inject [link]() or any other markdown sequences.
     * Would be futile to attempt safe escaping, as injecting character by character could circumvent any regexp checks anyway.
     */
    emoji(nameOrEmoji: string) {
      return new Emoji<T, C>(this, nameOrEmoji);
    }

    /** Image */
    img(alt: string, href: string, title?: string) {
      return new Link<T, C>(this, alt, href, title, true);
    }

    /** Unordered list (a list with bullet points, without numbering) */
    list(items: (InlineContent<T, C> | BlockElement<C>)[] = []) {
      return new List<T, C>(this, items);
    }

    /** Ordered list (a list with numbering) */
    ordered(items: (InlineContent<T, C> | BlockElement<C>)[]) {
      return new List<T, C>(this, items, 1);
    }
    /** Ordered list (a list with numbering starting from the specified value) */
    orderedFrom(start: number, items: (InlineContent<T, C> | BlockElement<C>)[]) {
      return new List<T, C>(this, items, start);
    }

    task(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new Task<T, C>(this, ExtensibleMd._templateToArray(content, values));
    }

    table(header: (TableHeader | InlineContent<T, C>)[], ...rows: (InlineContent<T, C>[] | TableRow<T, C>)[]) {
      return new Table<T, C>(
        this,
        header.map((cell) => (cell instanceof TableHeader ? cell : new TableHeader<T, C>(this, [cell]))),
        rows.map((row) => (row instanceof TableRow ? row : new TableRow<T, C>(this, row)))
      );
    }

    tr(...cells: InlineContent<T, C>[]) {
      return new TableRow<T, C>(this, cells);
    }

    th(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      return new TableHeader<T, C>(this, ExtensibleMd._templateToArray(content, values));
    }
  }

  export class Md extends ExtensibleMd<never, Context> {
    protected _toString(content: never, context: Context): never {
      throw new Error(
        `MdBuilder - ExtensibleMd _toString called on ${this.constructor.name}. Your document probably contains a value that is incompatible with the Md class or not handled properly by an extension. value: {${content}}`
      );
    }
  }

  export function escapeRegExpLiteral(s: string) {
    // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& -> the whole matched string
  }

  export enum ErrorType {
    /** Link url of a reference-style link is missing from the document, but referenced by a Link */
    LINK_REFERENCE_MISSING = "LINK_REFERENCE_MISSING",
    /** Link url of a reference-style link is included multiple times in the document */
    LINK_REFERENCE_DUPLICATE = "LINK_REFERENCE_DUPLICATE",
    /** Link url of a reference-style link is included in the document, but not referenced by any links */
    LINK_REFERENCE_NOT_USED = "LINK_REFERENCE_NOT_USED",
    /** Footnote of a reference is missing from the document */
    FOOTNOTE_MISSING = "FOOTNOTE_MISSING",
    /** Footnote reference id changed during serialization (footnote.refId was called during toString()?) */
    FOOTNOTE_REF_ID_CHANGED = "FOOTNOTE_REF_ID_CHANGED",
    /** Footnote of a reference is included multiple times in the document */
    FOOTNOTE_DUPLICATE = "FOOTNOTE_DUPLICATE",
    /** Footnote is included in the document, but not referenced */
    FOOTNOTE_NOT_USED = "FOOTNOTE_NOT_USED",
  }
  export type ErrorInfo = {
    message: string;
    errorType: string;
    element?: Element;
  };

  export abstract class Element<C extends Context = Context> {
    protected static _escapeText(text: string, context: Pick<Context, "smartEscape" | "nl" | "escapeEmojisInText">) {
      let escaped = context.smartEscape
        ? text.replace(/([0-9A-Za-z]_[0-9A-Za-z])|([\\*_`[\]{}<>~^]|=(?==))/g, (match, keeper, escape) => keeper ?? "\\" + escape)
        : text.replace(/([\\*_`|[\]{}<>~^#+\-.!])/g, "\\$1");
      if (context.escapeEmojisInText) {
        escaped = context.smartEscape
          ? context.escapeEmojisInText === "allSpecChars"
            ? escaped.replace(/(:[^a-zA-Z0-9]|(?<![0-9A-Za-z]):[DOPosz](?![0-9A-Za-z]))/g, "\\$1")
            : escaped.replace(/(:[0-9a-z_]+(?=:)|(?<![0-9A-Za-z]):[$()*/@DOPosz|](?![0-9A-Za-z]))/g, "\\$1")
          : escaped.replace(/(:)/g, "\\$1");
      }
      return escaped.replace(/\n/g, context.nl).replace(/(^|\n)  (?=\n)/g, "$1\\"); // empty lines doesn't do very well with double-space NL escaping
    }

    protected static _escapeLinkTitle(title: string, context: Pick<Context, "smartEscape" | "nl" | "escapeEmojisInText">) {
      return title.replace(/(")/g, "\\$1");
    }

    protected static _escapeUrl(urlStr: string, context: Pick<Context, "smartUrlEscape">, quote: "(" | "<") {
      return context.smartUrlEscape
        ? urlStr.replace(quote === "(" ? /(["()])/g : /([<>])/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
        : urlStr.replace(/([*_`|[\]{}<>~#+\-.!])/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    }

    toString: Context extends C
      ? <T = never>(context?: ToStringOptions<C>, onErrors?: ErrorHandler<T>) => string | T
      : <T = never>(context: ToStringOptions<C>, onErrors?: ErrorHandler<T>) => string | T = <T = never>(
      context: ToStringOptions<C> = {} as ToStringOptions<C>,
      onErrors?: ErrorHandler<T>
    ) => {
      const _context = Object.entries(context).reduce((o, [k, v]) => {
        if (v !== undefined) {
          (o as Record<string, unknown>)[k] = v;
        }
        return o;
      }, getDefaultContext()) as C;

      let output = this._toString(_context, undefined);
      if (this instanceof InlineElement && _context.smartEscape) {
        output = Paragraph.smartEscape(output, _context);
      }

      if (_context.autoReferences) {
        for (const [link, entry] of _context._state._linkUrlCache) {
          if (entry.referenced && !entry.included) {
            output += Element.__toString(link, _context, undefined);
          }
        }
        for (const [link, entry] of _context._state._footnoteRefCache) {
          if (entry.referenced && !entry.included) {
            output += Element.__toString(link, _context, undefined);
          }
        }
      }
      const errors: ErrorInfo[] = [];
      if (_context.checkReferences) {
        for (const [linkData, entry] of _context._state._linkUrlCache) {
          if (entry.referenced && !entry.included) {
            errors.push({
              message: "Link url missing: " + linkData._describe(_context),
              errorType: ErrorType.LINK_REFERENCE_MISSING,
              element: linkData,
            });
          } else if (entry.included && !entry.referenced && _context.checkReferences === "strict") {
            errors.push({
              message: "Link url not used: " + linkData._describe(_context),
              errorType: ErrorType.LINK_REFERENCE_NOT_USED,
              element: linkData,
            });
          } else if (entry.included > 1 && _context.checkReferences === "strict") {
            errors.push({
              message: "Link url duplicated: " + linkData._describe(_context),
              errorType: ErrorType.LINK_REFERENCE_DUPLICATE,
              element: linkData,
            });
          }
        }
        for (const [footnote, entry] of _context._state._footnoteRefCache) {
          if (entry.referenced && !entry.included) {
            errors.push({
              message: "Footnote missing: " + footnote.describe(_context),
              errorType: ErrorType.FOOTNOTE_MISSING,
              element: footnote,
            });
          } else if (entry.included && !entry.referenced && _context.checkReferences === "strict") {
            errors.push({
              message: "Footnote not used: " + footnote.describe(_context),
              errorType: ErrorType.FOOTNOTE_NOT_USED,
              element: footnote,
            });
          } else if (entry.included > 1 && _context.checkReferences === "strict") {
            errors.push({
              message: "Footnote duplicated: " + footnote.describe(_context),
              errorType: ErrorType.FOOTNOTE_DUPLICATE,
              element: footnote,
            });
          }
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

  // ======================= Raw element ===========================

  /** An unprocessed element, will output it's content without any transformations. Useful for embedding raw html. */
  export class RawElement<T = never, C extends Context = Context> extends Element<C> {
    private readonly [typeduckSymbol] = RawElement;

    constructor(readonly md: ExtensibleMd<T, C>, public rawContent: string) {
      super();
    }

    concat(rawContent: string | TemplateStringsArray, ..._never: never[]) {
      this.rawContent += ExtensibleMd._templateToArray(rawContent, _never).join("");
      return this;
    }

    _toString(context: C, peekLength: number | undefined) {
      return this.rawContent;
    }
  }

  // ======================= Task Element ===========================

  export class Task<T = never, C extends Context = Context> extends Element<C> {
    private readonly [typeduckSymbol] = Task;

    constructor(readonly md: ExtensibleMd<T, C>, readonly content: InlineContent<T, C>[], public checked: boolean = false) {
      super();
    }

    setChecked(checked = true) {
      this.checked = checked;
      return this;
    }

    concat(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
      this.content.push(...ExtensibleMd._templateToArray(content, values));
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return (
        Element._peekPiece(peekLength, `[${this.checked ? "x" : " "}] `, (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => InlineElement._toString(this.md, this.content, context, peekLength),
          (remaining) => (peekLength = remaining)
        )
      );
    }

    static _toString<T, C extends Context>(item: Task<T, C>, context: C, peekLength: number | undefined): string {
      return item._toString(context, peekLength);
    }
  }

  // ======================= Inline elements ===========================

  /** An inline element, like plain/blod/italic text or link */
  export abstract class InlineElement<C extends Context = Context> extends Element<C> {
    private readonly [typeduckSymbol] = InlineElement;

    protected static _bracketMark<T, C extends Context>(
      md: ExtensibleMd<T, C>,
      content: InlineContent<T, C> | InlineContent<T, C>[],
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
            const htmlTagMatch = mark.match(/\s*<(?<tagName>[A-Za-z]+)[^>]*>\s*/);
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
      content: InlineContent<T, C> | Task<T, C> | InlineContent<T, C>[],
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
      } else if (content instanceof RawElement) {
        return content._toString(context, peekLength);
      } else if (content instanceof Task) {
        return Task._toString(content, context, peekLength);
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

  export class Emoji<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly nameOrEmoji: string) {
      super();
    }

    protected _toString(context: C, peekLength: number | undefined) {
      const nameOrEmoji = this.nameOrEmoji;
      return /^[a-z_]+$/.test(nameOrEmoji) ? `:${nameOrEmoji}:` : nameOrEmoji;
    }
  }

  export class FootnoteReference<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(readonly footnote: Footnote<T, C>) {
      super();
    }
    protected _toString(context: C, peekLength: number | undefined): string {
      return `[^${this.footnote.getRefId(context, { referenced: peekLength === undefined })}]`;
    }
  }

  export class Link<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(md: ExtensibleMd<T, C>, text: InlineContent<T, C>, href: string, title?: string, isImage?: boolean);
    constructor(md: ExtensibleMd<T, C>, text: InlineContent<T, C>, reference: LinkUrl, unused?: undefined, isImage?: boolean);
    constructor(md: ExtensibleMd<T, C>, text: InlineContent<T, C>, hrefOrTarget: string | LinkUrl | Heading, title?: string, isImage?: boolean);
    constructor(
      readonly md: ExtensibleMd<T, C>,
      readonly text: InlineContent<T, C>,
      readonly hrefOrTarget: string | LinkUrl | Heading,
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
            if (this.hrefOrTarget instanceof LinkUrl) {
              return `[${this.hrefOrTarget.getRefNumber(context, { referenced: peekLength === undefined })}]`;
            } else if (this.hrefOrTarget instanceof Heading) {
              if (!this.hrefOrTarget.headingId) {
                throw new Error("MdBuilder - Heading has no id! Heading:" + this.hrefOrTarget.title);
              }
              return `(#${this.hrefOrTarget.headingId.replace(/([()])/g, "\\$1")})`;
            } else {
              return `(${InlineElement._escapeUrl(this.hrefOrTarget, context, "(")}${
                this.title ? ` "${Element._escapeLinkTitle(this.title, context)}"` : ""
              })`;
            }
          },
          (remaining) => (peekLength = remaining)
        )
      );
    }
  }

  export class Text<T = never, C extends Context = Context> extends InlineElement<C> {
    constructor(
      readonly md: ExtensibleMd<T, C>,
      readonly content: InlineContent<T, C>[],
      readonly emphasis?: keyof Pick<Context, "bold" | "italic" | "strikethrough" | "superscript" | "subscript" | "highlight">
    ) {
      super();
    }

    concat(content: TemplateStringsArray, ...values: InlineContent<T, C>[]) {
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

    protected static _groupElements<C extends Context, T>(content: (InlineContent<T, C> | BlockElement<C>)[]) {
      let inlines: InlineContent<T, C>[] = [];
      const blocks: (BlockElement<C> | typeof inlines)[] = [];
      content.forEach((item) => {
        if (item instanceof BlockElement) {
          if (inlines.length) blocks.push(inlines);
          inlines = [];
          blocks.push(item);
        } else {
          inlines.push(item);
        }
      });
      if (inlines.length) blocks.push(inlines);
      return blocks;
    }
  }

  export class Blockquote<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly content: (InlineContent<T, C> | BlockElement<C>)[]) {
      super();
    }

    push(...content: (InlineContent<T, C> | BlockElement<C>)[]) {
      this.content.push(...content);
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined): string {
      const blockquote = context.blockquote;
      const blocks = BlockElement._groupElements(this.content);
      return blocks
        .map((block, index) => {
          if (block instanceof BlockElement) {
            return (
              Element._peekPiece(peekLength, index === 0 ? "" : blockquote, (remaining) => (peekLength = remaining)) +
              Element._peekPiece(
                peekLength,
                () => BlockElement._toString(block, context, peekLength).replace(/\n(?!$)/g, "\n" + blockquote),
                (remaining) => (peekLength = remaining)
              )
            );
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
              let maxLength = 0;
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

  export class Definition<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly term: Text<T, C>, readonly definition: Text<T, C>) {
      super();
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return (
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => Paragraph.smartEscape(InlineElement._toString(this.md, this.term, context, peekLength), context),
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(
          peekLength,
          () => "\n: " + InlineElement._toString(this.md, this.definition, context, peekLength),
          (remaining) => (peekLength = remaining)
        ) +
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
      );
    }
  }

  export class Footnote<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly content: (InlineContent<T, C> | BlockElement<C>)[]) {
      super();
    }

    refId: string | number | undefined;
    setId(id: string | number) {
      this.refId = id;
      return this;
    }

    push(...content: (InlineContent<T, C> | BlockElement<C>)[]) {
      this.content.push(...content);
      return this;
    }

    _ref?: FootnoteReference<T, C>;
    get ref() {
      if (!this._ref) this._ref = new FootnoteReference(this);
      return this._ref;
    }

    protected _getCacheEntry(context: Context) {
      let entry = context._state._footnoteRefCache.get(this);
      if (!entry) {
        entry = { refId: this.refId ?? context._state.footnoteSeq++, referenced: 0, included: 0 };
        context._state._footnoteRefCache.set(this, entry);
      }
      return entry;
    }

    getRefId(context: Context, { referenced, included }: { referenced?: boolean; included?: boolean }) {
      const entry = this._getCacheEntry(context);
      if (referenced) entry.referenced++;
      if (included) entry.included++;
      return entry.refId;
    }

    describe(context: C) {
      const descLength = 160;
      const peekStr = this._toString(
        { ...context, ..._defaultOptions, smartEscape: true, smartUrlEscape: true, dedupReferences: false },
        descLength + 1
      ).trim();
      return MdBuilder.trimLength(peekStr, descLength);
    }

    protected _toString(context: C, peekLength: number | undefined): string {
      const cacheEntry = this._getCacheEntry(context);
      if (cacheEntry.included > 0 && context.dedupReferences) {
        return "";
      }
      const mark = `[^${this.getRefId(context, { included: peekLength === undefined })}]: `;
      const blocks = BlockElement._groupElements(this.content);
      return blocks
        .map((block, index) => {
          const indent = index === 0 ? "" : context.footnoteIndent;
          if (block instanceof BlockElement) {
            return index === 0
              ? Element._peekPiece(peekLength, "\n" + mark, (remaining) => (peekLength = remaining)) +
                  Element._peekPiece(
                    peekLength,
                    () => BlockElement._toString(block, context, peekLength ? peekLength + "\n".length : peekLength).replace(/^\n/g, ""),
                    (remaining) => (peekLength = remaining)
                  )
              : Element._peekPiece(
                  peekLength,
                  () => BlockElement._toString(block, context, peekLength).replace(/\n(?!$)/g, "\n" + indent),
                  (remaining) => (peekLength = remaining)
                );
          } else {
            return (
              Element._peekPiece(peekLength, "\n" + (index === 0 ? mark : indent), (remaining) => (peekLength = remaining)) +
              Element._peekPiece(
                peekLength,
                () => InlineElement._toString(this.md, block, context, peekLength).replace(/\n/g, "\n" + indent),
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
            );
          }
        })
        .join("");
    }
  }

  export class Heading<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(
      readonly md: ExtensibleMd<T, C>,
      readonly level: number | undefined,
      readonly title: InlineContent<T, C>[],
      public headingId?: string
    ) {
      super();
    }

    setId(id: string | undefined) {
      this.headingId = id;
      return this;
    }

    concat(...content: InlineContent<T, C>[]) {
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
        Element._peekPiece(
          peekLength,
          this.headingId ? ` {#${this.headingId.replace(/([{}])/g, "\\$1")}}` : "",
          (remaining) => (peekLength = remaining)
        ) +
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

  export class LinkUrl<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly href: string, readonly title?: string) {
      super();
    }

    protected _getCacheEntry(context: Context) {
      let entry = context._state._linkUrlCache.get(this);
      if (!entry) {
        entry = { refNumber: context._state.referencedLinkSeq++, referenced: 0, included: 0 };
        context._state._linkUrlCache.set(this, entry);
      }
      return entry;
    }

    getRefNumber(context: Context, { referenced, included }: { referenced?: boolean; included?: boolean }) {
      const entry = this._getCacheEntry(context);
      if (referenced) entry.referenced++;
      if (included) entry.included++;
      return entry.refNumber;
    }

    _describe(context: C) {
      const descLength = 160;
      let peekStr = this._toString(
        { ...context, ..._defaultOptions, smartEscape: true, smartUrlEscape: true, dedupReferences: false },
        descLength + 1
      );
      if (peekStr.length >= descLength) peekStr = peekStr.trim().substring(0, descLength - 1) + "…";
      else peekStr = peekStr.trim();
      return peekStr;
    }

    protected _toString(context: Context, peekLength: number | undefined) {
      const cacheEntry = this._getCacheEntry(context);
      if (cacheEntry.included > 0 && context.dedupReferences) {
        return "";
      }
      return (
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining)) +
        Element._peekPiece(
          peekLength,
          () => {
            return `[${this.getRefNumber(context, { included: peekLength === undefined })}]: <${Element._escapeUrl(this.href, context, "<")}>${
              this.title ? ` "${Element._escapeLinkTitle(this.title, context)}"` : ""
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
      readonly items: (InlineContent<T, C> | Task<T, C> | BlockElement<C>)[],
      readonly mark?: "-" | "*" | "+" | number
    ) {
      super();
    }

    push(...items: (InlineContent<T, C> | Task<T, C> | BlockElement<C>)[]) {
      this.items.push(...items);
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      const listLevel = context.listLevel;
      let mark = this.mark ?? context.unorderedList;
      if (typeof mark !== "string" && typeof mark !== "number") {
        // mark is a string[] to use different marks at different levels
        if (mark.length === 0) mark = "-";
        else mark = mark[Math.max((((listLevel - 1) % mark.length) + mark.length) % mark.length, 0)]; // % + % to handle negative levels
      }
      if (typeof mark === "string" && !mark.endsWith(" ")) mark += " ";
      let isBlock = true;
      let itemIdx = 0;
      return this.items
        .map((item, index, array) => {
          const prevIsBlock = isBlock;
          if (item instanceof BlockElement) {
            const indent = "    ";
            isBlock = true;
            return Element._peekPiece(
              peekLength,
              () => BlockElement._toString(item, { ...context, listLevel: listLevel + 1 }, peekLength).replace(/\n(?!$)/g, "\n" + indent),
              (remaining) => (peekLength = remaining)
            );
          } else {
            isBlock = false;
            return (
              Element._peekPiece(peekLength, prevIsBlock ? "\n" : "", (remaining) => (peekLength = remaining)) +
              Element._peekPiece(
                peekLength,
                () => (typeof mark === "number" ? mark + itemIdx++ + context.orderedList + " " : mark),
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(
                peekLength,
                () => InlineElement._toString(this.md, item, context, peekLength),
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining))
            );
          }
        })
        .join("");
    }
  }

  export class Paragraph<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly content: InlineContent<T, C>[]) {
      super();
    }

    concat(...content: InlineContent<T, C>[]) {
      this.content.push(...content);
      return this;
    }

    protected static smartEscapeRegExp = /((?<=^\s*|\n\s*)(?:[#>]|[=-]+[ \t]*(?=\n|$)|[*+-][ \t]|:(?=\s)))/g;
    protected static smartEscapeOrderedListRegExp = /((?<=^\s*|\n\s*)[0-9]+)([.)][ \t])/g;
    protected static smartTrimRegExp = /(?:(?<=^|\n)[ \t]+)|(?:[ \t]+(?=$))/g; // space can not be escaped, and space on line start doesn't usually display anyway
    protected static smartPipeRegExp = /(?<=^|\n)([ \t]*)([|]?[-:| \t]*---[-:| \t]*)(?=\n|$)/g; // some parser would accept it if there is at least one --- in the header separator
    static smartEscape<C extends Context>(content: string, context: C) {
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

  class TableHeader<T = never, C extends Context = Context> extends Element<C> {
    private readonly [typeduckSymbol] = TableHeader;
    constructor(readonly md: ExtensibleMd<T, C>, readonly content: InlineContent<T, C>[], public align?: TableHeaderAlign) {
      super();
    }

    setAlign(align: TableHeaderAlign) {
      this.align = align;
      return this;
    }

    protected _toString(context: C, peekLength: number | undefined) {
      return Element._peekPiece(
        peekLength,
        () => InlineElement._toString(this.md, this.content, context, peekLength),
        (remaining) => (peekLength = remaining)
      );
    }
    static _toString<T, C extends Context>(header: TableHeader<T, C>, context: C, peekLength: number | undefined) {
      return header._toString(context, peekLength);
    }
  }

  class TableRow<T = never, C extends Context = Context> extends Element<C> {
    private readonly [typeduckSymbol] = TableRow;
    constructor(readonly md: ExtensibleMd<T, C>, readonly cells: InlineContent<T, C>[]) {
      super();
    }

    protected _toString(context: C, peekLength: number | undefined, header?: TableHeader<T, C>[], widths?: number[]) {
      return this.cells
        .map((cell, index, array) => {
          return (
            Element._peekPiece(peekLength, index === 0 ? "| " : " | ", (remaining) => (peekLength = remaining)) +
            Element._peekPiece(
              peekLength,
              () => {
                let str = InlineElement._toString(this.md, cell, context, peekLength).replace(/([|])/g, "\\$1");
                /* c8 ignore next - width === undefined should never happen */
                if (widths?.[index] !== undefined && (peekLength === undefined || str.length < peekLength)) {
                  const align = header?.[index].align ?? LEFT;
                  if (align === LEFT) str = str.padEnd(widths[index]);
                  else if (align === RIGHT) str = str.padStart(widths[index]);
                  else {
                    const leftPadding = Math.floor((widths[index] - str.length) / 2);
                    str = " ".repeat(leftPadding) + str + " ".repeat(widths[index] - str.length - leftPadding);
                  }
                }
                return str;
              },
              (remaining) => (peekLength = remaining)
            ) +
            Element._peekPiece(peekLength, index === array.length - 1 ? " |\n" : "", (remaining) => (peekLength = remaining))
          );
        })
        .join("");
    }
    static _toString<T, C extends Context>(
      row: TableRow<T, C>,
      context: C,
      peekLength: number | undefined,
      header: TableHeader<T, C>[],
      widths: number[]
    ) {
      return row._toString(context, peekLength, header, widths);
    }
  }

  class Table<T = never, C extends Context = Context> extends BlockElement<C> {
    constructor(readonly md: ExtensibleMd<T, C>, readonly header: TableHeader<T, C>[], readonly rows: TableRow<T, C>[]) {
      super();
    }

    protected _toString(context: C, peekLength: number | undefined) {
      const widths: number[] = [];
      return (
        Element._peekPiece(peekLength, "\n", (remaining) => (peekLength = remaining)) +
        this.header
          .map((cell, index, array) => {
            return (
              Element._peekPiece(peekLength, index === 0 ? "| " : " | ", (remaining) => (peekLength = remaining)) +
              Element._peekPiece(
                peekLength,
                () => {
                  const str = TableHeader._toString(cell, context, peekLength).replace(/([|])/g, "\\$1");
                  widths[index] = Math.min(str.length, 20);
                  return str;
                },
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(peekLength, index === array.length - 1 ? " |\n" : "", (remaining) => (peekLength = remaining))
            );
          })
          .join("") +
        this.header
          .map((cell, index, array) => {
            return (
              Element._peekPiece(peekLength, index === 0 ? "| " : " | ", (remaining) => (peekLength = remaining)) +
              Element._peekPiece(
                peekLength,
                () => {
                  const leftMark = cell.align === LEFT || cell.align === CENTER ? ":" : "";
                  const rightMark = cell.align === RIGHT || cell.align === CENTER ? ":" : "";
                  return leftMark + "-".repeat(Math.max(widths[index] - leftMark.length - rightMark.length, 3)) + rightMark;
                },
                (remaining) => (peekLength = remaining)
              ) +
              Element._peekPiece(peekLength, index === array.length - 1 ? " |\n" : "", (remaining) => (peekLength = remaining))
            );
          })
          .join("") +
        this.rows
          .map((row) =>
            Element._peekPiece(
              peekLength,
              () => TableRow._toString(row, context, peekLength, this.header, widths),
              (remaining) => (peekLength = remaining)
            )
          )
          .join("")
      );
    }
  }

  export function trimLength(s: string, maxLength: number): string {
    if (s.length > maxLength) return s.substring(0, maxLength - 1) + "…";
    else return s;
  }
}
