# Tooling

## bunx for One-Off CLI Invocations

Use bunx (or npx) for one-off CLI invocations where appropriate.

### shadcn/ui CLI

```bash
# Initialize shadcn/ui in a Next.js project
bunx shadcn@latest init

# Add individual components
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add tabs
bunx shadcn@latest add dialog
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add input
bunx shadcn@latest add form

# Add multiple components at once
bunx shadcn@latest add button card tabs dialog
```

### Next.js CLI

```bash
# Create new Next.js project
bunx create-next-app@latest my-app --typescript --tailwind --eslint --app

# With specific options
bunx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Other Useful CLIs

```bash
# Tailwind CSS
bunx tailwindcss init -p

# TypeScript
bunx tsc --init

# ESLint
bunx eslint --init

# Prettier
bunx prettier --write .
```

## Project Setup Workflow

1. Create Next.js project:
   ```bash
   bunx create-next-app@latest my-project --typescript --tailwind --eslint --app
   cd my-project
   ```

2. Initialize shadcn/ui:
   ```bash
   bunx shadcn@latest init
   ```

3. Add commonly used components:
   ```bash
   bunx shadcn@latest add button card input label
   ```

4. Install additional dependencies as needed:
   ```bash
   bun add framer-motion lucide-react
   ```

## Font Setup

### Google Fonts with Next.js

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Tailwind Config for Custom Fonts

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
      },
    },
  },
};

export default config;
```

## Animation Libraries

### Framer Motion

```bash
bun add framer-motion
```

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### CSS-Only Animations

Prefer CSS for simple animations:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
```
