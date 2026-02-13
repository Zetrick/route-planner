"use client";

import { compactNumber, type StreetSegment } from "@/app/lib/planner-engine";

type CompletionSectionProps = {
  unfinishedCount: number;
  topUnfinished: string[];
  streets: StreetSegment[];
  onSetManualCompletion: (streetId: string, completed: boolean) => void;
};

export default function CompletionSection({
  unfinishedCount,
  topUnfinished,
  streets,
  onSetManualCompletion,
}: CompletionSectionProps) {
  return (
    <section className="dashboard-grid secondary-grid">
      <article className="card panel">
        <h3>Unfinished Streets Snapshot</h3>
        {topUnfinished.length === 0 ? (
          <p>Everything loaded is currently marked complete.</p>
        ) : (
          <ul className="street-list">
            {topUnfinished.map((street) => (
              <li key={street}>{street}</li>
            ))}
          </ul>
        )}
      </article>

      <article className="card panel">
        <h3>Quick Manual Toggle</h3>
        <p>{compactNumber(unfinishedCount)} segments currently unfinished.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Street</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {streets.slice(0, 30).map((street) => (
                <tr key={street.id}>
                  <td>{street.name}</td>
                  <td>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={street.completed}
                        onChange={(event) =>
                          onSetManualCompletion(street.id, event.target.checked)
                        }
                      />
                      <span>{street.completed ? "Done" : "Open"}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
