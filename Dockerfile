FROM docker/sandbox-templates:claude-code

# Install git for cloning official plugins
USER root
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy custom plugins
COPY --chown=agent:agent . /opt/claude-plugins/custom

# Clone official Anthropic plugins
RUN git clone --depth 1 https://github.com/anthropics/claude-plugins-official.git /opt/claude-plugins/official && \
    chown -R agent:agent /opt/claude-plugins/official

# Create plugins directory and link all plugins
RUN mkdir -p /home/agent/.claude/plugins && \
    # Custom plugins (agentic-dev-io)
    ln -s /opt/claude-plugins/custom/creative-frontend /home/agent/.claude/plugins/creative-frontend && \
    ln -s /opt/claude-plugins/custom/godot-claude /home/agent/.claude/plugins/godot-claude && \
    ln -s /opt/claude-plugins/custom/mcp-app-next-ui /home/agent/.claude/plugins/mcp-app-next-ui && \
    ln -s /opt/claude-plugins/custom/open-responses /home/agent/.claude/plugins/open-responses && \
    ln -s /opt/claude-plugins/custom/tool-creator /home/agent/.claude/plugins/tool-creator && \
    # Official external plugins (third-party integrations)
    ln -s /opt/claude-plugins/official/external_plugins/serena /home/agent/.claude/plugins/serena && \
    ln -s /opt/claude-plugins/official/external_plugins/context7 /home/agent/.claude/plugins/context7 && \
    ln -s /opt/claude-plugins/official/external_plugins/playwright /home/agent/.claude/plugins/playwright && \
    ln -s /opt/claude-plugins/official/external_plugins/github /home/agent/.claude/plugins/github && \
    # Official plugins - Dev tools
    ln -s /opt/claude-plugins/official/plugins/plugin-dev /home/agent/.claude/plugins/plugin-dev && \
    ln -s /opt/claude-plugins/official/plugins/hookify /home/agent/.claude/plugins/hookify && \
    ln -s /opt/claude-plugins/official/plugins/feature-dev /home/agent/.claude/plugins/feature-dev && \
    ln -s /opt/claude-plugins/official/plugins/agent-sdk-dev /home/agent/.claude/plugins/agent-sdk-dev && \
    ln -s /opt/claude-plugins/official/plugins/code-simplifier /home/agent/.claude/plugins/code-simplifier && \
    ln -s /opt/claude-plugins/official/plugins/claude-md-management /home/agent/.claude/plugins/claude-md-management && \
    ln -s /opt/claude-plugins/official/plugins/security-guidance /home/agent/.claude/plugins/security-guidance

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
