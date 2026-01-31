FROM docker/sandbox-templates:claude-code

# Copy plugins to a central location
COPY --chown=agent:agent . /opt/claude-plugins

# Configure Claude Code to use the plugins
# The settings.json enables plugins from the local path
RUN mkdir -p /home/agent/.claude/plugins && \
    ln -s /opt/claude-plugins/creative-frontend /home/agent/.claude/plugins/creative-frontend && \
    ln -s /opt/claude-plugins/godot-claude /home/agent/.claude/plugins/godot-claude && \
    ln -s /opt/claude-plugins/mcp-app-next-ui /home/agent/.claude/plugins/mcp-app-next-ui && \
    ln -s /opt/claude-plugins/open-responses /home/agent/.claude/plugins/open-responses && \
    ln -s /opt/claude-plugins/tool-creator /home/agent/.claude/plugins/tool-creator

# Create settings to enable plugins
RUN cat > /home/agent/.claude/settings.json << 'EOF'
{
  "plugins": {
    "enabled": true,
    "sources": [
      "/home/agent/.claude/plugins"
    ]
  }
}
EOF

# Ensure correct ownership
RUN chown -R agent:agent /home/agent/.claude

USER agent
WORKDIR /home/agent/workspace
