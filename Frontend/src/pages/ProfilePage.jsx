import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { getUserBookings } from "../api/bookings";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import ReactModal from "react-modal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SkeletonCard from "../components/SkeletonCard";

const PenIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    width={18}
    height={18}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-6H3v6z"
    />
  </svg>
);

const ProfilePage = ({ user, setUser }) => {
  const [editField, setEditField] = useState("");
  const [form, setForm] = useState({
    username: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    profilePic: null,
  });
  const [preview, setPreview] = useState(user?.profilePic || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef();
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [showCurrent, setShowCurrent] = useState(true);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const ticketPreviewRef = useRef();
  const [ticketToDownload, setTicketToDownload] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTicketSelectionModal, setShowTicketSelectionModal] =
    useState(false);
  const [selectedEventForCancellation, setSelectedEventForCancellation] =
    useState(null);
  const [selectedTicketsForCancellation, setSelectedTicketsForCancellation] =
    useState([]);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      setBookingsLoading(true);
      setBookingsError("");
      try {
        const data = await getUserBookings();
        setBookings(data.data || data.bookings || data || []);
      } catch (err) {
        setBookingsError(err?.toString() || "Failed to fetch bookings");
      } finally {
        setBookingsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Save handler for each field
  const handleSave = async (field) => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      if (field === "username" && form.username !== user.name)
        formData.append("name", form.username);
      if (field === "email" && form.email !== user.email)
        formData.append("email", form.email); // backend may not support email change
      if (field === "phone" && form.phone !== user.phoneNumber)
        formData.append("phoneNumber", form.phone); // ensure phoneNumber is used
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUser(res.data.data.user);
      setMessage("Profile updated successfully!");
      setEditField("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Profile image upload handler
  const handleProfilePicClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("profilePic", file);
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUser(res.data.data.user);
      setMessage("Profile picture updated!");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to update profile picture."
      );
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditField("");
    setForm({
      username: user?.name || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
      profilePic: null,
    });
    setPreview(user?.profilePic || "");
    setMessage("");
    setError("");
  };

  // Segregate bookings
  const currentBookings = bookings.filter(
    (b) =>
      (b.status || "").toLowerCase() !== "inactive" &&
      (b.status || "").toLowerCase() !== "cancelled"
  );
  const previousBookings = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "inactive"
  );
  const cancelledBookings = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "cancelled"
  );

  const downloadTicket = async (
    booking,
    event,
    ticketCount = 1,
    allSeats = []
  ) => {
    setTicketToDownload({ booking, event, ticketCount, allSeats });
    setTimeout(async () => {
      const input = ticketPreviewRef.current;
      if (!input) return;
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const filename =
        ticketCount > 1
          ? `${event?.name || "ticket"}_${ticketCount}_tickets.pdf`
          : `${event?.name || "ticket"}_${booking.seatNumber}.pdf`;
      pdf.save(filename);
      setTicketToDownload(null);
    }, 100);
  };

  // Cancel ticket function
  const handleCancelTickets = async () => {
    if (selectedTicketsForCancellation.length === 0) return;

    setCancelling(true);
    try {
      const token = localStorage.getItem("token");
      const promises = selectedTicketsForCancellation.map((bookingId) =>
        fetch(
          `${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/cancel`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      await Promise.all(promises);

      // Refresh bookings data
      const data = await getUserBookings();
      setBookings(data.data || data.bookings || data || []);

      setShowCancelModal(false);
      setShowTicketSelectionModal(false);
      setSelectedTicketsForCancellation([]);
      setSelectedEventForCancellation(null);
      toast.success(
        `Successfully cancelled ${
          selectedTicketsForCancellation.length
        } ticket${selectedTicketsForCancellation.length > 1 ? "s" : ""}`
      );
    } catch (error) {
      toast.error("Failed to cancel tickets. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // Handle ticket selection for cancellation
  const handleTicketSelection = (bookingId) => {
    setSelectedTicketsForCancellation((prev) => {
      if (prev.includes(bookingId)) {
        return prev.filter((id) => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  // Open ticket selection modal
  const openTicketSelectionModal = (eventGroup) => {
    setSelectedEventForCancellation(eventGroup);
    setSelectedTicketsForCancellation([]);
    setShowTicketSelectionModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Replace the blue header with a white top bar and gradient background like the dashboard */}
      <header className="bg-white shadow-sm border-b border-slate-200 w-full">
        <div className="w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium mr-6"
              style={{ background: "none", border: "none", padding: 0 }}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Logo size={40} />
            </div>
          </div>
        </div>
      </header>
      {/* Profile Heading */}
      <div className="w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mt-8 mb-4">
        <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
      </div>
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl mx-auto -mt-12 p-8 flex flex-col items-center border border-slate-100">
        {/* Profile Image */}
        <div className="relative mb-4">
          <div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden cursor-pointer group"
            onClick={handleProfilePicClick}
            title="Change Profile Picture"
            style={{ position: "relative" }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl text-white opacity-80">
                +
                <svg
                  className="inline w-10 h-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                </svg>
              </span>
            )}
            <button
              className="absolute bottom-1 right-1 bg-white border-2 border-blue-500 rounded-full p-1 shadow-md hover:bg-blue-50 transition-colors"
              style={{ zIndex: 2 }}
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                handleProfilePicClick();
              }}
            >
              <PenIcon className="w-4 h-4 text-blue-500" />
            </button>
            <input
              type="file"
              name="profilePic"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleProfilePicChange}
            />
          </div>
        </div>
        {/* Greeting */}
        <div className="text-xl font-semibold mb-6">Hi, {user?.name}</div>
        {/* Info Rows */}
        <div className="w-full max-w-xl space-y-4">
          {/* Username */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium text-slate-700">Username</div>
              {editField === "username" ? (
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="mt-1 px-3 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  minLength={2}
                  maxLength={50}
                />
              ) : (
                <span className="text-slate-900 font-semibold">
                  {user?.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xs font-semibold">
                Verified
              </span>
              {editField === "username" ? (
                <>
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium mr-2"
                    onClick={() => handleSave("username")}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium border border-slate-200"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditField("username")}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full flex items-center justify-center focus:outline-none"
                  title="Edit Username"
                  aria-label="Edit Username"
                >
                  <PenIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {/* Email */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium text-slate-700">Email Address</div>
              <span className="text-slate-900 font-semibold">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xs font-semibold">
                Verified
              </span>
              {/* Email edit not implemented, so no edit button */}
            </div>
          </div>
          {/* Phone Number */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium text-slate-700">Mobile Number</div>
              {editField === "phone" ? (
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 px-3 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  minLength={8}
                  maxLength={20}
                />
              ) : (
                <span className="text-slate-900 font-semibold">
                  {user?.phoneNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xs font-semibold">
                Verified
              </span>
              {editField === "phone" ? (
                <>
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium mr-2"
                    onClick={() => handleSave("phone")}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium border border-slate-200"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditField("phone")}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full flex items-center justify-center focus:outline-none"
                  title="Edit Phone Number"
                  aria-label="Edit Phone Number"
                >
                  <PenIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Success/Error Message */}
        {message && (
          <div className="text-green-600 text-sm mt-4">{message}</div>
        )}
        {error && <div className="text-red-600 text-sm mt-4">{error}</div>}
      </div>
      {/* Bookings Section */}
      <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow p-8 border border-slate-100">
        {/* Expandable Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              showCurrent
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-transparent text-slate-500 bg-white"
            }`}
            onClick={() => {
              setShowCurrent(true);
              setShowPrevious(false);
              setShowCancelled(false);
            }}
          >
            My Bookings ({currentBookings.length})
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              showPrevious
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-transparent text-slate-500 bg-white"
            }`}
            onClick={() => {
              setShowPrevious(true);
              setShowCurrent(false);
              setShowCancelled(false);
            }}
          >
            Previous Bookings ({previousBookings.length})
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              showCancelled
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-transparent text-slate-500 bg-white"
            }`}
            onClick={() => {
              setShowCancelled(true);
              setShowCurrent(false);
              setShowPrevious(false);
            }}
          >
            Cancelled Tickets ({cancelledBookings.length})
          </button>
        </div>
        {/* My Bookings */}
        {showCurrent &&
          (bookingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} height={220} />)}
            </div>
          ) : bookingsError ? (
            <div className="text-red-600">{bookingsError}</div>
          ) : currentBookings.length === 0 ? (
            <div className="text-slate-500 text-sm">No bookings found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                // Group bookings by event
                const groupedBookings = {};
                currentBookings.forEach((booking) => {
                  const eventId = booking.eventId?._id || booking.event?._id;
                  if (eventId) {
                    if (!groupedBookings[eventId]) {
                      groupedBookings[eventId] = {
                        event: booking.eventId || booking.event,
                        bookings: [],
                        totalTickets: 0,
                        totalPrice: 0,
                        seats: [],
                      };
                    }
                    groupedBookings[eventId].bookings.push(booking);
                    groupedBookings[eventId].totalTickets += 1;
                    groupedBookings[eventId].totalPrice +=
                      booking.ticketPrice || 0;
                    if (booking.seatNumber) {
                      groupedBookings[eventId].seats.push(booking.seatNumber);
                    }
                  }
                });

                return Object.values(groupedBookings).map((group) => {
                  const event = group.event;
                  return (
                    <div
                      key={event._id}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col shadow-md"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={event?.imageUrl || "/logo.png"}
                          alt={event?.name || "Event"}
                          className="w-20 h-20 object-cover rounded-lg border border-blue-200"
                        />
                        <div>
                          <div className="font-bold text-blue-800 text-lg">
                            {event?.name}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            {event?.date} {event?.time && `at ${event.time}`}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            Venue: {event?.venue}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            Seats: {group.seats.join(", ")}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            Total: ${group.totalPrice} ({group.totalTickets}{" "}
                            ticket{group.totalTickets > 1 ? "s" : ""})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                        <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Status: {group.bookings[0].status || "Confirmed"}
                        </span>
                        <span
                          className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                            group.bookings.every(
                              (b) => b.paymentStatus === "completed"
                            )
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          Payment:{" "}
                          {group.bookings.every(
                            (b) => b.paymentStatus === "completed"
                          )
                            ? "Paid"
                            : "Pending"}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col items-center">
                        <QRCodeSVG
                          value={JSON.stringify({
                            eventName: event?.name,
                            eventDate: event?.date,
                            eventTime: event?.time,
                            venue: event?.venue,
                            seats: group.seats,
                            ticketCount: group.totalTickets,
                            totalPrice: group.totalPrice,
                            bookingId: group.bookings[0]._id,
                            status: group.bookings[0].status || "Confirmed",
                            paymentStatus: group.bookings[0].paymentStatus,
                          })}
                          size={96}
                        />
                        <div className="text-xs text-slate-500 mt-2">
                          Booking Date:{" "}
                          {new Date(
                            group.bookings[0].bookingDate ||
                              group.bookings[0].createdAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex justify-center mt-2 gap-2">
                        <button
                          onClick={() =>
                            downloadTicket(
                              group.bookings[0],
                              event,
                              group.totalTickets,
                              group.seats
                            )
                          }
                          className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm inline-block w-fit"
                        >
                          Download Tickets
                        </button>
                        <button
                          onClick={() => openTicketSelectionModal(group)}
                          className="bg-red-600 text-white px-3 py-1 rounded-full font-medium hover:bg-red-700 transition-colors text-sm inline-block w-fit"
                        >
                          Cancel Tickets
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ))}
        {/* Previous Bookings */}
        {showPrevious &&
          (bookingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} height={220} />)}
            </div>
          ) : bookingsError ? (
            <div className="text-red-600">{bookingsError}</div>
          ) : previousBookings.length === 0 ? (
            <div className="text-slate-500 text-sm">
              No previous bookings found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {previousBookings.map((booking) => {
                const event = booking.eventId || booking.event;
                return (
                  <div
                    key={booking._id}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col shadow-md"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={event?.imageUrl || "/logo.png"}
                        alt={event?.name || "Event"}
                        className="w-20 h-20 object-cover rounded-lg border border-blue-200"
                      />
                      <div>
                        <div className="font-bold text-blue-800 text-lg">
                          {event?.name}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          {event?.date} {event?.time && `at ${event.time}`}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Venue: {event?.venue}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Seat: {booking.seatNumber}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Price: ${booking.ticketPrice}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Status: {booking.status || "Confirmed"}
                      </span>
                      <span
                        className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                          booking.paymentStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        Payment:{" "}
                        {booking.paymentStatus === "completed"
                          ? "Paid"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col items-center">
                      <QRCodeSVG value={booking.qrCode} size={96} />
                      <div className="text-xs text-slate-500 mt-2">
                        Booking Date:{" "}
                        {new Date(
                          booking.bookingDate || booking.createdAt
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => downloadTicket(booking, event)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm inline-block w-fit"
                      >
                        Download Ticket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        {/* Cancelled Tickets */}
        {showCancelled &&
          (bookingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} height={220} />)}
            </div>
          ) : bookingsError ? (
            <div className="text-red-600">{bookingsError}</div>
          ) : cancelledBookings.length === 0 ? (
            <div className="text-slate-500 text-sm">
              No cancelled tickets found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                // Group cancelled bookings by event
                const groupedCancelledBookings = {};
                cancelledBookings.forEach((booking) => {
                  const eventId = booking.eventId?._id || booking.event?._id;
                  if (eventId) {
                    if (!groupedCancelledBookings[eventId]) {
                      groupedCancelledBookings[eventId] = {
                        event: booking.eventId || booking.event,
                        bookings: [],
                        totalTickets: 0,
                        totalPrice: 0,
                        seats: [],
                      };
                    }
                    groupedCancelledBookings[eventId].bookings.push(booking);
                    groupedCancelledBookings[eventId].totalTickets += 1;
                    groupedCancelledBookings[eventId].totalPrice +=
                      booking.ticketPrice || 0;
                    if (booking.seatNumber) {
                      groupedCancelledBookings[eventId].seats.push(
                        booking.seatNumber
                      );
                    }
                  }
                });

                return Object.values(groupedCancelledBookings).map((group) => {
                  const event = group.event;
                  return (
                    <div
                      key={event._id}
                      className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col shadow-md"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={event?.imageUrl || "/logo.png"}
                          alt={event?.name || "Event"}
                          className="w-20 h-20 object-cover rounded-lg border border-red-200"
                        />
                        <div>
                          <div className="font-bold text-red-800 text-lg">
                            {event?.name}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            {event?.date} {event?.time && `at ${event.time}`}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            Venue: {event?.venue}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            Seats: {group.seats.join(", ")}
                          </div>
                          <div className="text-slate-700 text-sm mb-1">
                            Total: ${group.totalPrice} ({group.totalTickets}{" "}
                            ticket{group.totalTickets > 1 ? "s" : ""})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                        <span className="inline-block bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Status: Cancelled
                        </span>
                        <span
                          className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                            group.bookings.every(
                              (b) => b.paymentStatus === "completed"
                            )
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          Payment:{" "}
                          {group.bookings.every(
                            (b) => b.paymentStatus === "completed"
                          )
                            ? "Paid"
                            : "Pending"}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col items-center">
                        <QRCodeSVG
                          value={JSON.stringify({
                            eventName: event?.name,
                            eventDate: event?.date,
                            eventTime: event?.time,
                            venue: event?.venue,
                            seats: group.seats,
                            ticketCount: group.totalTickets,
                            totalPrice: group.totalPrice,
                            bookingId: group.bookings[0]._id,
                            status: "Cancelled",
                            paymentStatus: group.bookings[0].paymentStatus,
                          })}
                          size={96}
                        />
                        <div className="text-xs text-slate-500 mt-2">
                          Cancelled Date:{" "}
                          {new Date(
                            group.bookings[0].updatedAt ||
                              group.bookings[0].createdAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ))}
      </div>
      {ticketToDownload && (
        <div style={{ position: "absolute", left: -9999, top: 0 }}>
          <div
            ref={ticketPreviewRef}
            className="bg-white rounded-xl shadow-lg p-6 md:p-8"
            style={{
              width: "1000px",
              height: "700px",
              fontFamily: "Inter, Arial, sans-serif",
            }}
          >
            {/* EventSpark Header and QR/User Info Row */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-6 w-full">
              {/* Logo and name at the very top left */}
              <div className="flex flex-col flex-1 min-w-[320px] justify-start">
                <div className="flex items-start mb-2 mt-0">
                  <img
                    src="/logo.png"
                    alt="EventSpark Logo"
                    style={{ width: 48, height: 48, marginRight: 16 }}
                  />
                  <span
                    className="text-2xl font-extrabold tracking-tight text-slate-800"
                    style={{ lineHeight: 1.1 }}
                  >
                    EventSpark
                  </span>
                </div>
                <div className="mb-2 text-slate-700 font-semibold">
                  Name: <span className="font-normal">{user?.name}</span>
                </div>
                <div className="mb-2 text-slate-700 font-semibold">
                  Email: <span className="font-normal">{user?.email}</span>
                </div>
                <div className="mb-2 text-slate-700 font-semibold">
                  Phone:{" "}
                  <span className="font-normal">
                    {user?.phone || user?.phoneNumber || "N/A"}
                  </span>
                </div>
              </div>
              {/* QR Code and label, grouped and right-aligned */}
              <div
                className="flex flex-col items-end justify-center ml-8"
                style={{ minWidth: 180 }}
              >
                <span
                  id="pdf-qr-svg"
                  style={{ display: "block", marginTop: 0 }}
                >
                  <QRCodeSVG
                    value={JSON.stringify({
                      eventName: ticketToDownload.event?.name,
                      eventDate: ticketToDownload.event?.date,
                      eventTime: ticketToDownload.event?.time,
                      venue: ticketToDownload.event?.venue,
                      seats:
                        ticketToDownload.ticketCount > 1
                          ? ticketToDownload.allSeats
                          : [ticketToDownload.booking.seatNumber],
                      ticketCount: ticketToDownload.ticketCount,
                      totalPrice:
                        ticketToDownload.ticketCount > 1
                          ? ticketToDownload.booking.ticketPrice *
                            ticketToDownload.ticketCount
                          : ticketToDownload.booking.ticketPrice,
                      bookingId: ticketToDownload.booking._id,
                      status: ticketToDownload.booking.status || "Confirmed",
                      paymentStatus: ticketToDownload.booking.paymentStatus,
                    })}
                    size={128}
                  />
                </span>
                <span className="text-base text-slate-700 font-semibold text-right mt-4">
                  Your QR Code
                </span>
                <span className="text-sm text-slate-600 text-right">
                  Save this QR code or show it on your phone
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Event Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-600">Event:</span>
                    <p className="font-medium text-slate-800">
                      {ticketToDownload.event?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Date & Time:</span>
                    <p className="font-medium text-slate-800">
                      {ticketToDownload.event?.date} at{" "}
                      {ticketToDownload.event?.time}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Venue:</span>
                    <p className="font-medium text-slate-800">
                      {ticketToDownload.event?.venue}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">
                      {ticketToDownload.ticketCount > 1
                        ? "Seats:"
                        : "Seat Number:"}
                    </span>
                    <p className="font-medium text-slate-800">
                      {ticketToDownload.ticketCount > 1
                        ? ticketToDownload.allSeats.join(", ")
                        : ticketToDownload.booking.seatNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">
                      {ticketToDownload.ticketCount > 1
                        ? "Total Price:"
                        : "Ticket Price:"}
                    </span>
                    <p className="font-medium text-slate-800">
                      $
                      {ticketToDownload.ticketCount > 1
                        ? ticketToDownload.booking.ticketPrice *
                          ticketToDownload.ticketCount
                        : ticketToDownload.booking.ticketPrice}
                    </p>
                  </div>
                </div>
              </div>
              {/* Booking Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Booking Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-600">Booking ID:</span>
                    <p className="font-medium text-slate-800">
                      {ticketToDownload.booking._id}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Status:</span>
                    <p className="font-medium text-slate-800">
                      {ticketToDownload.booking.status || "Confirmed"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Payment Status:</span>
                    <p className="font-medium text-slate-800">
                      {ticketToDownload.booking.paymentStatus === "completed"
                        ? "Paid"
                        : "Pending"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Booking Date:</span>
                    <p className="font-medium text-slate-800">
                      {new Date(
                        ticketToDownload.booking.bookingDate ||
                          ticketToDownload.booking.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {ticketToDownload.ticketCount > 1 && (
                    <div>
                      <span className="text-slate-600">Number of Tickets:</span>
                      <p className="font-medium text-slate-800">
                        {ticketToDownload.ticketCount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Selection Modal */}
      <ReactModal
        isOpen={showTicketSelectionModal}
        onRequestClose={() => {
          setShowTicketSelectionModal(false);
          setSelectedEventForCancellation(null);
          setSelectedTicketsForCancellation([]);
        }}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative max-h-[80vh] overflow-y-auto">
          <button
            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
            onClick={() => {
              setShowTicketSelectionModal(false);
              setSelectedEventForCancellation(null);
              setSelectedTicketsForCancellation([]);
            }}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Select Tickets to Cancel
          </h2>
          {selectedEventForCancellation && (
            <>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  {selectedEventForCancellation.event?.name}
                </h3>
                <p className="text-sm text-blue-700">
                  {selectedEventForCancellation.event?.date} at{" "}
                  {selectedEventForCancellation.event?.time}
                </p>
                <p className="text-sm text-blue-700">
                  Venue: {selectedEventForCancellation.event?.venue}
                </p>
              </div>
              <div className="space-y-3 mb-6">
                {selectedEventForCancellation.bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={(e) => {
                      if (e.target.type !== "checkbox") {
                        handleTicketSelection(booking._id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTicketsForCancellation.includes(
                          booking._id
                        )}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleTicketSelection(booking._id);
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-slate-800">
                          Seat {booking.seatNumber}
                        </p>
                        <p className="text-sm text-slate-600">
                          ${booking.ticketPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-6 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">
                  Selected: {selectedTicketsForCancellation.length} ticket
                  {selectedTicketsForCancellation.length !== 1 ? "s" : ""}
                </span>
                <span className="font-semibold text-slate-800">
                  Total Value: $
                  {selectedTicketsForCancellation.reduce((sum, bookingId) => {
                    const booking = selectedEventForCancellation.bookings.find(
                      (b) => b._id === bookingId
                    );
                    return sum + (booking?.ticketPrice || 0);
                  }, 0)}
                </span>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowTicketSelectionModal(false);
                    setSelectedEventForCancellation(null);
                    setSelectedTicketsForCancellation([]);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedTicketsForCancellation.length > 0) {
                      setShowTicketSelectionModal(false);
                      setShowCancelModal(true);
                    }
                  }}
                  disabled={selectedTicketsForCancellation.length === 0}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </ReactModal>

      {/* Cancel Tickets Modal */}
      <ReactModal
        isOpen={showCancelModal}
        onRequestClose={() => {
          setShowCancelModal(false);
          setSelectedTicketsForCancellation([]);
        }}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
          <button
            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
            onClick={() => {
              setShowCancelModal(false);
              setSelectedTicketsForCancellation([]);
            }}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Cancel Tickets
          </h2>
          <p className="text-slate-600 mb-4">
            Are you sure you want to cancel{" "}
            {selectedTicketsForCancellation.length} ticket
            {selectedTicketsForCancellation.length > 1 ? "s" : ""}?
          </p>
          <p className="text-sm text-slate-500 mb-6">
            This action cannot be undone. Cancelled tickets may be subject to
            refund policies.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowCancelModal(false);
                setSelectedTicketsForCancellation([]);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
              disabled={cancelling}
            >
              Keep Tickets
            </button>
            <button
              onClick={handleCancelTickets}
              disabled={cancelling}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Tickets"}
            </button>
          </div>
        </div>
      </ReactModal>

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default ProfilePage;
