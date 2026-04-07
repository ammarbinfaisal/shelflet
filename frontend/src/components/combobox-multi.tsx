"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ComboboxMultiProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  name?: string;
  className?: string;
}

export function ComboboxMulti({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  name,
  className,
}: ComboboxMultiProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function addCustom() {
    const trimmed = search.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setSearch("");
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {name && selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex min-h-[38px] w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm",
            selected.length === 0 && "text-muted-foreground"
          )}
        >
          {selected.length > 0 ? (
            selected.map((v) => (
              <Badge
                key={v}
                variant="secondary"
                className="text-xs cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(v);
                }}
              >
                {v} &times;
              </Badge>
            ))
          ) : (
            <span className="px-1">{placeholder}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[--trigger-width] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or type new..."
              value={search}
              onValueChange={setSearch}
              autoFocus={false}
            />
            <CommandList>
              <CommandEmpty>
                {search.trim() ? (
                  <button
                    type="button"
                    className="w-full px-2 py-1.5 text-sm text-left hover:bg-muted rounded"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addCustom();
                    }}
                  >
                    Add &ldquo;{search.trim()}&rdquo;
                  </button>
                ) : (
                  "No options."
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    data-checked={selected.includes(option)}
                    onSelect={() => toggle(option)}
                  >
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
