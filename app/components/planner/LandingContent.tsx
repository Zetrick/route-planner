"use client";

type LandingContentProps = {
  usernameInput: string;
  pinInput: string;
  onUsernameChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
};

export default function LandingContent({
  usernameInput,
  pinInput,
  onUsernameChange,
  onPinChange,
  onSubmit,
}: LandingContentProps) {
  return (
    <>
      <section className="landing-hero card">
        <div className="landing-copy">
          <h2>Run Every Street With Efficient, Visual Route Planning</h2>
          <p>
            Import your completed runs, generate efficient coverage routes for maximum node completion per mile, and
            export directly to your preferred running app.
          </p>
          <div className="feature-pill-row">
            <span className="chip">Strava / Runkeeper imports</span>
            <span className="chip">OSM city loading with failover</span>
            <span className="chip">GPX + AML exports</span>
          </div>
        </div>

        <div className="card auth-card">
          <h3>Local Login</h3>
          <p>Browser-only storage with a local session cookie. No backend required.</p>
          <div className="field-grid">
            <label>
              Username
              <input
                value={usernameInput}
                onChange={(event) => onUsernameChange(event.target.value)}
                placeholder="runnername"
              />
            </label>
            <label>
              PIN
              <input
                value={pinInput}
                onChange={(event) => onPinChange(event.target.value)}
                placeholder="4+ characters"
                type="password"
              />
            </label>
          </div>
          <button className="btn btn-primary" onClick={onSubmit}>
            Sign in / Create account
          </button>
        </div>
      </section>

      <section className="landing-grid">
        <article className="card">
          <p className="card-label">Import</p>
          <h3>Bring Your Existing Progress</h3>
          <p>Upload GPX/TCX/CSV/JSON exports from your running apps and auto-mark completed streets.</p>
        </article>
        <article className="card">
          <p className="card-label">Optimize</p>
          <h3>Mileage-Based Coverage Planning</h3>
          <p>Use the mileage slider to generate routes that prioritize completing the most nodes per run.</p>
        </article>
        <article className="card">
          <p className="card-label">Visualize</p>
          <h3>Map + Draggable Route Line</h3>
          <p>Open the route planner map, see nodes visually, and drag the line to adapt your route.</p>
        </article>
      </section>
    </>
  );
}
