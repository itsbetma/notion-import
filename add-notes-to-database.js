import { Client } from "@notionhq/client";
import { config } from "dotenv";
import read from "./read-csv.js";

config();

const databaseId = process.env.DATABASE;
const apiKey = process.env.NOTION_API_KEY;

const notion = new Client({ auth: apiKey });

async function addNotionPageToDatabase(databaseId, pageProperties) {
  const newPage = await notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: pageProperties,
  });
  console.debug(newPage);
}

async function insert(rows) {
  if (!databaseId) return;

  console.log("Insert Start");

  for (let i = 0; i < rows.length; i++) {
    await addNotionPageToDatabase(databaseId, rows[i]);
  }
}

async function main() {
  const rows = await read();

  if (!rows) {
    console.error("no rows found.");
    return;
  }

  const rowsFormatted = [];
  rows.map((r) => {
    rowsFormatted.push({
      Name: {
        type: "title",
        title: [{ type: "text", text: { content: r[0] } }],
      },
      Text: {
        rich_text: [
          {
            text: {
              content: r[1],
            },
          },
        ],
      },
    });
  });

  console.log(rowsFormatted);

  insert(rowsFormatted);
}

export default main;
