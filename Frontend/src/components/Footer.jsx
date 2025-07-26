import React from "react";

const Footer = () => (
  <footer className="w-full bg-white border-t border-slate-200 py-4 mt-8 shadow-inner">
    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-slate-600 text-sm">
      <span>
        &copy; {new Date().getFullYear()} EventSpark. All rights reserved.
      </span>
      <span className="mt-2 sm:mt-0">
        Empowering your events, one click at a time.
      </span>
    </div>
  </footer>
);

export default Footer;
