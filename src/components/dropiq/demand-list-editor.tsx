"use client";

import { useState } from "react";
import type { DemandItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export function DemandListEditor({
  title,
  description,
  items,
  onChange,
}: {
  title: string;
  description: string;
  items: DemandItem[];
  onChange: (next: DemandItem[]) => void;
}) {
  const [value, setValue] = useState("");

  function add() {
    const label = value.trim();
    if (!label) return;
    const row: DemandItem = {
      id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
      label,
    };
    onChange([...items, row]);
    setValue("");
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a category label…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" className="sm:w-32" onClick={add}>
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            >
              <span className="font-medium">{item.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.label}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
