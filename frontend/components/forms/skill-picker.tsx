"use client";

import { Badge } from "@/components/ui/badge";
import type { Skill } from "@/types/api";

export function SkillPicker({
  skills,
  value,
  onChange
}: {
  skills: Skill[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((item) => item !== name));
      return;
    }
    onChange([...value, name]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const selected = value.includes(skill.name);
        return (
          <button
            key={skill.id}
            type="button"
            onClick={() => toggle(skill.name)}
            className="transition hover:-translate-y-0.5"
            aria-pressed={selected}
          >
            <Badge tone={selected ? "brand" : "neutral"}>{skill.name}</Badge>
          </button>
        );
      })}
    </div>
  );
}
