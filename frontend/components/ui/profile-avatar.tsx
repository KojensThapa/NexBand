import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  name: string;
  image?: string;
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "indigo" | "violet";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
  xl: "h-24 w-24 text-2xl",
};

const ICON_SIZES = {
  sm: "h-4 w-4",
  md: "h-7 w-7",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export function ProfileAvatar({
  name,
  image,
  size = "md",
  theme = "indigo",
  className,
}: ProfileAvatarProps) {
  const themeClasses =
    theme === "violet"
      ? "bg-violet-100 text-violet-600"
      : "bg-indigo-100 text-indigo-600";

  if (image) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full",
          SIZE_CLASSES[size],
          className
        )}
      >
        <Image
          src={image}
          alt={name}
          fill
          unoptimized
          className="object-cover"
        />
      </span>
    );
  }

  const initials = getInitials(name);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZE_CLASSES[size],
        themeClasses,
        className
      )}
      aria-hidden={initials !== "?"}
    >
      {initials !== "?" ? (
        initials
      ) : (
        <UserIcon className={ICON_SIZES[size]} />
      )}
    </span>
  );
}
