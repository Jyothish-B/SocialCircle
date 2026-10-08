import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-pink-500 to-rose-600",
  "from-orange-500 to-amber-600",
  "from-teal-500 to-emerald-600",
];

const initials = (person) => {
  const source = person?.name || person?.username || "?";
  const parts = source.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
};

// The colour is derived from the id, so a person looks the same everywhere
export default function PersonAvatar({ person, size = "md", className }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-sm", lg: "w-20 h-20 text-2xl" };
  const gradient = GRADIENTS[Math.abs(Number(person?.id) || 0) % GRADIENTS.length];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0",
        gradient,
        sizes[size],
        className
      )}
    >
      {initials(person)}
    </div>
  );
}
