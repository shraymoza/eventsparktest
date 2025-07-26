import React, { useState, useEffect, useRef } from "react";

const AddEventModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    category: "",
    totalSeats: "",
    ticketPrice: "",
    dynamicPricing: {
      enabled: false,
      rules: [],
    },
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [dynamicRules, setDynamicRules] = useState([
    { threshold: 10, percentage: 10, description: "Last 10 seats" },
  ]);

  const categories = [
    "Technology",
    "Entertainment",
    "Business",
    "Arts",
    "Sports",
    "Education",
    "Health",
    "Food",
    "Movies",
    "Others",
  ];

  const fileInputRef = useRef(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const modalRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "file" ? files[0] : type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleDynamicPricingToggle = (e) => {
    const enabled = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      dynamicPricing: {
        ...prev.dynamicPricing,
        enabled,
        rules: enabled ? dynamicRules : [],
      },
    }));
  };

  const handleDynamicRuleChange = (index, field, value) => {
    const updatedRules = [...dynamicRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setDynamicRules(updatedRules);

    setFormData((prev) => ({
      ...prev,
      dynamicPricing: {
        ...prev.dynamicPricing,
        rules: prev.dynamicPricing.enabled ? updatedRules : [],
      },
    }));
  };

  const addDynamicRule = () => {
    const newRule = { threshold: 5, percentage: 5, description: "" };
    const updatedRules = [...dynamicRules, newRule];
    setDynamicRules(updatedRules);

    setFormData((prev) => ({
      ...prev,
      dynamicPricing: {
        ...prev.dynamicPricing,
        rules: prev.dynamicPricing.enabled ? updatedRules : [],
      },
    }));
  };

  const removeDynamicRule = (index) => {
    const updatedRules = dynamicRules.filter((_, i) => i !== index);
    setDynamicRules(updatedRules);

    setFormData((prev) => ({
      ...prev,
      dynamicPricing: {
        ...prev.dynamicPricing,
        rules: prev.dynamicPricing.enabled ? updatedRules : [],
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Event name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.venue.trim()) newErrors.venue = "Venue is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.totalSeats || formData.totalSeats <= 0)
      newErrors.totalSeats = "Total seats must be greater than 0";
    if (!formData.ticketPrice || formData.ticketPrice < 0)
      newErrors.ticketPrice = "Ticket price must be 0 or greater";

    // Validate dynamic pricing rules
    if (formData.dynamicPricing.enabled) {
      for (let i = 0; i < formData.dynamicPricing.rules.length; i++) {
        const rule = formData.dynamicPricing.rules[i];
        if (!rule.threshold || rule.threshold < 0) {
          newErrors[`dynamicRule${i}`] = "Threshold must be 0 or greater";
        }
        if (!rule.percentage || rule.percentage < 0) {
          newErrors[`dynamicRule${i}`] = "Percentage must be 0 or greater";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      date: "",
      time: "",
      venue: "",
      category: "",
      totalSeats: "",
      ticketPrice: "",
      dynamicPricing: {
        enabled: false,
        rules: [],
      },
      image: null,
    });
    setErrors({});
    setDynamicRules([
      { threshold: 10, percentage: 10, description: "Last 10 seats" },
    ]);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setFileInputKey(Date.now());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Trap focus inside modal when open
  useEffect(() => {
    if (!isOpen) return;
    const focusableSelectors =
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])';
    const modal = modalRef.current;
    if (!modal) return;
    const focusableEls = modal.querySelectorAll(focusableSelectors);
    if (focusableEls.length) focusableEls[0].focus();
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    modal.addEventListener("keydown", handleKeyDown);
    return () => modal.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-slate-200 bg-opacity-20 flex items-center justify-center p-4 z-50"
      tabIndex={-1}
    >
      <div className="bg-white rounded-xl shadow-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">
              Add New Event
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Enter event name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? "border-red-500" : "border-slate-300"
                }`}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Event Image
            </label>
            {!formData.image && (
              <>
                <input
                  key={fileInputKey}
                  type="file"
                  name="image"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
                  ref={fileInputRef}
                />
                <p className="text-xs text-red-500 mt-1">
                  Allowed: png, jpeg, jpg (max 2MB)
                </p>
              </>
            )}
            {formData.image && (
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Preview"
                  className="mt-2 rounded-lg max-h-32 object-contain border"
                />
                <button
                  type="button"
                  className="absolute top-2 left-0 bg-white bg-opacity-80 rounded-full p-1 shadow hover:bg-red-100 text-slate-500 hover:text-red-600"
                  style={{ lineHeight: 0 }}
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Describe your event"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="dd-mm-yyyy"
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.time ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="--:--"
              />
              {errors.time && (
                <p className="text-red-500 text-xs mt-1">{errors.time}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Seats *
              </label>
              <input
                type="number"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.totalSeats ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="100"
                min={1}
              />
              {errors.totalSeats && (
                <p className="text-red-500 text-xs mt-1">{errors.totalSeats}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Venue *
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.venue ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Enter venue address"
            />
            {errors.venue && (
              <p className="text-red-500 text-xs mt-1">{errors.venue}</p>
            )}
          </div>

          {/* Ticket Pricing */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ticket Price *
            </label>
            <input
              type="number"
              name="ticketPrice"
              value={formData.ticketPrice}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ticketPrice ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="0"
              min={0}
            />
            {errors.ticketPrice && (
              <p className="text-red-500 text-xs mt-1">{errors.ticketPrice}</p>
            )}
          </div>

          {/* Dynamic Pricing Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dynamicPricingToggle"
              checked={formData.dynamicPricing.enabled}
              onChange={handleDynamicPricingToggle}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label
              htmlFor="dynamicPricingToggle"
              className="text-sm text-slate-700"
            >
              Enable Dynamic Pricing
            </label>
          </div>

          {/* Dynamic Pricing Rules */}
          {formData.dynamicPricing.enabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 mb-1">
                <label className="text-xs font-semibold text-slate-600">
                  Threshold (seats left)
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  % Increase
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Description
                </label>
              </div>
              {dynamicRules.map((rule, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-2 items-center"
                >
                  <input
                    type="number"
                    name={`dynamicRuleThreshold-${index}`}
                    value={rule.threshold}
                    onChange={(e) =>
                      handleDynamicRuleChange(
                        index,
                        "threshold",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Threshold"
                    min={0}
                  />
                  <input
                    type="number"
                    name={`dynamicRulePercentage-${index}`}
                    value={rule.percentage}
                    onChange={(e) =>
                      handleDynamicRuleChange(
                        index,
                        "percentage",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Percentage"
                    min={0}
                  />
                  <input
                    type="text"
                    name={`dynamicRuleDescription-${index}`}
                    value={rule.description}
                    onChange={(e) =>
                      handleDynamicRuleChange(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Description"
                  />
                  <button
                    type="button"
                    onClick={() => removeDynamicRule(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    aria-label="Remove rule"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDynamicRule}
                className="text-blue-600 hover:text-blue-800 text-sm"
                aria-label="Add rule"
              >
                Add Rule
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
