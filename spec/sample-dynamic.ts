/* eslint-disable prettier/prettier */
import { mdb } from "../src/index";

export const dynamicMarkdown = mdb.section(mdb.h("Dynamic content"));
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
