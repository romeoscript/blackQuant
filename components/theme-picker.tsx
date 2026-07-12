"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// value "" is the default palette; add more from tweakcn (see globals.css).
const PALETTES = [
  { value: "", label: "Default" },
  { value: "emerald", label: "Emerald" },
  { value: "violet", label: "Violet" },
];

function applyPalette(value: string) {
  const el = document.documentElement;
  el.className = el.className.replace(/\btheme-\S+/g, "").trim();
  if (value) el.classList.add(`theme-${value}`);
  // Persist so the server can render the right class on the next load (no flash).
  document.cookie = `palette=${value}; path=/; max-age=31536000`;
}

function readPalette() {
  return document.cookie.match(/(?:^|;\s*)palette=([^;]*)/)?.[1] ?? "";
}

export function ThemePicker() {
  const [palette, setPalette] = useState("");

  useEffect(() => setPalette(readPalette()), []);

  function select(value: string) {
    applyPalette(value);
    setPalette(value);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Select color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PALETTES.map(({ value, label }) => (
          <DropdownMenuItem key={value} onClick={() => select(value)}>
            {label}
            {palette === value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
