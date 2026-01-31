# Claude Plugins Repository

## Plugin Structure
- Each plugin in own directory with `.claude-plugin/plugin.json`
- Skills: `skills/<name>/SKILL.md` with YAML frontmatter (name, description)
- Commands: `commands/<name>.md` with argument-hint, allowed-tools
- Agents: `agents/<name>.md` with model, color, whenToUse, tools
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
