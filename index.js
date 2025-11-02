import { config } from 'dotenv';
import clipboardy from 'clipboardy';

config();

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Replace with your actual database ID
const DATABASE_ID = '54ccead7fc4449729224ef01460c97a5'; // NOTE: Work Planner

export async function getLastItem() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        {
          property: 'Reminder',
          date: {
            on_or_after: '2025-10-27',
          },
        },
        {
          property: 'Reminder',
          date: {
            on_or_before: '2025-10-31',
          },
        },
        {
          property: 'Name', // must match the title property name in your database
          title: {
            contains: '_Goal & Minor Tasks', // or 'equals' if you want exact match
          },
        },
      ],
    },
    sorts: [
      {
        timestamp: 'created_time',
        direction: 'ascending',
      },
    ],
    page_size: 99, // only get the latest one
  });

  return response.results;
}

// Example usage
getLastItem()
  .then(async (items) => {
    if (!items) {
      console.error('No items found.');
      return;
    }
    let data = '';
    for (const item of items) {
      const date = item.properties.Reminder.date.start;
      const hoursWorked = item.properties.Hours.number;

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

      data =
        data +
        [
          date,
          hoursWorked ? String(hoursWorked) : '0',
          'Crystal',
          'Crystal - Website',
          finalItems.join('; '),
        ]
          .join('\t')
          .concat('\n');
    }
    await clipboardy.write(data);
  })
  .catch((err) => console.error(err));
