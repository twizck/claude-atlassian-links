export type AtlassianLink = {
  url: string
  key?: string
  title?: string
  isWorking: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'atlassian-links': { items: AtlassianLink[] }
  }
}
