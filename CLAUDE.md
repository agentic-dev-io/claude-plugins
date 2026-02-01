# Claude Plugins Repository

## Plugin Structure
- Each plugin in own directory with `.claude-plugin/plugin.json`
- Skills: `skills/<name>/SKILL.md` with YAML frontmatter (name, description)
- Commands: `commands/<name>.md` with argument-hint, allowed-tools
- Agents: `agents/<name>.md` with name, description, tools (comma-separated), model
- Templates: `templates/` - reusable project scaffolds and component files
- Scripts: `scripts/` - utility scripts (.sh, .ts) for setup/validation
- References: `references/` - detailed documentation loaded on demand

## Skill Description Format
- Third-person: "This skill should be used when..."
- Include trigger phrases in quotes
- Body uses imperative form, not "you should"
- Keep SKILL.md lean (~1500-2000 words), move details to references/

## marketplace.json
- Root level `.claude-plugin/marketplace.json` lists all plugins
- Each plugin has source path and skills array

## Stack Conventions
- Frontend: Next.js 15 + React 19 + Tailwind + shadcn/ui
- TypeScript: strict mode, interfaces in `types.ts`
- Package manager: bun (use bunx for CLI tools)

## Plugin Development (Official Format)

### Agent Files (agents/*.md)
- Required: `name`, `description`
- Optional: `tools` (comma-separated, NOT array), `model` (inherit/sonnet/opus/haiku)
- NO `color` field (only in interactive UI, not file format)

### Hooks (hooks/hooks.json)
- Plugin format requires wrapper: `{"hooks": {"PreToolUse": [...]}}`
- Settings format is direct (no wrapper)

### Plugin Manifest (plugin.json)
- Don't specify paths for standard directories - use auto-discovery
- Only add custom paths if using non-standard locations

### Marketplace Commands
- `claude plugin marketplace update <name>` - fetch latest from remote
- Cache doesn't auto-refresh on git push
