"use client";

export type ViewportMode = "desktop" | "tablet" | "mobile";

interface ThemeStudioHeaderProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export default function ThemeStudioHeader({
  isDirty,
  isSaving,
  onSave,
}: ThemeStudioHeaderProps) {
  return (
    <header className="h-11 bg-white border-b border-gray-200 flex items-center justify-center shrink-0 relative select-none z-30">
      {/* Centered Title */}
      <h1 className="text-sm font-semibold text-gray-800 tracking-tight">
        Preview Theme
      </h1>

      {/* Unsaved indicator — subtle dot top-right */}
      {isDirty && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Chưa lưu
        </span>
      )}
    </header>
  );
}
