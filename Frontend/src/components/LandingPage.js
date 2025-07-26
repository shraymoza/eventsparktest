import React, { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import OrganizerPanel from "./OrganizerPanel";
import UserDashboard from "./UserDashboard";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";

const LandingPage = ({
  userRole = "user",
  userName = "User",
  user,
  onLogout,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const renderRoleBasedView = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
      case "organizer":
        return <OrganizerPanel user={user} />;
      case "user":
        return <UserDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "organizer":
        return "Event Organizer";
      case "user":
        return "Event Attendee";
      default:
        return "User";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 w-full">
        <div className="w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-2 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="text-center sm:text-right flex items-center gap-2">
                <p className="text-xs sm:text-sm text-slate-600">
                  Welcome back,
                </p>
                {/* Username bold, bigger, and profile image thumbnail */}
                <button
                  className="flex items-center gap-2 focus:outline-none group"
                  onClick={() => navigate("/profile")}
                  title="View Profile"
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  <span className="text-base sm:text-lg font-bold text-slate-800 group-hover:underline">
                    {userName}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                    {user?.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-6 h-6 text-slate-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-slate-700">
                  {getRoleDisplayName(userRole)}
                </span>
              </div>
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="ml-0 sm:ml-4 px-3 sm:px-4 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium w-full sm:w-auto"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderRoleBasedView()
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
