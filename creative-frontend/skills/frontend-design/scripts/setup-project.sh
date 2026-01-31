#!/bin/bash
# Frontend Project Setup Script
# Creates a new Next.js project with Tailwind CSS and shadcn/ui

set -e

PROJECT_NAME=${1:-"my-app"}

echo "Creating Next.js project: $PROJECT_NAME"

# Create Next.js project
bunx create-next-app@latest "$PROJECT_NAME" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack

cd "$PROJECT_NAME"

echo "Initializing shadcn/ui..."

# Initialize shadcn/ui
bunx shadcn@latest init -y

echo "Adding common components..."

# Add commonly used components
bunx shadcn@latest add button card input label tabs dialog dropdown-menu

echo "Installing additional dependencies..."

# Install useful packages
bun add framer-motion lucide-react clsx tailwind-merge

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  bun dev"
