import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchEventById } from "../api/events";
import { toast } from "react-toastify";

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

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (err) {
        setError(err.message || "Failed to load event details");
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const handleBookNow = () => {
    navigate(`/booking/${eventId}`);
  };

  const handleBackToEvents = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Event Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            {error || "The event you're looking for doesn't exist."}
          </p>
          <button
            onClick={handleBackToEvents}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBackToEvents}
          className="flex items-center text-blue-600 underline cursor-pointer hover:text-blue-800 mb-6 transition-colors font-medium"
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
          Back to Events
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="relative h-64 md:h-80">
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {event.category}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                {event.name}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">
                      {event.date} at {formatTimeTo12Hour(event.time)}
                    </span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium">{event.venue}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
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
                    <span className="font-medium">
                      {event.totalSeats} Total Seats
                    </span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">
                      {event.totalSeats - event.soldTickets} Available Seats
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              About This Event
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {event.description}
            </p>
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Ticket Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {typeof event.currentTicketPrice === "number"
                    ? `$${event.currentTicketPrice}`
                    : typeof event.ticketPrice === "number"
                    ? `$${event.ticketPrice}`
                    : "N/A"}
                </div>
                <div className="text-slate-600">Current Price</div>
                {event.dynamicPricing?.enabled && (
                  <div className="text-xs text-orange-600 mt-1">
                    Dynamic pricing active
                  </div>
                )}
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {event.totalSeats - event.soldTickets}
                </div>
                <div className="text-slate-600">Available Seats</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {event.soldTickets}
                </div>
                <div className="text-slate-600">Tickets Sold</div>
              </div>
            </div>

            {event.dynamicPricing?.enabled &&
              event.dynamicPricing.rules?.length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">
                    Dynamic Pricing Rules
                  </h3>
                  <div className="space-y-2">
                    {event.dynamicPricing.rules.map((rule, index) => (
                      <div key={index} className="text-sm text-orange-700">
                        When {rule.threshold} or fewer seats remain: +
                        {rule.percentage}% price increase
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Booking Action */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Ready to Book?
              </h2>
              <p className="text-slate-600 mb-6">
                Select your preferred seat and complete your booking to secure
                your spot at this amazing event.
              </p>

              <button
                onClick={handleBookNow}
                disabled={event.soldTickets >= event.totalSeats}
                className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors ${
                  event.soldTickets >= event.totalSeats
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {event.soldTickets >= event.totalSeats
                  ? "Sold Out"
                  : "Book Now"}
              </button>

              {event.soldTickets >= event.totalSeats && (
                <p className="text-red-600 mt-2 text-sm">
                  This event is completely sold out
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
