import assert from 'assert';
import process from 'process';
import { readFileSync } from 'fs';
import { login, MastoError, MastoRateLimitError } from 'masto';
import Parser, { Row } from '@gregoranders/csv';

import _ from 'lodash';

const accessToken = require('./.access-token.json');

async function main() {
  try {
    // const rows: [string, string][] = [
    //   ["Test1", "ferrata@mastodon.cloud"],
    //   ["Test1", "JoeSondow@tabletop.social"],
    //   ["Test2", "devonrubin@mastodon.art"],
    //   ["Test2", "alison@toot.site"],
    //   ["Test List", "Gargron@mastodon.social"],
    // ];

    const csvPath = process.argv[2];
    const csvString = readFileSync(csvPath, 'utf8');

    const parser = new Parser();
    const rowsReadonly = parser.parse(csvString);
    const rows: Row[] = [...rowsReadonly];
    console.log(`Read csv file at '${csvPath}', csvString:`, csvString, "rows:", rows);

    const masto = await login({
      url: 'https://social.coop',
      accessToken,
    });

    const inputLists = _.chain(rows)
      .map(row => row[0])
      .uniq()
      .value();
    const inputAddresses = rows.map(row => row[1]);
    
    // Create any missing lists
    const cloudListsInitial = await masto.lists.fetchAll();
    const preExistingLists = cloudListsInitial.filter(list => inputLists.includes(list.title));
    const newListNames = _.difference(inputLists, preExistingLists.map(list => list.title));

    const newLists = await Promise.all(newListNames.map(async title => ( // TODO: Batch this
      await masto.lists.create({ title })
    )));

    const allLists = [...preExistingLists, ...newLists];

    console.log("preExistingLists:", preExistingLists, "inputLists:", inputLists, "newListNames:", newListNames, 'allLists:', allLists);

    console.log(`Loaded ${rows.length} account candidates`);
    
    // Remove rows for accounts that were already on the list
    for (const list of allLists) {
      const accountIterator = await masto.lists.getAccountIterator(list.id);

      for await (const accountPage of accountIterator) {
        accountPage.forEach((account) => {
          _.remove(rows, row => (
            row[0] === list.title && row[1] === account.acct
          ));
        });
      }
    }

    // Remove rows for accounts that the user isn't following
    const accounts = await Promise.all(rows.map(async (row) => { // TODO: batch these requests
      const account = await masto.accounts.lookup({ acct: row[1] }); // TODO: optimize by using cached account object if it was already in memory
      assert.ok(account);
      return account;
    }));

    const relationships = await masto.accounts.fetchRelationships(accounts.map(account => account.id));
    for (const relationship of relationships) {
      if (!relationship.following) {
        const accountAddress = accounts.find(x => x.id === relationship.id)?.acct;
        assert.ok(accountAddress);
        _.remove(rows, row => row[1] === accountAddress);
        console.log(`You are not following ${accountAddress}, removing this account.`);
      }
    }

    console.log(`Cleaned account candidates, ${rows.length} accounts remain.`);

    const accountsByList = _.groupBy(rows, row => row[0]);
    console.log('accountsByList:', accountsByList); 

    for (const [listName, rowsForAccount] of Object.entries(accountsByList)) {
      // Look up account IDs of remaining accounts on the list
      const accountIds = rowsForAccount.map(row => {
        const account = accounts.find(x => x.acct === row[1]);
        if (!account) console.log(`Unable to find cached account for '${row[1]}', skipping.`);
        return account?.id;
      })
      .filter((x): x is string => x !== undefined);

      // console.log(`[${listName}] Got new accounts:`, accounts.map(a => a.acct), " accountIds:", accountIds, " lists:", cloudListsInitial);

      // Add accounts to list
      const list = allLists.find(l => l.title === listName);
      assert.ok(list)
      try {
        console.log(`Adding ${accountIds.length} accounts to List "${list.title}": ${rowsForAccount.map(row => row[1]).join(",")}`);
        await masto.lists.addAccount(list.id, { accountIds });
      } catch (e) {
        console.error("inner try-catch", e);
      }
    }

    console.log("Done.");
  } catch (e: any) {
    if (typeof e === 'object' && e !== null && 'name' in e && e.name === "MastoRateLimitError") { // instanceof check doesn't work, sus
      const rateError = e as MastoRateLimitError;
      console.error(`You are being rate limited by your instance. Please wait a while and try again after ${rateError.reset}.`);
      console.error(rateError, " details", rateError.details, "desc:", rateError.description);
    } else {
      console.error("try-catch generic:", e);
    }
  }
}

main().catch((error) => {
  console.error("Promise#catch", error);
});