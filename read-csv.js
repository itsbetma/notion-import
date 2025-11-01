import fs from 'fs';
import { parse } from 'csv-parse';

async function read() {
  const rows = [];
  return new Promise((resolve) => {
    fs.createReadStream('./csv/atomic.csv')
      .pipe(parse({ delimiter: ',', from_line: 1 }))
      .on('data', function (row) {
        if (row) rows.push(row);
      })
      .on('finish', () => {
        resolve(rows);
      });
  });
}

export default read;
