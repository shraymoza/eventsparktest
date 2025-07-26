import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getBookingDetails } from "../api/bookings";
import { toast } from "react-toastify";
import QRCode from "react-qr-code";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

// Helper to render QR code safely
function SafeQRCode({ value, ...props }) {
  if (typeof value !== "string")
    return <div className="text-red-500">QR code unavailable</div>;
  try {
    return <QRCode value={value} {...props} />;
  } catch (e) {
    return <div className="text-red-500">Invalid QR code</div>;
  }
}

const LOGO_URL = "/logo.png";

const BookingConfirmation = ({ user }) => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(
    location.state?.bookings || location.state?.booking || null
  );
  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState(null);
  const ticketRef = useRef();

  // Debug logs
  console.log("booking:", booking);
  console.log("event:", event);

  useEffect(() => {
    if (!booking) {
      const loadBookingDetails = async () => {
        try {
          setLoading(true);
          const data = await getBookingDetails(bookingId);
          setBooking(data);
          setEvent(data.eventId);
        } catch (err) {
          setError(err.message || "Failed to load booking details");
          toast.error("Failed to load booking details");
        } finally {
          setLoading(false);
        }
      };

      loadBookingDetails();
    }
  }, [bookingId, booking]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleViewMyTickets = () => {
    navigate("/dashboard", { state: { activeTab: "tickets" } });
  };

  // Helper to get user info from booking or event
  const getUserInfo = (bookingItem) => {
    if (bookingItem.user && typeof bookingItem.user === "object") {
      return {
        name: bookingItem.user.name || "",
        email: bookingItem.user.email || "",
        phone: bookingItem.user.phone || bookingItem.user.phoneNumber || "",
      };
    }
    // Fallback to logged-in user
    if (user) {
      return {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || user.phoneNumber || "",
      };
    }
    return {
      name: bookingItem.name || "",
      email: bookingItem.email || "",
      phone: bookingItem.phone || bookingItem.phoneNumber || "",
    };
  };

  // Helper to convert QR SVG to PNG data URL
  const getQrPngDataUrl = async (qrValue) => {
    return new Promise((resolve) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "256");
      svg.setAttribute("height", "256");
      svg.innerHTML = document.getElementById("pdf-qr-svg").innerHTML;
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new window.Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 256, 256);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgData)));
    });
  };

  const handleDownloadTicket = async () => {
    // Hide the download button before screenshot
    const downloadBtn = document.getElementById("download-ticket-btn");
    if (downloadBtn) downloadBtn.style.display = "none";

    // Wait for UI to update
    await new Promise((res) => setTimeout(res, 100));

    // Take screenshot of the ticket area
    const canvas = await html2canvas(ticketRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // Restore the download button
    if (downloadBtn) downloadBtn.style.display = "";

    // Create PDF
    const pdf = new jsPDF({ orientation: "landscape" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Generate filename based on number of tickets
    const isMultiple = Array.isArray(booking);
    const totalTickets = isMultiple ? booking.length : 1;
    const eventName = isMultiple
      ? booking[0]?.eventId?.name || event?.name
      : event?.name;
    const filename =
      totalTickets > 1
        ? `${eventName}_${totalTickets}_tickets.pdf`
        : `${eventName}_ticket.pdf`;

    pdf.save(filename);
  };

  // Helper to safely render a value
  const safeRender = (val, label) => {
    if (typeof val === "string" || typeof val === "number") return val;
    if (val === undefined || val === null) return "";
    return <span style={{ color: "red" }}>Invalid {label}</span>;
  };

  // Helper to render a single booking confirmation card
  const renderBookingCard = (
    bookingItem,
    eventItem,
    idx = 0,
    consolidatedInfo = null
  ) => {
    const userInfo = getUserInfo(bookingItem);
    const isConsolidated =
      consolidatedInfo && consolidatedInfo.totalTickets > 1;
    return (
      <div
        ref={ticketRef}
        key={bookingItem._id || idx}
        className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8"
      >
        {/* EventSpark Header and QR/User Info Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-6 w-full">
          {/* Logo and name at the very top left */}
          <div className="flex flex-col flex-1 min-w-[320px] justify-start">
            <div className="flex items-start mb-2 mt-0">
              <img
                src={LOGO_URL}
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
              Name: <span className="font-normal">{userInfo.name}</span>
            </div>
            <div className="mb-2 text-slate-700 font-semibold">
              Email: <span className="font-normal">{userInfo.email}</span>
            </div>
            <div className="mb-2 text-slate-700 font-semibold">
              Phone: <span className="font-normal">{userInfo.phone}</span>
            </div>
          </div>
          {/* QR Code and label, grouped and right-aligned */}
          <div
            className="flex flex-col items-end justify-center ml-8"
            style={{ minWidth: 180 }}
          >
            <span id="pdf-qr-svg" style={{ display: "block", marginTop: 0 }}>
              <SafeQRCode
                value={JSON.stringify({
                  eventName: eventItem?.name,
                  eventDate: eventItem?.date,
                  eventTime: eventItem?.time,
                  venue: eventItem?.venue,
                  seats: isConsolidated
                    ? consolidatedInfo.allSeats
                    : [bookingItem.seatNumber],
                  ticketCount: isConsolidated
                    ? consolidatedInfo.totalTickets
                    : 1,
                  totalPrice: isConsolidated
                    ? consolidatedInfo.totalPrice
                    : bookingItem.ticketPrice,
                  bookingId: bookingItem._id,
                  status: bookingItem.status || "Confirmed",
                  paymentStatus: bookingItem.paymentStatus,
                  userName: userInfo.name,
                  userEmail: userInfo.email,
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
                  {safeRender(eventItem.name, "event.name")}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Date & Time:</span>
                <p className="font-medium text-slate-800">
                  {safeRender(eventItem.date, "event.date")} at{" "}
                  {safeRender(formatTimeTo12Hour(eventItem.time), "event.time")}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Venue:</span>
                <p className="font-medium text-slate-800">
                  {safeRender(eventItem.venue, "event.venue")}
                </p>
              </div>
              <div>
                <span className="text-slate-600">
                  {isConsolidated ? "Seats:" : "Seat Number:"}
                </span>
                <p className="font-medium text-slate-800">
                  {isConsolidated
                    ? consolidatedInfo.allSeats.join(", ")
                    : safeRender(bookingItem.seatNumber, "booking.seatNumber")}
                </p>
              </div>
              <div>
                <span className="text-slate-600">
                  {isConsolidated ? "Total Price:" : "Ticket Price:"}
                </span>
                <p className="font-medium text-slate-800">
                  $
                  {isConsolidated
                    ? consolidatedInfo.totalPrice
                    : safeRender(
                        bookingItem.ticketPrice,
                        "booking.ticketPrice"
                      )}
                </p>
              </div>
              {isConsolidated && (
                <div>
                  <span className="text-slate-600">Number of Tickets:</span>
                  <p className="font-medium text-slate-800">
                    {consolidatedInfo.totalTickets}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If booking is an array, render consolidated view; otherwise, render single
  const isMultiple = Array.isArray(booking);
  const bookingsArray = isMultiple ? booking : [booking];
  const eventsArray = isMultiple
    ? Array.isArray(event)
      ? event
      : bookingsArray.map(() => event)
    : [event];

  // Calculate consolidated information for multiple tickets
  const totalTickets = bookingsArray.length;
  const totalPrice = bookingsArray.reduce(
    (sum, b) => sum + (b.ticketPrice || 0),
    0
  );
  const allSeats = bookingsArray.map((b) => b.seatNumber).filter(Boolean);
  const firstBooking = bookingsArray[0];
  const firstEvent = eventsArray[0] || event;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-slate-600">
              Your{" "}
              {totalTickets > 1 ? `${totalTickets} tickets have` : "ticket has"}{" "}
              been booked successfully. Check your email for confirmation.
            </p>
          </div>

          {/* Render consolidated booking card */}
          {renderBookingCard(firstBooking, firstEvent, 0, {
            totalTickets,
            totalPrice,
            allSeats,
          })}

          {/* Important Information */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              Important Information
            </h3>
            <div className="space-y-3 text-blue-700">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Please arrive 15 minutes before the event starts</span>
              </div>
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Have your QR code ready for scanning at the entrance
                </span>
              </div>
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  A confirmation email has been sent to your registered email
                  address
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownloadTicket}
                id="download-ticket-btn"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Download Ticket
              </button>
              <button
                onClick={handleViewMyTickets}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Bookings
              </button>
              <button
                onClick={handleBackToDashboard}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
