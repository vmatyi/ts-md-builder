import { MdBuilder } from "./md-builder";

export { MdBuilder } from "./md-builder";

/** Markdown builder with more versatile call signatures, in particular allowing md.t(string).concat(string) type calls for building programmaticaly.
 *
 * For manual, template-based building you might want to consider mdTemplate (or md), which disallows the above calls, clearing possible confusion of
 * md.t`text ${md.b`bold`}` with md.t(`text ${md.b`bold`}`), as the second signature will cause the immediate evaluation of the template literal,
 * converting the parameters into a string with default options and without context-specific processing.
 */
export const mdBuilder = new MdBuilder.Md<MdBuilder.InlineContent<never, MdBuilder.Context>>();
export { mdBuilder as mdb };

/** Markdown builder with call signatures mostly restricted to template-string syntax, disallowing md.t(string).concat(string) type calls.
 *
 * It prevents the accidental use of md.t(`text ${md.b`bold`}`) instead of md.t`text ${md.b`bold`}` as they have different meanings:
 * - md.t(`text ${md.b`bold`}`) will immediately convert the parameters into a string with default options and without context-specific processing,
 * - md.t`text ${md.b`bold`}` will defer the evaluation of the template literal until the markdown string is actually produced.
 *
 * For programmatical building you might want to consider mdBuilder (or mdb), which allows the more versatile calls.
 */
export const mdTemplate = new MdBuilder.Md<never>();
export { mdTemplate as md };

export default mdTemplate;
