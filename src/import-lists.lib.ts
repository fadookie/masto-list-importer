import { login, Account, MastoRateLimitError } from 'masto';
import Parser, { Row } from '@gregoranders/csv';
import _ from 'lodash';

export type Logger = (message?: any, ...optionalParams: any[]) => void;

export interface Config {
  instance: string;
  access_token: string;
  logger: Logger;
}

export function assertOk(value: unknown, message?: string): asserts value {
  if (!value) throw new Error(message);
}

export async function importLists(config: Config, csvString: string) {
  try {
    const parser = new Parser();
    const rowsReadonly = parser.parse(csvString);
    const rows: Row[] = [..._.cloneDeep(rowsReadonly)];
    // config.logger(`Read csv file at '${csvPath}', csvString:`, csvString, "rows:", rows);

    config.logger(`Logging in to instance: ${config.instance}`);

    const masto = await login({
      url: config.instance,
      accessToken: config.access_token,
    });

    // Fix up account addresses for local instance to not have instance hostname
    const userAccount = await masto.accounts.verifyCredentials();
    const instanceHostname = userAccount.url
      .replace("http://", "",)
      .replace("https://", "",)
      .split("/")[0];

    for(const row of rows) {
      row[1] = row[1].replace(`@${instanceHostname}`, "");
    }

    // Start processing lists
    const inputLists = _.chain(rows)
      .map(row => row[0])
      .uniq()
      .value();
    // const inputAddresses = rows.map(row => row[1]);
    
    // Create any missing lists
    const cloudListsInitial = await masto.lists.fetchAll();
    const preExistingLists = cloudListsInitial.filter(list => inputLists.includes(list.title));
    const newListNames = _.difference(inputLists, preExistingLists.map(list => list.title));

    config.logger("Found pre-existing lists:\n", preExistingLists.map(l => l.title).join('\n'));

    const newLists = await Promise.all(newListNames.map(title => { // TODO: Batch this
      config.logger(`Creating list "${title}"`);
      return masto.lists.create({ title })
    }));

    const allLists = [...preExistingLists, ...newLists];

    // config.logger("preExistingLists:", preExistingLists, "inputLists:", inputLists, "newListNames:", newListNames, 'allLists:', allLists);

    config.logger(`Loaded ${rows.length} account candidates`);
    
    // Remove rows for accounts that were already on the list
    for (const list of allLists) {
      const accountIterator = masto.lists.getAccountIterator(list.id);

      for await (const accountPage of accountIterator) {
        accountPage.forEach((account) => {
          _.remove(rows, row => (
            row[0] === list.title && row[1] === account.acct
          ));
        });
      }
    }

    // Remove rows for accounts that the user isn't following
    const accounts = (await Promise.all(rows.map(async (row) => { // TODO: batch these requests
      try {
        const account = await masto.accounts.lookup({ acct: row[1] }); // TODO: optimize by using cached account object if it was already in memory
        assertOk(account);
        return account;
      } catch (e) {
        config.logger(`???? Lookup failed for account: "${row[1]}", Error:`, e);
        return null;
      }
    })))
    .filter((x): x is Account => x !== null);

    const relationships = await masto.accounts.fetchRelationships(accounts.map(account => account.id));
    for (const relationship of relationships) {
      if (!relationship.following) {
        const accountAddress = accounts.find(x => x.id === relationship.id)?.acct;
        assertOk(accountAddress);
        _.remove(rows, row => row[1] === accountAddress);
        config.logger(`You are not following ${accountAddress}, removing this account.`);
      }
    }

    // Remove suspended accounts
    for (const account of accounts) {
      if (account.suspended) {
        config.logger(`Account ${account.acct} is suspended, removing this account.`);
        _.remove(rows, row => row[1] === account.acct);
      }
    }

    config.logger(`Cleaned account candidates, ${rows.length} accounts remain.`);

    const accountsByList = _.groupBy(rows, row => row[0]);
    // config.logger('accountsByList:', accountsByList); 

    for (const [listName, rowsForAccount] of Object.entries(accountsByList)) {
      // Look up account IDs of remaining accounts on the list
      const accountIds = rowsForAccount.map(row => {
        const account = accounts.find(x => x.acct === row[1]);
        if (!account) config.logger(`Unable to find cached account for '${row[1]}', skipping.`);
        return account?.id;
      })
      .filter((accountId): accountId is string => accountId !== undefined);

      // config.logger(`[${listName}] Got new accounts:`, accounts.map(a => a.acct), " accountIds:", accountIds, " lists:", cloudListsInitial);

      // Add accounts to list
      const list = allLists.find(l => l.title === listName);
      assertOk(list)
      try {
        config.logger(`Adding ${accountIds.length} accounts to List "${list.title}": ${rowsForAccount.map(row => row[1]).join(",")}`);
        await masto.lists.addAccount(list.id, { accountIds });
      } catch (e) {
        config.logger(`???? Error adding accounts to list "${list.title}":`, e);
      }
    }

    config.logger("Done.");
  } catch (e: any) {
    if (typeof e === 'object' && e !== null && 'name' in e && e.name === "MastoRateLimitError") { // instanceof check doesn't work, sus
      const rateError = e as MastoRateLimitError;
      config.logger(`???? You are being rate limited by your instance. Please wait a while and try again${rateError.reset ? ` after ${rateError.reset}` : ''}.`);
      config.logger(rateError, " details", rateError.details, "desc:", rateError.description);
    } else {
      config.logger("???? Error:", e);
    }
  }
}