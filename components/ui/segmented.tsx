"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

/** A row of pill options, one selected: Base UI's RadioGroup (arrow keys move between them). */
export function Segmented<T extends string | number>({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  className?: string;
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next: T) => onChange(next)}
      className={`flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-paper p-1 ring-1 ring-line [scrollbar-width:none] ${className}`}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className="shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 whitespace-nowrap text-sm font-medium text-muted transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-ink data-checked:text-cream"
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
