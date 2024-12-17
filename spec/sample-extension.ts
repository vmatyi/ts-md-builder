import { MdBuilder } from "../src/index";

export type MyTypes = Date | number;
export type MyContext = { fixedDigits?: number; locales?: string; timeZone?: string } & MdBuilder.Context;

class MyMd extends MdBuilder.ExtensibleMd<MyTypes, MyContext> {
  protected _toString(value: MyTypes, context: MyContext): string {
    if (typeof value === "number") {
      return context.fixedDigits === undefined ? value.toString() : value.toFixed(context.fixedDigits);
    } else {
      const date = new Date(value);
      const str = date.toLocaleString(context.locales, { timeZone: context.timeZone });
      // Escape the result text: either the whole string (like here) or just the text parts (e.g. if you are returning markdown-formatted text)
      return MdBuilder.InlineElement._escapeText(str, context);
    }
  }
}

const myMd = new MyMd();
export const myMarkdown = myMd.i`Moon landing was at ${new Date("1969-07-20T20:17:40z")} Houston time, and my secret number is ${myMd.s`${123456}`}`;

export const myMarkdownStr = myMarkdown.toString({ fixedDigits: 2, locales: "en-US", timeZone: "America/Chicago" });

console.log(myMarkdownStr);
