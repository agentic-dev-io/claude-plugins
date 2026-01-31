# Human-in-the-Loop Patterns

Use when the UI needs to collect a choice and send it back to the LLM or backend.

## Rules

- Make the selection explicit and unambiguous
- Send the chosen value and context (id + label)
- Avoid hidden state; prefer a single source of truth
- Confirm before destructive actions

## UI Pattern

Render a list of options with stable ids. On selection, emit a payload:

```json
{
  "selection": {
    "id": "opt_123",
    "label": "Option A"
  }
}
```

## Complete Example Payload

```json
{
  "selection": {
    "id": "theme_dark_01",
    "label": "Carbon Night"
  },
  "context": {
    "screen": "theme-picker",
    "user_action": "confirm"
  }
}
```

## React Implementation

```tsx
interface SelectionPayload {
  selection: {
    id: string;
    label: string;
  };
  context?: {
    screen: string;
    user_action: string;
  };
}

function OptionPicker({
  options,
  onSelect
}: {
  options: { id: string; label: string }[];
  onSelect: (payload: SelectionPayload) => void;
}) {
  const handleSelect = (option: { id: string; label: string }) => {
    onSelect({
      selection: option,
      context: {
        screen: "option-picker",
        user_action: "confirm"
      }
    });
  };

  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleSelect(option)}
          className="p-4 border rounded-lg hover:bg-accent transition-colors"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

## Confirmation Dialog Pattern

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function ConfirmAction({
  open,
  onConfirm,
  onCancel,
  title,
  description
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
}) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```
