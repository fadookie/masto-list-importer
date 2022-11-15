# masto-list-importer

This is a tool to import a `lists.csv` from one [Mastodon](https://joinmastodon.org/) instance into another. Lists allow you to organize your follows into groups with their own timelines, and pin them to your advanced mode view. At this time of writing, Lists can be exported from Mastodon but there is no import function, so I created this tool to close the gap.

Ideally, this functionality would be incorporated directly into Mastodon's UI (see [mastodon issue #15015](https://github.com/mastodon/mastodon/issues/15015)), but I chose to write this external tool instead as it's a faster way to get up and running without having to wait for a pull request to be merged, released, and rolled out to the instances on the fedi.

# Web UI

The Web UI for this tool can be found at https://www.eliotlash.com/masto-list-importer/

Instructions for using it are on the page.

# Command Line Interface

This tool also has a command-line interface. As such it is primarily usable by developers, but I will try to explain how to use it here. If you are a non-technical user, you may want to read [a primer on the command line](https://www.git-tower.com/learn/git/ebook/en/command-line/appendix/command-line-101) first.

## Installation
This is a Node.JS script, so you will need to install Node.JS on your system. Some options on how to do this:
 * [Official Downloads](https://nodejs.org/en/download/)
 * macOS [Homebrew](https://brew.sh/) users: `brew install node`
 * 'nix users: Look for a `node` package in your package manager.
 * 'nix, macOS, Windows Subsystem For Linux: [Node Version Manager](https://github.com/nvm-sh/nvm)

 Next, clone this repo or [download a zip archive](https://github.com/fadookie/masto-list-importer/archive/refs/heads/main.zip).

 Then, run:
 ```
 npm install
 ```

## Configuration
Copy the `config.sample.json` file and name it `config.json`.

### Generate an Access Token
1. Open your mastodon settings page, and then go to the "Development" menu.
1. Click "New Application".
1. Application Name can be whatever you want but I'd suggest `masto-list-importer`.
1. For simplicity's sake you can leave the scopes at their defaults. This application should be able to function with a more limited scope but I haven't had time to determine exactly what that is yet. At a minimum we need to be able to read accounts and follows and read and write lists.
1. Click "Submit"
1. Click on the name of the application you just created.

Now, copy "Your access token" listed on the application page into `config.json`. It should go in between the quotes, with no spaces on either side. Also, put the `https://` URL of your instance into the config. A finished config should look something like so:

```json
{
  "instance": "https://mastodon.social",
  "access_token": "0il6r_q_7suU19123tTA1mITp_Q3g9kf0qUmz51eX4g"
}

```

## Usage

You should have a `lists.csv` which can be downloaded from the "Data Export" menu under "Import and export" in settings on your other instance.

> ⚠️ You must be following an account before it can be added to a list. If you are migrating, you should import your `follows.csv` first, and give your instance time to process it, before trying to import lists. Accounts that are not followed will be skipped during import.

> ℹ️ If an account has redirected to a new instance since you exported the list, the new account will not be followed due to API limitations, but the account name will be logged so you can follow and add them to a list manually.

Run the tool like so:

```
npm run import-lists path/to/lists.csv
```

Where `path/to/lists.csv` is the path to the file you want to import. In most terminal apps, if you drag the file onto it, it will paste the path in for you.

The tool will run and import as many of your follows into lists as it can. Lists that don't exist will be created. Lists with the same name will be merged. If there are lists with duplicate names, the first one found will be merged into.

Pay attention to the log, as it will explain if certain accounts could not be added to a list.

> ⚠️ The Mastodon API is rate limited. If the tool displays a rate limit error, wait for a while and try again later, it will resume where it left off.