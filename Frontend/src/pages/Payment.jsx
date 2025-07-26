import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { processPayment, processBulkPayment } from "../api/bookings";
import { toast } from "react-toastify";

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Support multiple bookings
  const { bookings, event, selectedSeats } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [processing, setProcessing] = useState(false);

  // If no booking data, show error and back button
  if (!bookings || !event || !selectedSeats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Missing Booking Data
          </h2>
          <p className="text-slate-600 mb-6">
            Please start your booking again.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate total price
  const totalTicketPrice = bookings.reduce(
    (sum, b) => sum + (b.ticketPrice || 0),
    0
  );
  const serviceFee = 2 * bookings.length;
  const total = totalTicketPrice + serviceFee;

  const handlePayment = async (e) => {
    e.preventDefault();

    if (paymentMethod === "card") {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        toast.error("Please fill in all payment details");
        return;
      }
    }

    try {
      setProcessing(true);

      // Process payment for all bookings
      if (bookings.length === 1) {
        // Single booking - use regular payment
        const result = await processPayment(bookings[0]._id, paymentMethod);
        if (result.booking.paymentStatus === "completed") {
          toast.success("Payment successful! Your booking is confirmed.");
          navigate(`/booking-confirmation/${bookings[0]._id}`, {
            state: { bookings, event },
          });
        } else {
          toast.error("Payment failed. Please try again.");
        }
      } else {
        // Multiple bookings - use bulk payment
        const bookingIds = bookings.map((b) => b._id);
        const result = await processBulkPayment(bookingIds, paymentMethod);
        if (result.bookings && result.bookings.length > 0) {
          toast.success(
            `Payment successful! ${bookings.length} tickets confirmed.`
          );
          navigate(`/booking-confirmation/${bookings[0]._id}`, {
            state: { bookings: result.bookings, event: result.event },
          });
        } else {
          toast.error("Payment failed. Please try again.");
        }
      }
    } catch (error) {
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToBooking = () => {
    navigate(`/booking/${event._id}`);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBackToBooking}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors font-medium"
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
          Back to Seat Selection
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Booking Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              Complete Your Booking
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  Event Details
                </h2>
                <div className="space-y-2 text-slate-600">
                  <p>
                    <strong>Event:</strong> {event.name}
                  </p>
                  <p>
                    <strong>Date:</strong> {event.date}
                  </p>
                  <p>
                    <strong>Time:</strong> {event.time}
                  </p>
                  <p>
                    <strong>Venue:</strong> {event.venue}
                  </p>
                  <p>
                    <strong>Seats:</strong> {selectedSeats.join(", ")}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  Payment Summary
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ticket Price:</span>
                    <span className="font-medium">${totalTicketPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service Fee:</span>
                    <span className="font-medium">
                      ${serviceFee.toFixed(2)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Payment Information
            </h2>

            <form onSubmit={handlePayment} className="space-y-6">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-sm text-slate-500">
                        Visa, Mastercard, Amex
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-slate-500">
                        Pay with PayPal
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="applepay"
                      checked={paymentMethod === "applepay"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Apple Pay</div>
                      <div className="text-sm text-slate-500">Apple Pay</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card Details */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) =>
                          setExpiryDate(formatExpiryDate(e.target.value))
                        }
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) =>
                          setCvv(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="123"
                        maxLength="4"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Other Payment Methods */}
              {paymentMethod === "paypal" && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    You will be redirected to PayPal to complete your payment
                    after clicking "Pay Now".
                  </p>
                </div>
              )}

              {paymentMethod === "applepay" && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    Apple Pay will be available on supported devices. Please
                    ensure you have Apple Pay set up.
                  </p>
                </div>
              )}

              {/* Security Notice */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2 mt-0.5"
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
                  <div>
                    <p className="text-green-800 font-medium">Secure Payment</p>
                    <p className="text-green-700 text-sm">
                      Your payment information is encrypted and secure. We use
                      industry-standard SSL encryption.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleBackToBooking}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay $${total.toFixed(2)}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
