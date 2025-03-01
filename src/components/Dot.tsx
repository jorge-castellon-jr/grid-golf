import React from "react";
import "./Dot.css";

interface DotProps {
  size: number;
  color?: string;
  pulse?: boolean;
}

export const Dot: React.FC<DotProps> = ({
  size,
  color = "#000",
  pulse = false,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "100%",
        backgroundColor: color,
        opacity: 0.25,
        animation: pulse ? "dotPulse 2s infinite" : "none",
      }}
      className="dot"
    />
  );
};
