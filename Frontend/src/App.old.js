import React, { useState } from "react";
import "./App.css";
import LandingPage from "./components/LandingPage";

function App() {
  const [userRole, setUserRole] = useState("user"); // 'admin', 'organizer', 'user'
  const [userName, setUserName] = useState("John Doe");

  return (
    <div className="App">
      <LandingPage userRole={userRole} userName={userName} />

      {/* Role Switcher for Testing (remove in production) */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-slate-200">
        <h3 className="text-sm font-medium text-slate-800 mb-2">
          Test Role Switcher
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => setUserRole("admin")}
            className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
              userRole === "admin"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setUserRole("organizer")}
            className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
              userRole === "organizer"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Organizer
          </button>
          <button
            onClick={() => setUserRole("user")}
            className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
              userRole === "user"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            User
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
