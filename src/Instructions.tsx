import React from 'react';

export function Instructions(): JSX.Element {
  return (
    <details open>
      <summary>Instructions</summary>
      <h1 id="masto-list-importer">masto-list-importer</h1>
      <p>This is a tool to import a <code>lists.csv</code> from one <a href="https://joinmastodon.org/">Mastodon</a> instance into another. Lists allow you to organize your follows into groups with their own timelines, and pin them to your advanced mode view. At this time of writing, Lists can be exported from Mastodon but there is no import function, so I created this tool to close the gap.</p>
      <p>Ideally, this functionality would be incorporated directly into Mastodon&#39;s UI (see <a href="https://github.com/mastodon/mastodon/issues/15015">mastodon issue #15015</a>), but I chose to write this external tool instead as it&#39;s a faster way to get up and running without having to wait for a pull request to be merged, released, and rolled out to the instances on the fedi.</p>
      <h2 id="configuration">Configuration</h2>
      <h3 id="generate-an-access-token">Generate an Access Token</h3>
      <ol>
        <li>Open your mastodon settings page, and then go to the &quot;Development&quot; menu.</li>
        <li>Click &quot;New Application&quot;.</li>
        <li>Application Name can be whatever you want but I&#39;d suggest <code>masto-list-importer</code>.</li>
        <li>For simplicity&#39;s sake you can leave the scopes at their defaults. This application should be able to function with a more limited scope but I haven&#39;t had time to determine exactly what that is yet. At a minimum we need to be able to read accounts and follows and read and write lists.</li>
        <li>Click &quot;Submit&quot;</li>
        <li>Click on the name of the application you just created.</li>
      </ol>
      <p>Now, copy &quot;Your access token&quot; listed on the application page into the form below. Also, put the <code>https://</code> URL of your instance into the config.</p>
      <p>Note that this token is not stored anywhere or sent to any server other than your instance. I don't have my own server for this tool, it simply runs in your browser window and is hosted on a static GitHub page.</p>
      <h2 id="usage">Usage</h2>
      <p>You should have a <code>lists.csv</code> which can be downloaded from the &quot;Data Export&quot; menu under &quot;Import and export&quot; in settings on your other instance.</p>
      <blockquote>
        <p>⚠️ You must be following an account before it can be added to a list. If you are migrating, you should import your <code>follows.csv</code> first, and give your instance time to process it, before trying to import lists. Accounts that are not followed will be skipped during import.</p>
        <p>ℹ️ If an account has redirected to a new instance since you exported the list, the new account will not be followed due to API limitations, but the account name will be logged so you can follow and add them to a list manually.</p>
      </blockquote>
      <p>Finally, select the <code>lists.csv</code> file you downloaded from your other instance in the file upload form widget, and hit "Submit".</p>
      <p>The tool will run and import as many of your follows into lists as it can. Lists that don&#39;t exist will be created. Lists with the same name will be merged. If there are lists with duplicate names, the first one found will be merged into.</p>
      <p>Pay attention to the log, as it will explain if certain accounts could not be added to a list.</p>
      <blockquote>
        <p>⚠️ The Mastodon API is rate limited. If the tool displays a rate limit error, wait for a while and try again later, it will resume where it left off.</p>
      </blockquote>
    </details>
  );
}