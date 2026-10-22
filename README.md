# atlassian-links

A Claude Code mod that keeps a pane beside the chat with links to the Jira cards and Confluence pages Claude touches during a session, so you can open any of them in one keypress.

```
 ▶ WORKING ON
 PROJ-123
    Fix login redirect loop

 JIRA · 2
 PROJ-98   Checkout times out on retry
 OPS-7     Rotate staging certificates

 CONFLUENCE · 1
 Release checklist

 click, or press its number with the pane focused
```

## What it shows

| Section | Comes from |
|---|---|
| **Working on** | The card the task is about. Claude adds it itself with the `track_card` tool when it starts work on a card. |
| **Jira** | Every issue Claude opens through the Atlassian connector (`getJiraIssue`, or `fetch` on an issue), newest first. |
| **Confluence** | Every page Claude opens (`getConfluencePage`, or `fetch` on a page), newest first. |

Search results, failed calls and calls you deny are not listed. The pane keeps the last 100 links and clears when the session ends.

## Usage

- The pane opens by itself on the first link. Run `/atlassian-work-items` to reopen it.
- **Terminal:** each row is a button. Click it, or focus the pane and press its number (1–9), to open the link in your default browser.
- **Desktop app and web:** rows are plain links.

## Requirements

- Claude Code with mod support.
- The **Atlassian Rovo** connector from claude.ai, connected in Claude Code. The mod reads its tool calls and never calls Atlassian itself.
- Read access to this repository, since it is private. Claude Code clones the marketplace with your git credentials.

## Install

In Claude Code, add the marketplace, install the plugin, then reload:

```
/plugin marketplace add twizck/claude-atlassian-links
/plugin install atlassian-links@claude-atlassian-links
/reload-plugins
```

Or in one command at the prompt of a terminal session:

```
/plugin install atlassian-links --marketplace twizck/claude-atlassian-links
```

From a shell:

```bash
claude plugin install atlassian-links --marketplace twizck/claude-atlassian-links
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins** → **Add marketplace** with `twizck/claude-atlassian-links` → **Add plugin**.

## Configuration

The install asks for one setting:

| Setting | Example | Notes |
|---|---|---|
| Atlassian site | `yourcompany.atlassian.net` | A leading `https://` or a trailing path is stripped. |

Change it later in `/plugin`.
