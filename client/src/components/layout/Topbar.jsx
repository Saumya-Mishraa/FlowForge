import { Menu, Search } from "lucide-react";
export default function Topbar({ title, actions, projectSwitcher }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 w-full flex-wrap items-center justify-between gap-y-2 gap-x-2 border-b border-line bg-white/90 px-3 py-2 backdrop-blur dark:border-white/10 dark:bg-ink/90 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0">
      {" "}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {" "}
        <button
          type="button"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("flowforge:open-sidebar"))
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-secondary hover:bg-primary-faint hover:text-ink md:hidden"
          aria-label="Open navigation"
        >
          {" "}
          <Menu size={21} />{" "}
        </button>{" "}
        <h1 className="truncate font-display text-base font-semibold text-ink dark:text-white sm:text-lg">
          {" "}
          {title}{" "}
        </h1>{" "}
        <div className="min-w-0">{projectSwitcher}</div>{" "}
      </div>{" "}
      <div className="flex flex-wrap shrink-0 items-center justify-end gap-2 sm:flex-nowrap sm:gap-3">
        {" "}
        <button
          className="hidden h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-ink-secondary transition-colors hover:border-primary/40 sm:flex dark:bg-ink"
          onClick={() =>
            document.dispatchEvent(
              new CustomEvent("flowforge:open-command-palette"),
            )
          }
        >
          {" "}
          <Search size={15} /> Search{" "}
          <kbd className="ml-2 rounded border border-line bg-primary-faint px-1.5 py-0.5 text-[10px] font-medium text-ink-secondary">
            {" "}
            Ctrl K{" "}
          </kbd>{" "}
        </button>{" "}
        {actions}{" "}
      </div>{" "}
    </header>
  );
}
