import { useState } from "react";

export function CopyField(props: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 600 }}>{props.label}</div>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(props.value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          style={btnStyle}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <input readOnly value={props.value} style={inputStyle} />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.35)",
  color: "white",
  padding: "10px 12px",
  borderRadius: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 12
};
