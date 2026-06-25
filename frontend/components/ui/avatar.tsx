import Image from "next/image";
import { initials } from "@/utils/format";

export function Avatar({ name, src, size = 40 }: { name: string; src?: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </div>
  );
}
