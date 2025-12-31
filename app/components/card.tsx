import React from "react";
import clsx from "clsx";

export function Card({ children, className }) {
  return (
    <div className={clsx("rounded-2xl border bg-white shadow p-4", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }) {
  return <div className={clsx("p-4", className)}>{children}</div>;
}
