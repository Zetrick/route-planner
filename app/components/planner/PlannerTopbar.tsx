"use client";

type PlannerTopbarProps = {
  loggedIn: boolean;
  activeUsername: string | null;
  onLogout: () => void;
};

export default function PlannerTopbar({
  loggedIn,
  activeUsername,
  onLogout,
}: PlannerTopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">City Strides Route Planner</p>
        <h1>StreetSprint</h1>
      </div>
      {loggedIn && (
        <div className="topbar-actions">
          <span className="chip">{activeUsername}</span>
          <button className="btn btn-ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
