import { config } from 'dotenv';

config();

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Replace with your actual database ID
const DATABASE_ID = process.env.DATABASE;

export async function getLastItem() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Name', // must match the title property name in your database
      title: {
        contains: '_Goal & Minor Tasks', // or 'equals' if you want exact match
      },
    },
    sorts: [
      {
        timestamp: 'created_time',
        direction: 'descending',
      },
    ],
    page_size: 1, // only get the latest one
  });

  return response.results;
}

// Example usage
const lastItem = getLastItem()
  .then(async (items) => {
    if (!items) {
      console.log('No items found.');
      return;
    }
    for (const item of items) {
      const date = item.properties.Reminder.date.start;
      const title = item.properties['Name'].title[0].plain_text;
      console.log('\n\nTitle:', title);
      const blocks = await notion.blocks.children.list({
        block_id: item.id,
      });

      const todayBlockIndex = blocks.results.findIndex(
        (r) =>
          r.type === 'heading_1' &&
          r[r.type].rich_text
            ?.map((r) => r.plain_text)
            ?.join('')
            ?.trim()
            ?.toLowerCase() === 'today',
      );

      const newBlocks = blocks.results.slice(todayBlockIndex, undefined);

      const finalItems = [];

      for (const block of newBlocks) {
        if (block.type !== 'to_do' || !block['to_do']?.checked) {
          continue;
        }

        const text = block[block.type]?.rich_text
          ?.map((r) => r.plain_text)
          .join(' -- ')
          .replace(/--.*--/, '')
          .trim();

        if (text) finalItems.push(text);
      }

      console.log(date, `\t`, `Crystal Website`, `\t`, finalItems.join('; '));
    }
  })
  .catch((err) => console.error(err));
