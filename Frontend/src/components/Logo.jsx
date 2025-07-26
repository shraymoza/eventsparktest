import React from "react";

const Logo = ({ size = 56 }) => (
  <div className="flex items-center space-x-3 select-none">
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 56 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      <rect x="0" y="4" width="40" height="24" rx="6" fill="#2563eb" />
      <circle cx="10" cy="16" r="2" fill="#fff" />
      <circle cx="20" cy="16" r="2" fill="#fff" />
      <circle cx="30" cy="16" r="2" fill="#fff" />
      <path
        d="M48 16c0-4.418 3.134-8 7-8-3.866 0-7-3.582-7-8 0 4.418-3.134 8-7 8 3.866 0 7 3.582 7 8z"
        fill="#2563eb"
        opacity=".7"
      />
    </svg>
    <span className="text-2xl font-extrabold tracking-tight text-slate-800">
      EventSpark
    </span>
  </div>
);

export default Logo;
