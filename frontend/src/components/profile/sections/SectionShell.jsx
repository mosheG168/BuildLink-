import React from "react";

export default function SectionShell({ icon: Icon, title, actions, children }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">
          {Icon ? <Icon className="section-icon" /> : null} {title}
        </h2>
        {actions ?? null}
      </div>
      {children}
    </section>
  );
}
