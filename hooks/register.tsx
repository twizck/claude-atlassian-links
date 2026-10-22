import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AtlassianLink } from '../types'

let SITE = ''
const PANE = 'atlassian-links'
const ROVO = 'mcp__claude_ai_Atlassian_Rovo__'
const OPENERS = [['rundll32', 'url.dll,FileProtocolHandler'], ['open'], ['xdg-open']]
const links = atom({ plugin: 'atlassian-links', key: 'items' } as const, [])

const isIssueKey = (id: string) => /^[A-Z][A-Z0-9]+-\d+$/.test(id)
const jiraUrl = (key: string) => `${SITE}/browse/${key}`
const pageUrl = (id: string) =>
  /^\d+$/.test(id) ? `${SITE}/wiki/pages/viewpage.action?pageId=${id}` : `${SITE}/wiki/x/${encodeURIComponent(id)}`
const field = (text: string | undefined, name: string) =>
  text?.match(new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`))?.[1]
const fit = (text: string, max: number) => (text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text)

function explored(tool: string, input: Record<string, unknown>, text?: string): AtlassianLink | undefined {
  const id = String(input.issueIdOrKey ?? input.pageId ?? input.id ?? '')
  if (tool === 'getConfluencePage' || (tool === 'fetch' && id.includes(':confluence:'))) {
    return { url: pageUrl(id.split('/').pop() ?? id), title: field(text, 'title'), isWorking: false }
  }
  if (tool !== 'getJiraIssue' && tool !== 'fetch') return undefined
  // fetch answers with the key inside its ARI and the summary as `title`, where getJiraIssue has `key` and `summary`.
  const key = isIssueKey(id) ? id : (field(text, 'key') ?? text?.match(/:issue\/([A-Z][A-Z0-9]+-\d+)"/)?.[1])
  const title = field(text, 'summary') ?? field(text, 'title')
  return key ? { url: jiraUrl(key), key, title, isWorking: false } : undefined
}

async function openUrl($: EngineInterface, url: string) {
  for (const opener of OPENERS) {
    try {
      return void (await $.process.run([...opener, url]))
    } catch {}
  }
  $.ui.toast(`Could not open ${url}`)
}

async function add($: EngineInterface, link: AtlassianLink) {
  const isFirst = (await read($, links)).length === 0
  await update($, links, list => {
    const old = list.find(one => one.url === link.url)
    if (!old) return [...list, link].slice(-100)
    const merged = { ...old, title: link.title ?? old.title, isWorking: old.isWorking || link.isWorking }
    return list.map(one => (one === old ? merged : one))
  })
  if (isFirst) void $.ui.open({ id: PANE, title: 'Atlassian' })
}

export const register: Register = (on, options) => {
  const host = String(options.site ?? '').trim().replace(/^https?:\/\//, '').split('/')[0]
  SITE = host ? `https://${host}` : ''

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'atlassian-work-items', description: 'Open the Atlassian links pane' })
    await $.tool.register({
      name: 'track_card',
      description:
        "Adds the Jira card you are working on to the person's Atlassian links pane. Call it once, as soon as you start working on a card (the card the task is about, not cards you only read for context), with its key.",
      inputSchema: {
        type: 'object',
        properties: { issueKey: { type: 'string', description: 'e.g. PROJ-123' } },
        required: ['issueKey'],
      },
      isDeferred: false,
    })
    return next(e)
  })

  on('command.run', { command: 'atlassian-work-items' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Atlassian' })
    return { text: 'Atlassian links pane opened.' }
  })

  on('tool.call', { tool: 'mcp__atlassian-links__track_card' }, async ($, e) => {
    const key = String((e as unknown as { issueKey?: unknown }).issueKey ?? '').trim().toUpperCase()
    if (!isIssueKey(key)) return { result: `Not a Jira issue key: ${key}` }
    await add($, { url: jiraUrl(key), key, isWorking: true })
    return { result: `${key} added to the Atlassian links pane.` }
  }).catch(() => ({ result: 'track_card failed; the pane was not updated.' }))

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (!e.tool.startsWith(ROVO) || ran.deny !== undefined || ran.isError) return ran
    const link = explored(e.tool.slice(ROVO.length), e as unknown as Record<string, unknown>, ran.text)
    if (link) await add($, link)
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Link, Button } = $.ui.resolve(e)
    const list = await read($, links)
    if (list.length === 0) return <Text dimColor> Nothing yet: cards and pages Claude opens show up here.</Text>

    const seen = list.filter(one => !one.isWorking).reverse()
    const working = list.filter(one => one.isWorking)
    const cards = seen.filter(one => one.key)
    const pages = seen.filter(one => !one.key)
    const ordered = [...working, ...cards, ...pages]
    const keyWidth = Math.max(0, ...cards.map(one => one.key?.length ?? 0))
    const room = e.props.bodyColumns - 5

    // The terminal draws a Link as its text plus the full URL where OSC 8 is unsupported, so it gets a Button.
    const row = (one: AtlassianLink, head: string, tail = '') => {
      const index = ordered.indexOf(one)
      const label = [
        <Text bold={one.isWorking} color={one.isWorking ? 'success' : 'suggestion'}>{head}</Text>,
        tail && <Text dimColor>{`  ${fit(tail, room - head.length - 2)}`}</Text>,
      ]
      return e.surface === 'terminal' ? (
        <Box paddingLeft={1}>
          <Button key={one.url} hotkey={index < 9 ? String(index + 1) : undefined} plain onPress={() => void openUrl($, one.url)}>
            {label}
          </Button>
        </Box>
      ) : (
        <Text wrap="truncate-end">
          {'   '}
          <Link href={one.url}>{label}</Link>
        </Text>
      )
    }
    const group = (title: string, items: AtlassianLink[], line: (one: AtlassianLink) => JSX.Element) =>
      items.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold dimColor>{` ${title} · ${items.length}`}</Text>
          {items.map(line)}
        </Box>
      )

    return (
      <Box flexDirection="column">
        {working.length > 0 && <Text bold color="success"> ▶ WORKING ON</Text>}
        {working.map(one => (
          <Box flexDirection="column">
            {row(one, one.key ?? '')}
            {one.title && <Text wrap="truncate-end">{`    ${one.title}`}</Text>}
          </Box>
        ))}
        {group('JIRA', cards, one => row(one, (one.key ?? '').padEnd(keyWidth), one.title))}
        {group('CONFLUENCE', pages, one => row(one, fit(one.title ?? 'Untitled page', room)))}
        {e.surface === 'terminal' && (
          <Box marginTop={1}>
            <Text dimColor> click, or press its number with the pane focused</Text>
          </Box>
        )}
      </Box>
    )
  })
}
