#!/bin/bash
# Batch add shadcn/ui components
# Run from project root

set -e

echo "Adding shadcn/ui components..."

# Core components
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add input
bunx shadcn@latest add label

# Navigation
bunx shadcn@latest add tabs
bunx shadcn@latest add navigation-menu
bunx shadcn@latest add dropdown-menu

# Feedback
bunx shadcn@latest add dialog
bunx shadcn@latest add alert
bunx shadcn@latest add toast

# Form
bunx shadcn@latest add form
bunx shadcn@latest add select
bunx shadcn@latest add checkbox
bunx shadcn@latest add switch

# Layout
bunx shadcn@latest add separator
bunx shadcn@latest add scroll-area
bunx shadcn@latest add sheet

echo "Components added successfully!"
