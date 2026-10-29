export function FlowerLoader() {
  return (
    <main className="flower-loading" aria-busy="true">
      <div className="flower-loading-content" role="status" aria-live="polite">
        <svg className="loading-flower" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
          <g transform="translate(64 64)">
            <g className="loading-flower-spin">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <path
                    className="loading-flower-petal"
                    style={{ animationDelay: `${index * 0.07}s` }}
                    d="M0 1 C-9 -6 -15 -24 -9 -36 C-5 -47 5 -47 9 -36 C15 -24 9 -6 0 1Z"
                  />
                </g>
              ))}
              <circle className="loading-flower-center" r="10" />
              <circle className="loading-flower-seed" r="3" />
            </g>
          </g>
        </svg>
        <span className="flower-loading-brand">
          UMIYA <span>FLORIST</span>
        </span>
        <p>Gathering something beautiful…</p>
      </div>
    </main>
  );
}
