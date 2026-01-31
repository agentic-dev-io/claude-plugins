# Claude Plugins Repository

## Plugin Structure
- Each plugin in own directory with `.claude-plugin/plugin.json`
- Skills: `skills/<name>/SKILL.md` with YAML frontmatter (name, description)
- Commands: `commands/<name>.md` with argument-hint, allowed-tools
- Agents: `agents/<name>.md` with model, color, whenToUse, tools
- Templates: `templates/<name>/README.md`

## Skill Description Format
- Third-person: "This skill should be used when..."
- Include trigger phrases in quotes
- Body uses imperative form, not "you should"

## marketplace.json
- Root level `.claude-plugin/marketplace.json` lists all plugins
- Each plugin has source path and skills array
