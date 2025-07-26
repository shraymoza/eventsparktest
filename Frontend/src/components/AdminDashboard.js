import React, { useEffect, useState, useMemo, useCallback } from "react";
import ReactModal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import * as XLSX from "xlsx";

// Helper to compare dates without timezone issues
function isSameDate(date1, date2) {
  // If date1 is a string (like "2025-07-30"), parse it properly
  let d1;
  if (typeof date1 === "string") {
    const [year, month, day] = date1.split("-").map(Number);
    d1 = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    d1 = new Date(date1);
  }

  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const AdminDashboard = () => {
  const [kpi, setKpi] = useState({
    totalUsers: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalRevenue: 0,
  });
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);

  const recentActivities = [
    {
      id: 1,
      action: "New user registered",
      user: "john@example.com",
      time: "2 minutes ago",
    },
    {
      id: 2,
      action: "Event created",
      user: "Tech Conference 2024",
      time: "15 minutes ago",
    },
    { id: 3, action: "Payment processed", user: "$150.00", time: "1 hour ago" },
    {
      id: 4,
      action: "User role updated",
      user: "admin@example.com",
      time: "2 hours ago",
    },
  ];

  // --- Manage Users State ---
  const [users, setUsers] = useState({ admin: [], organizer: [], user: [] });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "organizer",
  });
  const [addStatus, setAddStatus] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");

  // Accordion state for Manage Users modal
  const [openRoles, setOpenRoles] = useState(["admin"]);

  // Grid/List/Calendar view state for events
  const [adminEventView, setAdminEventView] = useState("list");
  const [adminEventSearch, setAdminEventSearch] = useState("");
  const [adminEventDateRange, setAdminEventDateRange] = useState([null, null]);
  const [adminCalendarEvents, setAdminCalendarEvents] = useState([]);
  const [adminEventModalOpen, setAdminEventModalOpen] = useState(false);
  const [adminEventCalendarDate, setAdminEventCalendarDate] = useState(null);

  // Add state to control modal visibility:
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Fetch users function (move outside useEffect)
  const API_URL = process.env.REACT_APP_API_URL;
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/users`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) {}
    setLoadingUsers(false);
  };

  // Fetch KPIs (users and organizers)
  const fetchKPI = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/users`);
      const data = await res.json();
      let totalUsers = 0,
        totalOrganizers = 0;
      if (data.success) {
        totalUsers = data.users.user?.length || 0;
        totalOrganizers = data.users.organizer?.length || 0;
      }
      // Fetch events for totalEvents and revenue
      let totalEvents = 0;
      let totalRevenue = 0;
      try {
        const token = localStorage.getItem("token");
        const resEv = await fetch(`${API_URL}/api/events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const dataEv = await resEv.json();
        if (dataEv.success) {
          const eventsData = dataEv.events || dataEv.data?.events || [];
          totalEvents = eventsData.length;
          totalRevenue = eventsData.reduce(
            (sum, event) => sum + (event.revenue || 0),
            0
          );
        }
      } catch {}
      setKpi({
        totalUsers,
        totalOrganizers,
        totalEvents,
        totalRevenue: totalRevenue.toLocaleString(),
      });
    } catch {}
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/events`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      // For admin, events are in data.data.events
      if (data.success && data.data && data.data.events) {
        setEvents(data.data.events);
        setPendingEvents(
          (data.data?.events || data.events || []).filter(
            (ev) => ev.status === "pending"
          )
        );
      } else if (data.success && data.events) {
        setEvents(data.events);
        setPendingEvents(
          (data.data?.events || data.events || []).filter(
            (ev) => ev.status === "pending"
          )
        );
      }
    } catch {}
  };

  useEffect(() => {
    fetchKPI();
    fetchEvents();
    fetchUsers();

    // Set up periodic refresh every 30 seconds to get updated data
    const interval = setInterval(() => {
      fetchKPI();
      fetchEvents();
      fetchUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Add user handler
  const handleAddUser = useCallback(async (e) => {
    e.preventDefault();
    setAddLoading(true);
    // Check for duplicate email in any role
    const allUsers = [
      ...(users.admin || []),
      ...(users.organizer || []),
      ...(users.user || []),
    ];
    if (
      allUsers.some(
        (u) => u.email.toLowerCase() === addForm.email.toLowerCase()
      )
    ) {
      toast.error(
        "User already exists, please change their role using the dropdown."
      );
      setAddLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invite sent successfully!");
        setAddForm({ name: "", email: "", phoneNumber: "", role: "user" });
        setShowAddModal(false);
      } else {
        toast.error(data.message || "Failed to add user");
      }
    } catch (e) {
      toast.error("Failed to add user");
    }
    setAddLoading(false);
  }, [users, addForm]);

  const handleRoleChange = useCallback(async (email, newRole) => {
    setUsers((prevUsers) => {
      let updated = { admin: [], organizer: [], user: [] };
      Object.keys(prevUsers).forEach((role) => {
        updated[role] = prevUsers[role].filter((u) => u.email !== email);
      });
      const userObj = Object.values(prevUsers)
        .flat()
        .find((u) => u.email === email);
      if (userObj) {
        updated[newRole] = [...updated[newRole], { ...userObj, role: newRole }];
      }
      return updated;
    });
    try {
      const res = await fetch(`${API_URL}/api/auth/users/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Role updated and user notified by email.");
        await fetchUsers();
      } else {
        toast.error(data.message || "Failed to update role");
        await fetchUsers();
      }
    } catch (e) {
      toast.error("Failed to update role");
      await fetchUsers();
    }
  }, []);

  // Memoized filtered events for search
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const search = adminEventSearch.toLowerCase();
      return (
        ev.name?.toLowerCase().includes(search) ||
        ev.description?.toLowerCase().includes(search) ||
        ev.venue?.toLowerCase().includes(search) ||
        ev.organizer?.name?.toLowerCase().includes(search) ||
        ev.organizer?.email?.toLowerCase().includes(search) ||
        ev.createdBy?.name?.toLowerCase().includes(search) ||
        ev.createdBy?.email?.toLowerCase().includes(search)
      );
    });
  }, [events, adminEventSearch]);

  const handleDownloadReport = () => {
    // Prepare data for Excel
    const data = filteredEvents.map((ev) => ({
      "Event Name": ev.name,
      Date: ev.date,
      Time: ev.time,
      "Ticket Price": ev.ticketPrice,
      "Sold/Available": `${ev.soldTickets || 0}/${ev.totalSeats || 0}`,
      Revenue: ev.revenue,
      "Organizer Name": ev.organizer?.name || ev.createdBy?.name || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Events");
    XLSX.writeFile(wb, "EventSpark_AdminDashboard_Report.xlsx");
  };

  return (
    <div
      className="space-y-6 w-full mx-auto"
      // style={{
      //   maxWidth: "1440px",
      //   paddingLeft: "2.5rem",
      //   paddingRight: "2.5rem",
      // }}
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Monitor your platform's performance and user activity
          </p>
        </div>
      </div>

      {/* Stats Grid (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Users
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {kpi.totalUsers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Organizers
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {kpi.totalOrganizers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Events
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {kpi.totalEvents}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-slate-800">
                ${kpi.totalRevenue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* All Events List */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            All Events
          </h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-l-lg border border-blue-500 text-sm font-medium focus:outline-none transition-colors duration-150 ${
                  adminEventView === "grid"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-blue-500 hover:bg-blue-50"
                }`}
                onClick={() => setAdminEventView("grid")}
              >
                Grid View
              </button>
              <button
                className={`px-4 py-2 border-t border-b border-blue-500 text-sm font-medium focus:outline-none transition-colors duration-150 ${
                  adminEventView === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-blue-500 hover:bg-blue-50"
                }`}
                onClick={() => setAdminEventView("list")}
              >
                List View
              </button>
              <button
                className={`px-4 py-2 rounded-r-lg border border-blue-500 text-sm font-medium focus:outline-none transition-colors duration-150 ${
                  adminEventView === "calendar"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-blue-500 hover:bg-blue-50"
                }`}
                onClick={() => setAdminEventView("calendar")}
              >
                Calendar View
              </button>
            </div>
            <div className="relative w-full md:w-72 max-w-xs ml-auto flex-shrink-0 mt-2 md:mt-0">
              <input
                type="text"
                value={adminEventSearch}
                onChange={(e) => setAdminEventSearch(e.target.value)}
                placeholder="Search events, details, organizer..."
                className="w-full px-4 py-2 border border-blue-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm pl-10"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                <FaSearch />
              </span>
            </div>
          </div>
          {/* Render based on adminEventView */}
          {adminEventView === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {filteredEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="event-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow min-w-0 cursor-pointer flex flex-col"
                  onClick={() => (window.location.href = `/event/${ev._id}`)}
                >
                  <div className="h-40 sm:h-48 w-full bg-slate-200 relative flex flex-col justify-end">
                    <img
                      src={ev.imageUrl}
                      alt={ev.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {ev.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">
                        {ev.name}
                      </h3>
                      <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-2">
                        <span className="mr-2">📅</span>
                        {ev.date} at {ev.time}
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-2">
                        <span className="mr-2">📍</span>
                        {ev.venue}
                      </div>
                      <div className="text-slate-600 text-xs sm:text-sm mb-2 line-clamp-2">
                        {ev.description}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base sm:text-lg text-slate-800">
                        {typeof ev.ticketPrice === "number"
                          ? `$${ev.ticketPrice}`
                          : ""}
                      </span>
                      <span className="text-xs text-slate-600">
                        {ev.soldTickets || 0}/{ev.totalSeats || 0} sold
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {adminEventView === "list" && (
            <div className="w-full overflow-x-auto">
              <table className="w-full table-auto text-sm border border-slate-200 rounded-lg overflow-hidden min-w-max">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold">
                      Event Name
                    </th>
                    <th className="text-left py-2 px-3 font-semibold">Date</th>
                    <th className="text-left py-2 px-3 font-semibold">Time</th>
                    <th className="text-left py-2 px-3 font-semibold">
                      Ticket Price
                    </th>
                    <th className="text-left py-2 px-3 font-semibold">
                      Sold/Available
                    </th>
                    <th className="text-left py-2 px-3 font-semibold">
                      Revenue
                    </th>
                    <th className="text-left py-2 px-3 font-semibold">
                      Organizer Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-slate-400 py-4 text-center"
                      >
                        No events found
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev, idx) => (
                      <tr
                        key={ev._id}
                        className={
                          "event-card " +
                          (idx % 2 === 0 ? "bg-white" : "bg-slate-50") +
                          " hover:bg-blue-50 transition-colors border-b border-slate-200 last:border-b-0 cursor-pointer"
                        }
                        onClick={() =>
                          (window.location.href = `/event/${ev._id}`)
                        }
                      >
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ev.name}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ev.date
                            ? new Date(ev.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ev.time ? formatTimeTo12Hour(ev.time) : "-"}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-medium">
                            ${ev.ticketPrice || 0}
                          </div>
                          {ev.dynamicPricing?.enabled && (
                            <div className="text-xs text-slate-500">
                              Dynamic pricing
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ev.soldTickets || 0}/{ev.totalSeats || 0}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-medium">
                          ${(ev.revenue || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ev.organizer?.name || ev.createdBy?.name || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {adminEventView === "calendar" && (
            <div className="flex gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex-1 flex flex-col items-center">
                <Calendar
                  onClickDay={(date) => {
                    const eventsForDate = filteredEvents.filter((ev) => {
                      return isSameDate(ev.date, date);
                    });
                    if (eventsForDate.length > 0) {
                      setAdminEventDateRange([date, date]);
                      setAdminCalendarEvents(eventsForDate);
                      setAdminEventCalendarDate(date);
                      setAdminEventModalOpen(true);
                    }
                  }}
                  tileContent={({ date, view }) => {
                    if (view === "month") {
                      const eventsForDate = filteredEvents.filter((ev) => {
                        return isSameDate(ev.date, date);
                      });
                      const hasEvents = eventsForDate.length > 0;
                      const dotColor = hasEvents
                        ? "bg-blue-400"
                        : "bg-transparent";
                      return (
                        <div className="relative group flex flex-col items-center justify-center w-full h-full">
                          <div
                            className={`mt-1 w-2 h-2 rounded-full ${dotColor}`}
                          />
                          {hasEvents && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-20 min-w-max">
                              <div className="text-center">
                                <div className="font-medium text-blue-200 mb-0.5">
                                  {eventsForDate.length} event
                                  {eventsForDate.length > 1 ? "s" : ""}
                                </div>
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-slate-900"></div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <div className="mt-4">
                  <span className="text-xs text-slate-500">
                    Click on a date to see events for that day.
                  </span>
                </div>
              </div>

              {/* Event Summary Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 w-80">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Event Summary
                </h3>
                {(() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  const monthName = new Date(
                    currentYear,
                    currentMonth
                  ).toLocaleString("default", { month: "long" });

                  const eventsInCurrentMonth = filteredEvents.filter((ev) => {
                    const eventDate = new Date(ev.date);
                    return (
                      eventDate.getMonth() === currentMonth &&
                      eventDate.getFullYear() === currentYear
                    );
                  });

                  if (eventsInCurrentMonth.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-slate-600 text-sm">
                          No events found in {monthName}, {currentYear}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          setAdminEventDateRange([new Date(), new Date()]);
                          setAdminCalendarEvents(eventsInCurrentMonth);
                          setAdminEventModalOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-800 font-medium">
                              {eventsInCurrentMonth.length} event
                              {eventsInCurrentMonth.length > 1 ? "s" : ""} found
                            </p>
                            <p className="text-blue-600 text-sm">
                              in {monthName}, {currentYear}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              className="w-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 py-2 px-4 rounded-xl border border-blue-200 shadow-sm font-semibold text-base hover:from-blue-200 hover:to-blue-300 hover:shadow-md transition-all duration-150"
              onClick={() => setShowAddModal(true)}
            >
              Manage Users
            </button>
            <div className="relative mb-6">
              <button
                className="w-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 py-2 px-4 rounded-xl border border-blue-200 shadow-sm font-semibold text-base hover:from-blue-200 hover:to-blue-300 hover:shadow-md transition-all duration-150 flex items-center justify-center relative"
                onClick={() => setShowPendingModal(true)}
              >
                Approve Events
                {pendingEvents.length > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                    {pendingEvents.length}
                  </span>
                )}
              </button>
            </div>
            <button
              className="w-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 py-2 px-4 rounded-xl border border-blue-200 shadow-sm font-semibold text-base hover:from-blue-200 hover:to-blue-300 hover:shadow-md transition-all duration-150"
              onClick={handleDownloadReport}
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Manage Users Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200 bg-opacity-20">
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-6xl"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  Manage Users
                </h2>
                <button
                  className="text-slate-500 hover:text-slate-800 text-2xl font-bold"
                  onClick={() => setShowAddModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex justify-end mb-2">
                  <button
                    className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border flex items-center gap-2"
                    onClick={async () => {
                      setRefreshStatus("loading");
                      await fetchUsers();
                      setRefreshStatus("done");
                      setTimeout(() => setRefreshStatus(""), 1500);
                    }}
                    disabled={refreshStatus === "loading"}
                  >
                    {refreshStatus === "loading" && (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                    )}
                    {refreshStatus === "loading" ? "Loading..." : "Refresh"}
                  </button>
                </div>
                {["admin", "organizer", "user"].map((role) => (
                  <div key={role} className="border rounded-lg mb-1">
                    <button
                      className={`w-full text-left px-4 py-2 flex items-center justify-between rounded-t-lg transition-colors duration-150 ${
                        openRoles.includes(role)
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-50 text-slate-700 hover:bg-blue-100"
                      }`}
                      onClick={() =>
                        setOpenRoles((prev) =>
                          prev.includes(role)
                            ? prev.filter((r) => r !== role)
                            : [...prev, role]
                        )
                      }
                      style={{
                        fontWeight: 500,
                        fontSize: "1rem",
                        letterSpacing: 0.2,
                      }}
                    >
                      <span className="capitalize flex items-center">
                        <span
                          className={`mr-2 transition-transform duration-200 ${
                            openRoles.includes(role) ? "rotate-90" : ""
                          }`}
                          style={{
                            fontSize: "0.85em",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#94a3b8",
                          }}
                        >
                          ▶
                        </span>
                        {role}s
                      </span>
                    </button>
                    {openRoles.includes(role) && (
                      <div className="overflow-x-auto px-4 pb-2">
                        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold">
                                Name
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Email
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Verified
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Joined
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Role
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {users[role]?.length > 0 &&
                              users[role].map((u, idx) => (
                                <tr
                                  key={u._id || u.email}
                                  className={
                                    (idx % 2 === 0
                                      ? "bg-white"
                                      : "bg-slate-50") +
                                    " hover:bg-blue-50 transition-colors border-b border-slate-200 last:border-b-0"
                                  }
                                >
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.name}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.email}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.verified ? "Yes" : "No"}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.createdAt
                                      ? new Date(
                                          u.createdAt
                                        ).toLocaleDateString()
                                      : "-"}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <select
                                      value={u.role}
                                      onChange={(e) =>
                                        handleRoleChange(
                                          u.email,
                                          e.target.value
                                        )
                                      }
                                      className="border rounded px-2 py-1 text-xs"
                                    >
                                      <option value="admin">Admin</option>
                                      <option value="organizer">
                                        Organizer
                                      </option>
                                      <option value="user">User</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4 text-slate-700">
                  Add User, Organizer or Admin
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border rounded px-3 py-2"
                      value={addForm.email}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full border rounded px-3 py-2"
                      value={addForm.phoneNumber}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={addForm.role}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, role: e.target.value }))
                      }
                      required
                    >
                      <option value="organizer">Organizer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-slate-200 text-slate-700"
                      onClick={() => setShowAddModal(false)}
                      disabled={addLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                      disabled={addLoading}
                    >
                      {addLoading ? "Adding..." : "Add User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200 bg-opacity-20">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
              onClick={() => setShowPendingModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Approve Events
            </h2>
            <div className="mb-2 text-blue-700 font-medium">
              Pending Events: {pendingEvents.length}
            </div>
            {pendingEvents.length === 0 ? (
              <div className="text-slate-500">No pending events.</div>
            ) : (
              <ul className="space-y-3">
                {pendingEvents.map((ev) => (
                  <li
                    key={ev._id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between bg-slate-50 rounded-lg p-4 border border-slate-200"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {ev.name}
                      </div>
                      <div className="text-xs text-slate-600">{ev.venue}</div>
                      <div className="text-xs text-slate-600">
                        {ev.date} at {ev.time}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Organizer:{" "}
                        {ev.organizer?.name || ev.createdBy?.name || "-"}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 flex gap-2">
                      <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch(`${API_URL}/api/events/${ev._id}`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ status: "approved" }),
                          });
                          toast.success("Event approved successfully.");
                          fetchEvents();
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch(`${API_URL}/api/events/${ev._id}/deny`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                          });
                          toast.success("Event denied successfully.");
                          fetchEvents();
                          setShowPendingModal(false);
                        }}
                      >
                        Deny
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Modal for events on selected date */}
      <ReactModal
        isOpen={adminEventModalOpen && adminCalendarEvents.length > 0}
        onRequestClose={() => {
          setAdminEventModalOpen(false);
          setAdminCalendarEvents([]);
        }}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
          <button
            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
            onClick={() => {
              setAdminEventModalOpen(false);
              setAdminCalendarEvents([]);
            }}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Events for{" "}
            {adminEventCalendarDate &&
              adminEventCalendarDate.toLocaleDateString()}
          </h2>
          {adminCalendarEvents.map((event) => (
            <div
              key={event._id}
              className="flex items-center gap-3 mb-4 p-2 rounded-lg border hover:shadow"
            >
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-12 h-12 object-cover rounded-lg border"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">
                  {event.name}
                </h3>
                <p className="text-sm text-slate-600">{event.venue}</p>
                <p className="text-xs text-slate-500">
                  {event.date} at {event.time}
                </p>
              </div>
              <button
                onClick={() => {
                  setAdminEventModalOpen(false);
                  window.location.href = `/event/${event._id}`;
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </ReactModal>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

// Helper to format time to 12-hour with AM/PM
function formatTimeTo12Hour(time24) {
  if (!time24) return "";
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

export default AdminDashboard;
