import assert from 'assert';

const accessToken = require('./.access-token.json');
import { login } from 'masto';

async function main() {
  const masto = await login({
    url: 'https://social.coop',
    accessToken,
  });

  const account = await masto.accounts.lookup({ acct: "Eliot_L@mastodon.social"});
  assert.ok(account);

  const lists = await masto.lists.fetchAll();

  const list = await masto.lists.fetch(lists[0].id);

  console.log("Got account:", account.acct,  " lists:", lists, " list:", list);

  await masto.lists.addAccount(list.id, { accountIds: [account.id]});
}

main().catch((error) => {
  console.error(error);
});