import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAvailableSeats,
  createBooking,
  bulkCreateBooking,
} from "../api/bookings";
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

// Helper to render circular seat map for sports with multiple rings
function CircularSeatMap({ seats, selectedSeats, onSelect }) {
  // Decide number of rings (rows) based on total seats
  const totalSeats = seats.length;
  let numRings = 3;
  if (totalSeats > 40) numRings = 4;
  if (totalSeats > 80) numRings = 5;

  // Distribute seats among rings (outer ring has more seats)
  // Outer rings get more seats for stadium effect
  const seatsPerRing = [];
  let remaining = totalSeats;
  let base = Math.floor(totalSeats / ((numRings * (numRings + 1)) / 2)); // Triangular number distribution
  let sum = 0;
  for (let i = 1; i <= numRings; i++) {
    const count = base * i;
    seatsPerRing.push(count);
    sum += count;
  }
  // Distribute any remainder
  let i = 0;
  while (sum < totalSeats) {
    seatsPerRing[seatsPerRing.length - 1 - (i % numRings)]++;
    sum++;
    i++;
  }

  // Build seat objects for each ring
  const rings = [];
  let seatIdx = 0;
  for (let r = 0; r < numRings; r++) {
    const ringSeats = [];
    for (let s = 0; s < seatsPerRing[r]; s++) {
      if (seatIdx < seats.length) {
        ringSeats.push(seats[seatIdx]);
        seatIdx++;
      }
    }
    rings.push(ringSeats);
  }

  // Stadium layout
  const containerSize = 520;
  const center = containerSize / 2;
  const baseRadius = 110;
  const ringGap = 45;
  const seatSize = 32;
  const seatGap = 2;

  return (
    <div
      style={{
        width: "100%",
        height: containerSize,
        overflowY: "auto",
        overflowX: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 50,
        paddingBottom: 50,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          width: containerSize,
          height: containerSize,
          margin: "0 auto",
        }}
      >
        {/* Drawing faint rings for stadium effect */}
        {rings.map((ringSeats, rIdx) => {
          const radius = baseRadius + rIdx * ringGap;
          return (
            <div
              key={rIdx}
              style={{
                position: "absolute",
                left: center - radius,
                top: center - radius,
                width: radius * 2,
                height: radius * 2,
                borderRadius: "50%",
                border: "1.5px dashed #e5e7eb",
                zIndex: 0,
              }}
            />
          );
        })}
        {/* GROUND label at center */}
        <div
          style={{
            position: "absolute",
            left: center - 50,
            top: center - 30,
            width: 100,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f3f4f6",
            borderRadius: 30,
            fontWeight: 700,
            color: "#2563eb",
            fontSize: 20,
            zIndex: 1,
            border: "2px solid #cbd5e1",
          }}
        >
          GROUND
        </div>
        {rings.map((ringSeats, rIdx) => {
          const radius = baseRadius + rIdx * ringGap;
          const n = ringSeats.length;
          // Calculate angle so seats are tangent (touching)
          const angleStep = (2 * Math.PI) / n;
          const seatArc = (seatSize / (radius * Math.PI)) * Math.PI; // arc length for seat
          return ringSeats.map((seat, i) => {
            const angle = i * angleStep;
            const x = center + radius * Math.cos(angle) - seatSize / 2;
            const y = center + radius * Math.sin(angle) - seatSize / 2;
            const isSelected = selectedSeats.includes(seat.seatNumber);
            return (
              <button
                key={seat.seatNumber}
                onClick={() => onSelect(seat)}
                disabled={!seat.isAvailable}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: seatSize,
                  height: seatSize,
                  borderRadius: "50%",
                  background: !seat.isAvailable
                    ? "#ef4444"
                    : isSelected
                    ? "#2563eb"
                    : "#22c55e",
                  color: "white",
                  border: isSelected ? "2px solid #93c5fd" : "none",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: seat.isAvailable ? "pointer" : "not-allowed",
                  boxShadow: isSelected ? "0 0 0 2px #2563eb33" : undefined,
                  zIndex: 2,
                  transition: "background 0.2s",
                  padding: 0,
                  margin: seatGap / 2,
                }}
              >
                {seat.seatNumber}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}

const Booking = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEventAndSeats = async () => {
      try {
        setLoading(true);
        const [eventData, seatsData] = await Promise.all([
          fetchEventById(eventId),
          getAvailableSeats(eventId),
        ]);
        setEvent(eventData);
        setAvailableSeats(seatsData.availableSeats);
      } catch (err) {
        setError(err.message || "Failed to load booking information");
        toast.error("Failed to load booking information");
      } finally {
        setLoading(false);
      }
    };

    loadEventAndSeats();
  }, [eventId]);

  const handleSeatSelection = (seat) => {
    if (!seat.isAvailable) return;
    setSelectedSeats((prev) => {
      if (prev.includes(seat.seatNumber)) {
        return prev.filter((s) => s !== seat.seatNumber);
      } else {
        return [...prev, seat.seatNumber];
      }
    });
  };

  const handleProceedToPayment = async () => {
    if (!selectedSeats.length) {
      toast.error("Please select at least one seat");
      return;
    }
    try {
      setBookingLoading(true);
      // Use bulk booking API
      const bookingData = await bulkCreateBooking(eventId, selectedSeats);
      toast.success("Seats reserved! Proceeding to payment...");
      navigate(`/payment/${bookingData.bookings[0]._id}`, {
        state: {
          bookings: bookingData.bookings,
          event,
          selectedSeats,
        },
      });
    } catch (err) {
      toast.error(err.message || "Failed to reserve seats");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBackToEvent = () => {
    navigate(`/event/${eventId}`);
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
            Booking Error
          </h2>
          <p className="text-slate-600 mb-6">
            {error || "Unable to load booking information."}
          </p>
          <button
            onClick={handleBackToEvent}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  // Group seats by row for better display
  const seatsByRow = {};
  availableSeats.forEach((seat) => {
    const row = seat.seatNumber.charAt(0);
    if (!seatsByRow[row]) {
      seatsByRow[row] = [];
    }
    seatsByRow[row].push(seat);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBackToEvent}
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
          Back to Event
        </button>

        <div className="max-w-6xl mx-auto">
          {/* Event Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                  {event.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-slate-600">
                  <span>
                    📅 {event.date} at {formatTimeTo12Hour(event.time)}
                  </span>
                  <span>📍 {event.venue}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {typeof event.currentTicketPrice === "number"
                    ? `$${event.currentTicketPrice}`
                    : typeof event.ticketPrice === "number"
                    ? `$${event.ticketPrice}`
                    : "N/A"}
                </div>
                <div className="text-sm text-slate-600">per ticket</div>
                {event.dynamicPricing?.enabled && (
                  <div className="text-xs text-orange-600 mt-1">
                    Dynamic pricing active
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Select Your Seat
            </h2>

            {/* Seat Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded mr-2"></div>
                <span className="text-sm text-slate-600">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded mr-2"></div>
                <span className="text-sm text-slate-600">Booked</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm text-slate-600">Selected</span>
              </div>
            </div>

            {/* Seat Map */}
            {event.category?.toLowerCase() === "sports" ? (
              <div className="mb-8">
                <CircularSeatMap
                  seats={availableSeats}
                  selectedSeats={selectedSeats}
                  onSelect={handleSeatSelection}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Stage/Screen Indicator */}
                  <div className="text-center mb-8">
                    <div className="inline-block bg-slate-200 px-8 py-3 rounded-lg">
                      <span className="text-slate-600 font-medium">
                        {event.category?.toLowerCase() === "movies"
                          ? "SCREEN"
                          : "STAGE"}
                      </span>
                    </div>
                  </div>
                  {/* Seats Grid */}
                  <div className="space-y-4">
                    {Object.entries(seatsByRow).map(([row, seats]) => (
                      <div key={row} className="flex justify-center">
                        <div className="flex gap-2">
                          <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-slate-500">
                            {row}
                          </div>
                          {seats.map((seat) => (
                            <button
                              key={seat.seatNumber}
                              onClick={() => handleSeatSelection(seat)}
                              disabled={!seat.isAvailable}
                              className={`w-12 h-12 rounded-lg text-sm font-medium transition-all ${
                                !seat.isAvailable
                                  ? "bg-red-500 text-white cursor-not-allowed"
                                  : selectedSeats.includes(seat.seatNumber)
                                  ? "bg-blue-500 text-white ring-2 ring-blue-300"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
                            >
                              {seat.seatNumber.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Seat Info */}
            {selectedSeats.length > 0 ? (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Selected Seats
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      Seat {seat.slice(1)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-700">
                    Total: {selectedSeats.length} seats
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {typeof event.currentTicketPrice === "number"
                      ? `$${event.currentTicketPrice * selectedSeats.length}`
                      : typeof event.ticketPrice === "number"
                      ? `$${event.ticketPrice * selectedSeats.length}`
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Selected Seat
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">
                    Seat {selectedSeats.slice(1)}
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {typeof event.currentTicketPrice === "number"
                      ? `$${event.currentTicketPrice}`
                      : typeof event.ticketPrice === "number"
                      ? `$${event.ticketPrice}`
                      : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  Booking Summary
                </h3>
                <div className="text-slate-600">
                  {selectedSeats.length > 0 ? (
                    <>
                      Seats {selectedSeats.join(", ")} •{" "}
                      {typeof event.currentTicketPrice === "number"
                        ? `$${event.currentTicketPrice * selectedSeats.length}`
                        : typeof event.ticketPrice === "number"
                        ? `$${event.ticketPrice * selectedSeats.length}`
                        : "N/A"}
                    </>
                  ) : (
                    "Please select at least one seat to continue"
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBackToEvent}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedSeats.length || bookingLoading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    !selectedSeats.length || bookingLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {bookingLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
