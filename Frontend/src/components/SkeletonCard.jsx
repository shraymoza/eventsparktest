import React from "react";

const SkeletonCard = ({ height = 320 }) => (
  <div
    className="bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse flex flex-col min-w-0"
    style={{ height }}
  >
    <div className="h-40 sm:h-48 w-full bg-slate-200 rounded-t-xl" />
    <div className="flex-1 p-4 flex flex-col justify-between">
      <div>
        <div className="h-5 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-full mb-2" />
        <div className="h-3 bg-slate-100 rounded w-5/6 mb-2" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="h-6 w-20 bg-slate-200 rounded" />
        <div className="h-8 w-24 bg-slate-300 rounded" />
      </div>
    </div>
  </div>
);

export default SkeletonCard; 