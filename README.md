# atlassian-links

A Claude Code mod: a pane beside the chat with quick links to your Atlassian Cloud site.

- **Working on**: the Jira card Claude is working on. Claude adds it with the `track_card` tool.
- **Jira** and **Confluence**: every issue and page Claude opens through the Atlassian connector (`getJiraIssue`, `getConfluencePage`, `fetch`), newest first. Search results are not listed.

In the terminal each row is a button: click it, or focus the pane and press its number, to open the link in your browser. Other surfaces draw plain links. `/atlassian-work-items` opens the pane; it also opens by itself on the first link. The list lasts one session.

Needs the Atlassian connector from claude.ai (Atlassian Rovo) connected in Claude Code.

## Install

At the prompt of a terminal session:

```
/plugin install atlassian-links --marketplace twizck/claude-atlassian-links
```

From a shell:

```
claude plugin install atlassian-links --marketplace twizck/claude-atlassian-links
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `twizck/claude-atlassian-links`, then Add plugin.

The install asks for your Atlassian site, e.g. `yourcompany.atlassian.net`. Change it later in `/plugin`.
