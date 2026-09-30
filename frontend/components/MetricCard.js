export default function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value ?? "—"}</p>
    </article>
  );
}
