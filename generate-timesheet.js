import { config } from 'dotenv';
import clipboardy from 'clipboardy';
import { Client } from '@notionhq/client';

const from = process.argv[2];
const to = process.argv[3];

console.debug(`From ${from} to ${to}`);

config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DATABASE_ID = '54ccead7fc4449729224ef01460c97a5'; // NOTE: Work Planner

export async function getData() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        {
          property: 'Reminder',
          date: {
            on_or_after: `${from}`,
          },
        },
        {
          property: 'Reminder',
          date: {
            on_or_before: `${to}`,
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

async function main() {
  if (!from || !to) {
    console.debug('Please provide valid dates.');
    return;
  }

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
      const text = block[block.type]?.rich_text
        ?.map((r) => r.plain_text)
        .join(' -- ')
        .replace(/--.*--/, '')
        .trim();

      if (
        block.type !== 'to_do' ||
        !block['to_do']?.checked ||
        String(text).toLocaleLowerCase().trim() === 'meeting notes'
      ) {
        continue;
      }

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

  console.debug('Timesheet is on your clipboard!');
}

main();
