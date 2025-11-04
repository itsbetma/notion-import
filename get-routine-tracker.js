import { config } from 'dotenv';
import { Client } from '@notionhq/client';

config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DATABASE_ID = 'a91b2785b4c54ee0888f01f5c44ea303'; // NOTE: Work Planner

export async function getData() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Day',
      date: {
        after: '2025-09-30',
      },
    },
    sorts: [
      {
        property: 'Day',
        direction: 'descending',
      },
    ],
    page_size: 99, // only get the latest one
  });

  return response.results;
}

async function main() {
  const items = await getData()
    .then(async (items) => {
      return items;
    })
    .catch((err) => console.error(err));

  if (!items) {
    console.error('No items found.');
    return;
  }

  console.debug(`You worked ${items.length} days!`);

  for (const item of items) {
    const p = item.properties;
    const date = item.properties.Day.date.start;
    console.log(date, p.Read.checkbox, p['Diet 100%'].checkbox);
  }
}

main();
