import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  const linkBase =
    "relative text-slate-300 hover:text-white transition font-medium pb-1";
  const linkActive =
    "text-white after:absolute after:left-0 after:-bottom-[2px] after:h-[2px] after:w-full after:bg-white after:rounded-full";

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] h-16 bg-slate-900/85 backdrop-blur border-b border-white/10">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-6">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-slate-200"
        >
          Real Mask
        </Link>

        {/* Center nav */}
        <nav className="mx-auto flex items-center gap-8">
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            Menu
          </NavLink>

          <NavLink
            to="/overlays"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            Overlays
          </NavLink>
        </nav>

        {/* Profile button */}
        <Link
          to="/account-details"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 text-white hover:bg-white/15"
          aria-label="Account"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
              fill="currentColor"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
