import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  FolderTree,
  Workflow,
  Globe2,
  History,
  BarChart3,
  Settings,
  User,
  LogOut,
  FolderKanban,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/api-tester", label: "API Tester", icon: Send },
  { to: "/app/collections", label: "Collections", icon: FolderTree },
  { to: "/app/workflows", label: "Workflows", icon: Workflow },
  { to: "/app/environments", label: "Environments", icon: Globe2 },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];
export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { user, logout } = useAuth();
  useEffect(() => {
    const handleOpenSidebar = () => {
      setMobileMenuOpen(true);
    };
    document.addEventListener("flowforge:open-sidebar", handleOpenSidebar);
    return () => {
      document.removeEventListener("flowforge:open-sidebar", handleOpenSidebar);
    };
  }, [setMobileMenuOpen]);
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary-soft text-primary-hover" : "text-ink-secondary hover:bg-primary-faint hover:text-ink"}`;
  const handleNavigation = () => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };
  const sidebarContent = (
    <>
      {" "}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 dark:border-white/10">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-display text-sm font-semibold text-white">
            {" "}
            F{" "}
          </div>{" "}
          <span className="font-display text-[15px] font-semibold text-ink dark:text-white">
            {" "}
            FlowForge{" "}
          </span>{" "}
        </div>{" "}
        <button
          type="button"
          onClick={() => setMobileMenuOpen?.(false)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-secondary hover:bg-primary-faint hover:text-ink md:hidden"
          aria-label="Close navigation"
        >
          {" "}
          <X size={20} />{" "}
        </button>{" "}
      </div>{" "}
      <nav className="ff-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {" "}
        <div className="space-y-1">
          {" "}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClasses}
              onClick={handleNavigation}
            >
              {" "}
              <item.icon size={17} /> <span>{item.label}</span>{" "}
            </NavLink>
          ))}{" "}
        </div>{" "}
        <div className="mt-4 border-t border-line pt-4">
          {" "}
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary/70">
            {" "}
            Projects{" "}
          </p>{" "}
          <NavLink
            to="/app/projects"
            className={linkClasses}
            onClick={handleNavigation}
          >
            {" "}
            <FolderKanban size={17} /> <span>All Projects</span>{" "}
          </NavLink>{" "}
        </div>{" "}
      </nav>{" "}
      <div className="shrink-0 space-y-1 border-t border-line p-3 dark:border-white/10">
        {" "}
        <NavLink
          to="/app/settings"
          className={linkClasses}
          onClick={handleNavigation}
        >
          {" "}
          <Settings size={17} /> <span>Settings</span>{" "}
        </NavLink>{" "}
        <NavLink
          to="/app/profile"
          className={linkClasses}
          onClick={handleNavigation}
        >
          {" "}
          <User size={17} /> <span>Profile</span>{" "}
        </NavLink>{" "}
        <button
          onClick={() => {
            setMobileMenuOpen?.(false);
            logout();
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-primary-faint hover:text-danger"
        >
          {" "}
          <LogOut size={17} /> <span>Log out</span>{" "}
        </button>{" "}
        <div className="flex items-center gap-2.5 px-3 pt-2">
          {" "}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-hover">
            {" "}
            {user?.name?.[0]?.toUpperCase() || "?"}{" "}
          </div>{" "}
          <div className="min-w-0">
            {" "}
            <p className="truncate text-xs font-medium text-ink dark:text-white">
              {" "}
              {user?.name}{" "}
            </p>{" "}
            <p className="truncate text-[11px] text-ink-secondary">
              {" "}
              {user?.email}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </>
  );
  return (
    <>
      {" "}
      {/* Desktop sidebar */}{" "}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white dark:border-white/10 dark:bg-ink md:flex">
        {" "}
        {sidebarContent}{" "}
      </aside>{" "}
      {/* Mobile overlay */}{" "}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen?.(false)}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}{" "}
      {/* Mobile drawer */}{" "}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(85vw,320px)] flex-col border-r border-line bg-white shadow-xl transition-transform duration-200 dark:border-white/10 dark:bg-ink md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {" "}
        {sidebarContent}{" "}
      </aside>{" "}
    </>
  );
}
