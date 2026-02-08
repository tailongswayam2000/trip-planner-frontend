import React, { useEffect, useMemo, useState } from "react";
import "./index.css";
import "./Timeline.css";
import { tripAPI, placesAPI, itineraryAPI } from "./services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
import ExpensesPage from "./ExpensesPage";
// autoTable is imported via side-effect for jsPDF plugin
import "jspdf-autotable";

const categories = [
  "stay",
  "historical",
  "restaurant",
  "shopping",
  "nature",
  "adventure",
  "cultural",
  "entertainment",
];
// const travelModes = ["flight", "train", "car", "bus", "other"];

const getDateRange = (start, end) => {
  if (!start || !end) return [];
  const out = [];
  const s = new Date(start);
  const e = new Date(end);
  let d = new Date(s);
  while (d <= e) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const categoryColor = (category) => {
  const colors = {
    historical: "bg-[#c9a37c]/20 text-[#c9a37c]", // Tan with transparency
    restaurant: "bg-[#7bbbff]/20 text-[#7bbbff]", // Sky Blue with transparency
    shopping: "bg-[#9ed454]/20 text-[#9ed454]", // Lime Green with transparency
    nature: "bg-[#bcf5ff]/20 text-[#bcf5ff]", // Pale Cyan with transparency
    adventure: "bg-[#5c55e1]/20 text-[#5c55e1]", // Medium Slate Blue with transparency
    cultural: "bg-[#7bbbff]/20 text-[#7bbbff]", // Sky Blue with transparency
    entertainment: "bg-[#9ed454]/20 text-[#9ed454]", // Lime Green with transparency
  };
  return colors[category] || "bg-gray-100 text-gray-800";
};

const Home = ({
  allTrips,
  onSelectTrip,
  onDeleteTrip,
  handleTripSubmit,
  tripForm,
  setTripForm,
  onJoinTrip,
}) => {
  const [activeTab, setActiveTab] = useState("join"); // "join" | "create" | "recover" | "mytrips"
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Security question state
  const [securityChallenge, setSecurityChallenge] = useState(null);
  const [securityAnswer, setSecurityAnswer] = useState("");

  // Recovery state - two step flow
  const [recoverForm, setRecoverForm] = useState({ name: "", destination: "", answer: "" });
  const [recoveryQuestion, setRecoveryQuestion] = useState(null); // null = step 1, string = step 2
  const [recoverResult, setRecoverResult] = useState(null);
  const [recoverError, setRecoverError] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setJoinError("");
    setJoinLoading(true);
    try {
      const result = await onJoinTrip(joinCode.toLowerCase().trim());
      if (result.requiresSecurityAnswer) {
        setSecurityChallenge(result);
      }
      // If successful without security, onJoinTrip handles navigation
    } catch (err) {
      setJoinError(err.response?.data?.error || "Failed to find trip. Check your code.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setJoinError("");
    setJoinLoading(true);
    try {
      await onJoinTrip(joinCode, securityChallenge.tripId, securityAnswer);
      setSecurityChallenge(null);
      setSecurityAnswer("");
    } catch (err) {
      setJoinError(err.response?.data?.error || "Incorrect answer. Please try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  // Step 1: Lookup trip and get recovery question
  const handleRecoverLookup = async (e) => {
    e.preventDefault();
    setRecoverError("");
    setRecoverResult(null);
    setRecoverLoading(true);
    try {
      const res = await tripAPI.getRecoveryQuestion(recoverForm.name, recoverForm.destination);
      if (res.data.isLegacy) {
        // Legacy trip - show code directly
        setRecoverResult(res.data);
      } else {
        // Show the question for step 2
        setRecoveryQuestion(res.data.recoveryQuestion);
      }
    } catch (err) {
      setRecoverError(err.response?.data?.error || "Could not find trip.");
    } finally {
      setRecoverLoading(false);
    }
  };

  // Step 2: Submit recovery answer
  const handleRecoverSubmit = async (e) => {
    e.preventDefault();
    setRecoverError("");
    setRecoverLoading(true);
    try {
      const res = await tripAPI.recoverCode(recoverForm.name, recoverForm.destination, recoverForm.answer);
      setRecoverResult(res.data);
    } catch (err) {
      setRecoverError(err.response?.data?.error || "Incorrect answer.");
    } finally {
      setRecoverLoading(false);
    }
  };

  const resetRecovery = () => {
    setRecoveryQuestion(null);
    setRecoverResult(null);
    setRecoverError("");
    setRecoverForm({ name: "", destination: "", answer: "" });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["join", "create", "recover"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setJoinError("");
              setSecurityChallenge(null);
              setRecoverResult(null);
              setRecoverError("");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === tab
              ? "bg-[#5c45e1] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {tab === "join" && "Join Trip"}
            {tab === "create" && "Create Trip"}
            {tab === "recover" && "Forgot Code"}
          </button>
        ))}
      </div>

      {/* JOIN TRIP TAB */}
      {activeTab === "join" && !securityChallenge && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Join a Trip</h2>
          <p className="text-gray-600 mb-4">
            Enter the access code shared by the trip creator to join.
          </p>
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Enter access code (e.g., goa-gang-2026)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            {joinError && <p className="text-red-500 text-sm">{joinError}</p>}
            <button
              type="submit"
              disabled={joinLoading}
              className="w-full bg-[#7bbbff] text-white py-3 rounded-lg hover:bg-[#5c45e1] transition disabled:opacity-50"
            >
              {joinLoading ? "Joining..." : "Join Trip"}
            </button>
          </form>
        </div>
      )}

      {/* SECURITY QUESTION CHALLENGE */}
      {activeTab === "join" && securityChallenge && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Security Check</h2>
          <p className="text-gray-600 mb-4">
            This trip requires answering a security question.
          </p>
          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {securityChallenge.securityQuestion}
              </label>
              <input
                type="text"
                required
                placeholder="Your answer..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
              />
            </div>
            {joinError && <p className="text-red-500 text-sm">{joinError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSecurityChallenge(null);
                  setSecurityAnswer("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={joinLoading}
                className="flex-1 bg-[#7bbbff] text-white py-3 rounded-lg hover:bg-[#5c45e1] transition disabled:opacity-50"
              >
                {joinLoading ? "Verifying..." : "Verify & Join"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE TRIP TAB */}
      {activeTab === "create" && (
        <TripSetup
          handleTripSubmit={handleTripSubmit}
          tripForm={tripForm}
          setTripForm={setTripForm}
        />
      )}

      {/* RECOVER CODE TAB */}
      {activeTab === "recover" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Recover Access Code</h2>

          {/* Show result if we have one */}
          {recoverResult && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800 font-medium">
                  Your access code is: <span className="font-mono bg-green-100 px-2 py-1 rounded">{recoverResult.accessCode}</span>
                </p>
                {recoverResult.message && <p className="text-green-600 text-sm mt-1">{recoverResult.message}</p>}
              </div>
              <button
                onClick={resetRecovery}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Start Over
              </button>
            </div>
          )}

          {/* Step 2: Answer the question */}
          {!recoverResult && recoveryQuestion && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Recovery Question:</p>
                <p className="text-blue-800 font-medium">{recoveryQuestion}</p>
              </div>
              <form onSubmit={handleRecoverSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your answer"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
                    value={recoverForm.answer}
                    onChange={(e) => setRecoverForm({ ...recoverForm, answer: e.target.value })}
                  />
                </div>
                {recoverError && <p className="text-red-500 text-sm">{recoverError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetRecovery}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={recoverLoading}
                    className="flex-1 bg-[#5c45e1] text-white py-3 rounded-lg hover:bg-[#4a38b8] transition disabled:opacity-50"
                  >
                    {recoverLoading ? "Verifying..." : "Recover Code"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 1: Enter trip details */}
          {!recoverResult && !recoveryQuestion && (
            <>
              <p className="text-gray-600 mb-4">
                Enter your trip details to see your recovery question.
              </p>
              <form onSubmit={handleRecoverLookup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Exact trip name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
                    value={recoverForm.name}
                    onChange={(e) => setRecoverForm({ ...recoverForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="Exact destination"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
                    value={recoverForm.destination}
                    onChange={(e) => setRecoverForm({ ...recoverForm, destination: e.target.value })}
                  />
                </div>
                {recoverError && <p className="text-red-500 text-sm">{recoverError}</p>}
                <button
                  type="submit"
                  disabled={recoverLoading}
                  className="w-full bg-[#5c45e1] text-white py-3 rounded-lg hover:bg-[#4a38b8] transition disabled:opacity-50"
                >
                  {recoverLoading ? "Looking up..." : "Find My Trip"}
                </button>
              </form>
            </>
          )}
        </div>
      )}


    </div>
  );
};


// Timeline component
const Timeline = ({ dayPlans }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-slate-700 mb-12 embossed-text">
          Travel Timeline
        </h1>

        {dayPlans.map((day, dayIndex) => (
          <React.Fragment key={day._id}>
            <div className="glass-card mb-8 p-6 sm:p-8 relative">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-6 embossed-text text-center">
                {formatDate(day.date)}
              </h3>

              <div className="relative">
                <div className="space-y-8">
                  {day.items
                    .sort((a, b) =>
                      (a.startTime || "").localeCompare(b.startTime || "")
                    )
                    .map((item, itemIndex) => (
                      <div key={item._id} className="relative">
                        <div className="flex items-start relative">
                          <div className="timeline-dot z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-sm">
                            {itemIndex + 1}
                          </div>

                          <div className="ml-6 sm:ml-8 w-full">
                            <div className="glass-item p-4 sm:p-5">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                <div className="font-semibold text-base sm:text-lg text-slate-700 embossed-text mb-1 sm:mb-0">
                                  {item.placeName}
                                </div>
                                <span
                                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium ${categoryColor(
                                    item.category
                                  )}`}
                                >
                                  {item.category}
                                </span>
                              </div>
                              <div className="text-sm sm:text-base text-slate-600 embossed-text">
                                {item.startTime} – {item.endTime}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Travel time indicator */}
                        {item.travelTimeToNext && (
                          <div className="ml-14 sm:ml-16 mt-2 mb-4 text-slate-500 text-xs sm:text-sm embossed-text italic">
                            {item.travelTimeToNext} min travel to next
                            destination
                          </div>
                        )}
                      </div>
                    ))}

                  {day.items.length === 0 && (
                    <div className="text-slate-500 text-sm sm:text-base ml-14 sm:ml-16 embossed-text italic">
                      No items scheduled for this day.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection between days */}
            {dayIndex < dayPlans.length - 1 && (
              <div className="flex justify-center mb-8">
                <div className="connection-line"></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Trip Details/Overview component
const TripDetails = ({ trip, onExitTrip }) => {
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Not set";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTripDuration = () => {
    if (!trip.start_date || !trip.end_date) return null;
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const duration = getTripDuration();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5c45e1] to-[#7b6bef] px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
              <p className="text-white/80 text-lg">{trip.destination}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(trip.status)} capitalize`}>
                {trip.status || "Upcoming"}
              </span>
              <button
                onClick={() => { if (window.confirm("Are you sure you want to exit this trip?")) onExitTrip(); }}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors border border-white/40"
              >
                Exit Trip
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Dates Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Start Date</p>
              <p className="text-lg font-semibold text-gray-800">{formatDisplayDate(trip.start_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">End Date</p>
              <p className="text-lg font-semibold text-gray-800">{formatDisplayDate(trip.end_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="text-lg font-semibold text-gray-800">
                {duration ? `${duration} day${duration > 1 ? 's' : ''}` : "Not set"}
              </p>
            </div>
          </div>

          {/* Budget Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Budget</p>
            <p className="text-2xl font-bold text-gray-800">
              {trip.budget ? `${trip.currency || 'INR'} ${trip.budget.toLocaleString()}` : "Not set"}
            </p>
          </div>

          {/* Access Code Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Access Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-600 mb-1">Access Code</p>
                <p className="text-xl font-mono font-bold text-blue-800">{trip.accessCode}</p>
                <p className="text-xs text-blue-500 mt-2">Share this code with others to let them join the trip</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-600">Recovery Question</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${trip.recoveryQuestion ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {trip.recoveryQuestion ? 'Set' : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-600">Security Question</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${trip.securityQuestion ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {trip.securityQuestion ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Question Display */}
          {trip.recoveryQuestion && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <p className="text-sm text-amber-600 mb-1">Your Recovery Question</p>
              <p className="text-gray-800 font-medium">{trip.recoveryQuestion}</p>
            </div>
          )}

          {/* Security Question Display */}
          {trip.securityQuestion && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <p className="text-sm text-purple-600 mb-1">Security Question (asked when joining)</p>
              <p className="text-gray-800 font-medium">{trip.securityQuestion}</p>
            </div>
          )}

          {/* Created At */}
          {trip.createdAt && (
            <div className="text-sm text-gray-400 text-center pt-4 border-t">
              Trip created on {new Date(trip.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Nav = ({ currentView, setCurrentView, trip, onExitTrip }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const activeClass = "bg-[#5c45e1] text-white";
  const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-800";

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1
              className="text-xl font-bold tracking-tight text-[#5c45e1] cursor-pointer"
              onClick={() => setCurrentView("home")}
            >
              Trip Plan Karo
            </h1>
          </div>

          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-2">
            {trip ? (
              <>
                <button onClick={() => setCurrentView("overview")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "overview" ? activeClass : inactiveClass}`}>Overview</button>
                <button onClick={() => setCurrentView("places")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "places" ? activeClass : inactiveClass}`}>Places</button>
                <button onClick={() => setCurrentView("planner")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "planner" ? activeClass : inactiveClass}`}>Daily Planner</button>
                <button onClick={() => setCurrentView("timeline")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "timeline" ? activeClass : inactiveClass}`}>Timeline</button>
                <button onClick={() => setCurrentView("expenses")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "expenses" ? activeClass : inactiveClass}`}>Expenses</button>
              </>
            ) : (
              <button onClick={() => setCurrentView("home")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "home" ? activeClass : inactiveClass}`}>Home</button>
            )}
          </div>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button onClick={() => { setCurrentView("home"); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === "home" ? activeClass : inactiveClass}`}>Home</button>
            {trip && (
              <>
                <button onClick={() => { setCurrentView("overview"); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === "overview" ? activeClass : inactiveClass}`}>Overview</button>
                <button onClick={() => { setCurrentView("places"); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === "places" ? activeClass : inactiveClass}`}>Places</button>
                <button onClick={() => { setCurrentView("planner"); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === "planner" ? activeClass : inactiveClass}`}>Daily Planner</button>
                <button onClick={() => { setCurrentView("timeline"); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === "timeline" ? activeClass : inactiveClass}`}>Timeline</button>
                <button onClick={() => { setCurrentView("expenses"); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === "expenses" ? activeClass : inactiveClass}`}>Expenses</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const TripSetup = ({ handleTripSubmit, tripForm, setTripForm }) => {
  const [codeAvailable, setCodeAvailable] = useState(null); // null = not checked, true/false
  const [checkingCode, setCheckingCode] = useState(false);
  const [enableSecurity, setEnableSecurity] = useState(false);
  const [createdTrip, setCreatedTrip] = useState(null);

  const checkCodeAvailability = async (code) => {
    if (!code || code.length < 4) {
      setCodeAvailable(null);
      return;
    }
    setCheckingCode(true);
    try {
      const res = await tripAPI.checkCodeAvailability(code.toLowerCase().trim());
      setCodeAvailable(res.data.available);
    } catch (err) {
      setCodeAvailable(null);
    } finally {
      setCheckingCode(false);
    }
  };

  // Debounce code check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tripForm.accessCode) {
        checkCodeAvailability(tripForm.accessCode);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [tripForm.accessCode]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (codeAvailable === false) {
      alert("Please choose a different access code - this one is taken.");
      return;
    }
    const result = await handleTripSubmit(e);
    if (result) {
      setCreatedTrip(result);
    }
  };

  // Show success message after creation
  if (createdTrip) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Trip Created Successfully!</h2>
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-medium">Trip:</span> {createdTrip.name} - {createdTrip.destination}
            </p>
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-sm text-gray-600 mb-1">Share this access code with your group:</p>
              <p className="text-2xl font-mono font-bold text-[#5c45e1]">
                {createdTrip.accessCode}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Important: Save this code! You'll need it to access your trip. You can also recover it using the recovery question.
            </p>
          </div>
          <button
            onClick={() => {
              setCreatedTrip(null);
              setTripForm({
                name: "",
                destination: "",
                start_date: "",
                end_date: "",
                budget: "",
                accessCode: "",
                recoveryQuestion: "",
                recoveryAnswer: "",
                securityQuestion: "",
                securityAnswer: "",
              });
            }}
            className="mt-4 px-4 py-2 bg-[#7bbbff] text-white rounded-lg hover:bg-[#5c45e1] transition"
          >
            Create Another Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-700 mb-6">
        Create a New Trip
      </h2>
      <form
        onSubmit={onSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        {/* Basic Trip Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trip Name
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={tripForm.name}
            onChange={(e) => setTripForm({ ...tripForm, name: e.target.value })}
            placeholder="e.g., Family Vacation to Goa"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={tripForm.destination}
            onChange={(e) =>
              setTripForm({ ...tripForm, destination: e.target.value })
            }
            placeholder="e.g., Goa, India"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={tripForm.start_date}
              onChange={(e) =>
                setTripForm({ ...tripForm, start_date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={tripForm.end_date}
              onChange={(e) =>
                setTripForm({ ...tripForm, end_date: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget (Rs.)
          </label>
          <input
            type="number"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={tripForm.budget}
            onChange={(e) => setTripForm({ ...tripForm, budget: e.target.value })}
            placeholder="50000"
          />
        </div>

        {/* Access Code Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Access Code</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose an Access Code (min 4 characters)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                minLength={4}
                maxLength={30}
                className={`w-full p-3 border rounded-lg focus:ring-2 ${codeAvailable === true
                  ? "border-green-500 focus:ring-green-500"
                  : codeAvailable === false
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                  }`}
                value={tripForm.accessCode || ""}
                onChange={(e) =>
                  setTripForm({ ...tripForm, accessCode: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                }
                placeholder="e.g., goa-gang-2026"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {checkingCode && <span className="text-gray-400">Checking...</span>}
                {!checkingCode && codeAvailable === true && <span className="text-green-500">✓ Available</span>}
                {!checkingCode && codeAvailable === false && <span className="text-red-500">✗ Taken</span>}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">This code can be shared with your group to access the trip.</p>
          </div>
        </div>

        {/* Recovery Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Recovery (Required)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Set a recovery question to retrieve your access code if you forget it.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recovery Question
              </label>
              <input
                type="text"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={tripForm.recoveryQuestion || ""}
                onChange={(e) =>
                  setTripForm({ ...tripForm, recoveryQuestion: e.target.value })
                }
                placeholder="e.g., What's our group's favorite food?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recovery Answer
              </label>
              <input
                type="text"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={tripForm.recoveryAnswer || ""}
                onChange={(e) =>
                  setTripForm({ ...tripForm, recoveryAnswer: e.target.value })
                }
                placeholder="e.g., pizza"
              />
            </div>
          </div>
        </div>

        {/* Optional Security Section */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="enableSecurity"
              checked={enableSecurity}
              onChange={(e) => {
                setEnableSecurity(e.target.checked);
                if (!e.target.checked) {
                  setTripForm({ ...tripForm, securityQuestion: "", securityAnswer: "" });
                }
              }}
              className="w-4 h-4 text-[#5c45e1] rounded"
            />
            <label htmlFor="enableSecurity" className="text-lg font-semibold text-slate-700">
              Enable Security Question (Optional)
            </label>
          </div>
          {enableSecurity && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Anyone joining this trip will need to answer this question first.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Question
                  </label>
                  <input
                    type="text"
                    required={enableSecurity}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={tripForm.securityQuestion || ""}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, securityQuestion: e.target.value })
                    }
                    placeholder="e.g., Who organized this trip?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Answer
                  </label>
                  <input
                    type="text"
                    required={enableSecurity}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={tripForm.securityAnswer || ""}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, securityAnswer: e.target.value })
                    }
                    placeholder="e.g., rahul"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={codeAvailable === false || checkingCode}
          className="w-full bg-[#9ed454] text-white py-3 rounded-lg hover:bg-[#7cb83e] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Trip
        </button>
      </form>
    </div>
  );
};


const Places = ({
  addPlace,
  placeForm,
  setPlaceForm,
  places,
  removePlace,
  trip,
}) => (
  <div className="max-w-6xl mx-auto p-6">
    <h2 className="text-3xl font-bold text-slate-700 mb-6">Manage Places</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form
        onSubmit={addPlace}
        className="bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <h3 className="text-xl font-semibold text-slate-700">Add New Place</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Place name
            </label>
            <input
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Place name"
              value={placeForm.name}
              onChange={(e) =>
                setPlaceForm({ ...placeForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={placeForm.category}
              onChange={(e) =>
                setPlaceForm({ ...placeForm, category: e.target.value })
              }
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Duration (minutes)"
              value={placeForm.estimatedDuration}
              onChange={(e) =>
                setPlaceForm({
                  ...placeForm,
                  estimatedDuration: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Address"
              value={placeForm.address}
              onChange={(e) =>
                setPlaceForm({ ...placeForm, address: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            rows={2}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Notes"
            value={placeForm.notes}
            onChange={(e) =>
              setPlaceForm({ ...placeForm, notes: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out"
        >
          Add Place
        </button>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-slate-700 mb-4">
          Places List ({places.length})
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {places.map((p) => (
            <div
              key={p._id}
              className="p-3 border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{p.name}</div>
                  <div className="text-sm text-gray-600">
                    {p.category} •{" "}
                    {p.estimated_duration ?? p.estimatedDuration ?? 60} mins
                  </div>
                  {p.address ? (
                    <div className="text-sm text-gray-500">{p.address}</div>
                  ) : null}
                </div>
                <button
                  onClick={() => removePlace(p._id)}
                  className="text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {places.length === 0 && (
            <div className="text-gray-500 text-sm">No places yet</div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const Planner = ({
  trip,
  dayPlans,
  activeDayId,
  setActiveDayId,
  activeDay,
  addScheduleItem,
  scheduleForm,
  setScheduleForm,
  places,
  removeScheduleItem,
  onDragEnd,
  onEditClick,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-slate-700 mb-6">Daily Planner</h2>
      {!trip && (
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
          Select a Trip from the Home page.
        </div>
      )}
      {trip && (
        <div>
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full text-left font-semibold text-lg text-slate-700 flex justify-between items-center"
            >
              <span>Instructions</span>
              <span>{showInstructions ? "▲" : "▼"}</span>
            </button>
            {showInstructions && (
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Select place:</strong> Choose a place from the list of
                  places you have added.
                </p>
                <p>
                  <strong>Start time & End time:</strong> Set the time you plan
                  to visit the place.
                </p>
                <p>
                  <strong>Travel to next (min):</strong> Enter the estimated
                  travel time in minutes to the next place on your itinerary.
                </p>
                <p>
                  Click the <strong>Add</strong> button to add the place to your
                  daily schedule.
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-slate-700 mb-3">Days</h3>
              <div className="grid grid-cols-3 gap-2">
                {dayPlans.map((d) => (
                  <button
                    key={d._id}
                    onClick={() => setActiveDayId(d._id)}
                    className={`w-full text-left p-2 rounded border border-gray-300 ${activeDayId === d._id
                      ? "bg-[#7bbbff] text-white"
                      : "hover:bg-gray-100 text-gray-800"
                      }`}
                  >
                    {formatDate(d.date)} ({d.items.length})
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-700">
                  Schedule for {activeDay ? formatDate(activeDay.date) : "-"}
                </h3>
              </div>

              <form onSubmit={addScheduleItem} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select place
                    </label>
                    <select
                      required
                      className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-[#7bbbff]"
                      value={scheduleForm.placeId}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          placeId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select place</option>
                      {places.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Time taken to travel to next destination (min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-[#7bbbff]"
                      placeholder="Travel to next (min)"
                      value={scheduleForm.travelTimeToNext}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          travelTimeToNext: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start time
                    </label>
                    <input
                      required
                      type="time"
                      className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-[#7bbbff]"
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End time
                    </label>
                    <input
                      required
                      type="time"
                      className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-[#7bbbff]"
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#9ed454] text-white rounded px-3 py-2 mt-4 w-full hover:bg-[#7cb83e] transition duration-150 ease-in-out"
                >
                  Add
                </button>
              </form>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="planner-list">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 p-1 rounded ${snapshot.isDraggingOver ? "bg-[#bcf5ff]/20" : ""
                        }`}
                    >
                      {(activeDay?.items || [])
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((it, index) => (
                          <Draggable
                            key={it._id}
                            draggableId={it._id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                // Merge library-provided styles so it positions while dragging
                                style={{
                                  ...provided.draggableProps.style,
                                  // Optional visual cues
                                  cursor: snapshot.isDragging
                                    ? "grabbing"
                                    : "grab",
                                  backgroundColor: snapshot.isDragging
                                    ? "rgba(188,245,255,0.2)"
                                    : "white",
                                }}
                                className="flex items-center justify-between p-2 border border-gray-200 rounded shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  {/* Dedicated drag handle */}
                                  <span
                                    {...provided.dragHandleProps}
                                    className="px-2 py-1 rounded bg-gray-100 text-gray-600 cursor-grab select-none"
                                    title="Drag to reorder"
                                  >
                                    |||
                                  </span>
                                  <div>
                                    <div className="font-medium text-gray-800">
                                      {it.placeName}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {it.startTime}–{it.endTime} • Order{" "}
                                      {it.order}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => onEditClick(it)}
                                    className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeScheduleItem(it._id)}
                                    className="px-2 py-1 border border-red-300 rounded text-red-600 hover:bg-red-50 transition duration-150 ease-in-out"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                      {(!activeDay || activeDay.items.length === 0) && (
                        <div className="text-sm text-gray-500">
                          No items yet
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineView = ({ trip, dayPlans }) => {
  const handleDownloadPdf = () => {
    if (!trip) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const leftMargin = 15;
    const rightMargin = 15;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    let yPos = 0; // Start from top for header

    const addHeader = (pageNumber) => {
      doc.setFillColor(41, 128, 185); // Blue color
      doc.rect(0, 0, pageWidth, 40, "F"); // Blue background rectangle for header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255); // White text
      doc.text(`Trip Timeline: ${trip.destination}`, pageWidth / 2, 15, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255); // White text
      doc.text(
        `Dates: ${new Date(trip.start_date).toLocaleDateString()} - ${new Date(
          trip.end_date
        ).toLocaleDateString()}`,
        pageWidth / 2,
        25,
        { align: "center" }
      );
      yPos = 55; // Set yPos after header

      // Add footer to every page
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150); // Gray color
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Page ${pageNumber} of ${doc.internal.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    };

    // Add header to the first page
    addHeader(1);

    // Timeline
    const timelineData = [];
    dayPlans.forEach((day, dayIndex) => {
      if (day.items.length > 0) {
        day.items
          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
          .forEach((item) => {
            timelineData.push([
              `Day ${dayIndex + 1}`,
              item.placeName,
              `${item.startTime} - ${item.endTime}`,
              item.category,
              item.travelTimeToNext ? `${item.travelTimeToNext} min` : "-",
            ]);
          });
      } else {
        timelineData.push([
          `Day ${dayIndex + 1}`,
          "No items scheduled",
          "",
          "",
          "",
        ]);
      }
    });

    // Content generation
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black text for content

    dayPlans.forEach((day, dayIndex) => {
      // Add day header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(day.date), leftMargin, yPos);
      yPos += 10;

      if (day.items.length > 0) {
        // const itemHeight = 20; // Height of each place box
        // const itemWidth = contentWidth * 0.7; // Width of each place box
        // const xOffset = leftMargin + (contentWidth - itemWidth) / 2; // Center the boxes

        const itemHeight = 25; // Increased height for better spacing
        const itemWidth = contentWidth * 0.7; // Width of each place box
        const xOffset = leftMargin + (contentWidth - itemWidth) / 2; // Center the boxes
        const cornerRadius = 3; // For rounded rectangles

        day.items
          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
          .forEach((item, itemIndex) => {
            // Check for page break before drawing item
            if (
              yPos + itemHeight + 25 > pageHeight - 30 &&
              itemIndex < day.items.length - 1
            ) {
              // Increased threshold for better page breaks
              doc.addPage();
              addHeader(doc.internal.getNumberOfPages());
              yPos = 55; // Reset yPos for new page, after header
            }

            // Draw subtle shadow (optional, for depth)
            doc.setFillColor(200, 200, 200); // Darker gray for shadow
            doc.roundedRect(
              xOffset + 1,
              yPos + 1,
              itemWidth,
              itemHeight,
              cornerRadius,
              cornerRadius,
              "F"
            );

            // Draw place box
            doc.setFillColor(255, 255, 255); // White background for box
            doc.setDrawColor(100, 100, 100); // Darker gray border
            doc.setLineWidth(0.2);
            doc.roundedRect(
              xOffset,
              yPos,
              itemWidth,
              itemHeight,
              cornerRadius,
              cornerRadius,
              "FD"
            ); // Fill and Draw

            // Add place details
            doc.setFontSize(11);
            doc.setTextColor(50, 50, 50); // Darker text
            doc.setFont("helvetica", "bold");
            doc.text(item.placeName, xOffset + 5, yPos + 9); // Adjusted text position

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(
              `${item.startTime} - ${item.endTime}`,
              xOffset + 5,
              yPos + 18
            ); // Adjusted text position

            // Add category badge
            const categoryText = item.category;
            const categoryTextWidth = doc.getStringUnitWidth(categoryText) * 9; // Estimate width
            const categoryX = xOffset + itemWidth - categoryTextWidth - 8; // Position from right
            const categoryY = yPos + 7;
            doc.setFillColor(180, 210, 230); // Light blue background for badge
            doc.roundedRect(
              categoryX - 2,
              categoryY - 4,
              categoryTextWidth + 4,
              7,
              1,
              1,
              "F"
            );
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(8);
            doc.text(categoryText, categoryX, categoryY);

            yPos += itemHeight;

            // Draw travel time and connecting line if not the last item
            if (item.travelTimeToNext && itemIndex < day.items.length - 1) {
              const lineLength = 18; // Increased line length
              doc.setDrawColor(150, 150, 150); // Gray line
              doc.setLineWidth(0.5);
              doc.line(
                xOffset + itemWidth / 2,
                yPos,
                xOffset + itemWidth / 2,
                yPos + lineLength
              );

              // Travel time box
              const travelTimeText = `${item.travelTimeToNext} min`;
              const travelTimeTextWidth =
                doc.getStringUnitWidth(travelTimeText) * 8;
              const travelTimeBoxWidth = travelTimeTextWidth + 6;
              const travelTimeBoxHeight = 8;
              const travelTimeBoxX =
                xOffset + itemWidth / 2 - travelTimeBoxWidth / 2;
              const travelTimeBoxY =
                yPos + lineLength / 2 - travelTimeBoxHeight / 2;

              doc.setFillColor(255, 255, 255); // White background for travel time box
              doc.roundedRect(
                travelTimeBoxX,
                travelTimeBoxY,
                travelTimeBoxWidth,
                travelTimeBoxHeight,
                1,
                1,
                "FD"
              );
              doc.setTextColor(80, 80, 80); // Darker gray for travel time text
              doc.setFontSize(8);
              doc.text(
                travelTimeText,
                xOffset + itemWidth / 2,
                yPos + lineLength / 2 + 1,
                { align: "center" }
              ); // Centered text

              yPos += lineLength;
            } else yPos += 3; // Increased space between items
          });
      } else {
        doc.setFontSize(12);
        doc.setFont("helvetica", "italic");
        doc.text("No items scheduled for this day.", leftMargin + 5, yPos);
        yPos += 10;
      }
      yPos += 15; // Space after each day section

      // Check for page break
      if (yPos > pageHeight - 30 && dayIndex < dayPlans.length - 1) {
        doc.addPage();
        addHeader(doc.internal.getNumberOfPages());
        yPos = 55; // Reset yPos for new page, after header
      }
    });

    doc.save(`Timeline_${trip.destination}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-slate-700 mb-6">
        Full Trip Timeline
      </h2>
      {!trip && (
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
          Select a Trip from Home page.
        </div>
      )}
      {trip && (
        <>
          <button
            onClick={handleDownloadPdf}
            className="mb-6 px-4 py-2 bg-[#7bbbff] text-white rounded-lg hover:bg-[#5c55e1] transition duration-150 ease-in-out"
          >
            Download PDF Report
          </button>
          {/* The timeline-content div is no longer needed for PDF generation via html2canvas */}
          <div>
            <Timeline dayPlans={dayPlans} />
          </div>
        </>
      )}
    </div>
  );
};

const EditScheduleItemModal = ({ isOpen, onClose, item, onSave }) => {
  const [editedStartTime, setEditedStartTime] = useState(item?.startTime || "");
  const [editedEndTime, setEditedEndTime] = useState(item?.endTime || "");
  const [editedTravelTimeToNext, setEditedTravelTimeToNext] = useState(
    item?.travelTimeToNext || ""
  );

  useEffect(() => {
    if (item) {
      setEditedStartTime(item.startTime || "");
      setEditedEndTime(item.endTime || "");
      setEditedTravelTimeToNext(item.travelTimeToNext || "");
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...item,
      startTime: editedStartTime,
      endTime: editedEndTime,
      travelTimeToNext: editedTravelTimeToNext
        ? Number(editedTravelTimeToNext)
        : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-[92%]">
        <h3 className="text-2xl font-bold mb-6 text-medium-slate-blue">
          Edit Schedule Item
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place Name
            </label>
            <input
              type="text"
              value={item.placeName}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
              value={editedStartTime}
              onChange={(e) => setEditedStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
              value={editedEndTime}
              onChange={(e) => setEditedEndTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Travel to next (min)
            </label>
            <input
              type="number"
              min="0"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
              value={editedTravelTimeToNext}
              onChange={(e) => setEditedTravelTimeToNext(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-lime-green text-white rounded-lg hover:bg-lime-green/90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState("home");

  // Trip
  const [allTrips, setAllTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [tripForm, setTripForm] = useState({
    name: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
    currency: "INR",
    accessCode: "",
    recoveryQuestion: "",
    recoveryAnswer: "",
    securityQuestion: "",
    securityAnswer: "",
  });

  // Places
  const [places, setPlaces] = useState([]);
  const [placeForm, setPlaceForm] = useState({
    name: "",
    category: "historical",
    estimatedDuration: 60,
    notes: "",
    address: "",
  });

  // Itinerary
  const [dayPlans, setDayPlans] = useState([]); // [{id,date,items:[{...}]}]
  const [activeDayId, setActiveDayId] = useState(null);
  const activeDay = useMemo(
    () => dayPlans.find((d) => d._id === activeDayId) || null,
    [dayPlans, activeDayId]
  );

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    placeId: "",
    startTime: "09:00",
    endTime: "10:00",
    travelTimeToNext: "",
  });

  // Edit schedule item modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedItem) => {
    if (!trip || !activeDayId || !updatedItem) return;
    await itineraryAPI.updatePlaceInDay(
      activeDayId,
      updatedItem._id,
      updatedItem
    );
    await refreshItinerary(trip._id);
    setEditModalOpen(false);
    setEditingItem(null);
  };

  // Load initial data
  // Load cached trip
  useEffect(() => {
    const loadCachedTrip = async () => {
      const cachedCode = localStorage.getItem("tripCode");
      if (cachedCode) {
        try {
          const res = await tripAPI.getByCode(cachedCode);
          if (res.data && !res.data.requiresSecurityAnswer) {
            setTrip(res.data);
            await refreshItinerary(res.data._id);
            setCurrentView("overview");
          }
        } catch (err) {
          console.error("Cached trip invalid", err);
          localStorage.removeItem("tripCode");
        }
      }
    };

    loadCachedTrip();
  }, []);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (trip) {
        placesAPI.getAll(trip._id).then((r) => setPlaces(r.data));
      } else {
        setPlaces([]); // Clear places if no trip is selected
      }
    };
    fetchPlaces();
  }, [trip]); // Re-run when trip changes

  // Helpers
  const refreshItinerary = async (tripId) => {
    const currentActiveDayId = activeDayId; // Store current activeDayId
    const res = await itineraryAPI.getByTrip(tripId);
    console.log("Itinerary data received:", res.data);
    setDayPlans(res.data);
    if (res.data.length > 0) {
      // Try to restore the previously active day, otherwise default to the first day
      const foundActiveDay = res.data.find(
        (day) => day._id === currentActiveDayId
      );
      setActiveDayId(foundActiveDay ? foundActiveDay._id : res.data[0]._id);
    } else {
      setActiveDayId(null);
    }
  };

  const handleSelectTrip = async (tripId) => {
    const selectedTrip = allTrips.find((t) => t._id === tripId);
    if (selectedTrip) {
      setTrip(selectedTrip);
      setTripForm({
        name: selectedTrip.name,
        destination: selectedTrip.destination,
        start_date: selectedTrip.start_date.slice(0, 10),
        end_date: selectedTrip.end_date.slice(0, 10),
        budget: selectedTrip.budget,
      });
      await refreshItinerary(selectedTrip._id);
      setCurrentView("overview");
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await tripAPI.delete(tripId);
      setAllTrips(allTrips.filter((t) => t._id !== tripId));
      if (trip && trip._id === tripId) {
        setTrip(null);
        setTripForm({
          name: "",
          destination: "",
          start_date: "",
          end_date: "",
          budget: "",
          accessCode: "",
          recoveryQuestion: "",
          recoveryAnswer: "",
          securityQuestion: "",
          securityAnswer: "",
        });
        setDayPlans([]);
        setActiveDayId(null);
      }
    } catch (err) {
      console.error("Failed to delete trip:", err);
    }
  };

  // Trip setup submit
  const handleTripSubmit = async (e) => {
    e.preventDefault();
    if (
      !tripForm.name ||
      !tripForm.destination ||
      !tripForm.start_date ||
      !tripForm.end_date ||
      !tripForm.accessCode ||
      !tripForm.recoveryQuestion ||
      !tripForm.recoveryAnswer
    ) {
      alert(
        "Please fill in all required trip details (Name, Destination, Dates, Access Code, Recovery Q&A)."
      );
      return null;
    }
    console.log("Sending tripForm:", tripForm);
    try {
      const created = await tripAPI.create(tripForm);
      const t = created.data;
      setAllTrips([...allTrips, t]);
      setTrip(t);
      localStorage.setItem("tripCode", t.accessCode);

      // Scaffold day plans for each date
      const days = getDateRange(tripForm.start_date, tripForm.end_date);
      await Promise.all(
        days.map((date) => itineraryAPI.createDayPlan({ tripId: t._id, date }))
      );
      await refreshItinerary(t._id);
      return t; // Return the created trip for success handling
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create trip.");
      return null;
    }
  };

  // Join trip by access code
  const handleJoinTrip = async (code, tripIdForSecurity = null, securityAnswer = null) => {
    // If tripId is provided, we're verifying security answer
    if (tripIdForSecurity && securityAnswer) {
      const res = await tripAPI.verifySecurity(tripIdForSecurity, securityAnswer);
      const t = res.data;
      setTrip(t);
      localStorage.setItem("tripCode", t.accessCode);
      // Add to allTrips if not already there
      if (!allTrips.find(trip => trip._id === t._id)) {
        setAllTrips([...allTrips, t]);
      }
      await refreshItinerary(t._id);
      setCurrentView("overview");
      return t;
    }

    // Otherwise, try to get trip by code
    const res = await tripAPI.getByCode(code);
    const data = res.data;

    // If requires security answer, return the challenge
    if (data.requiresSecurityAnswer) {
      return data;
    }

    // No security question, access granted
    const t = data;
    setTrip(t);
    localStorage.setItem("tripCode", t.accessCode);
    // Add to allTrips if not already there
    if (!allTrips.find(trip => trip._id === t._id)) {
      setAllTrips([...allTrips, t]);
    }
    await refreshItinerary(t._id);
    setCurrentView("overview");
    return t;
  };

  const handleExitTrip = () => {
    setTrip(null);
    localStorage.removeItem("tripCode");
    setDayPlans([]);
    setActiveDayId(null);
    setCurrentView("home");
  };

  // Places create/delete
  const addPlace = async (e) => {
    e.preventDefault();
    if (!trip) {
      alert("Please select a trip first.");
      return;
    }
    const res = await placesAPI.create({ ...placeForm, trip_id: trip._id });
    setPlaces((p) => [res.data, ...p]);
    setPlaceForm({
      name: "",
      category: "historical",
      estimatedDuration: 60,
      notes: "",
      address: "",
    });
  };
  const removePlace = async (id) => {
    await placesAPI.delete(id);
    setPlaces((p) => p.filter((x) => x._id !== id));
  };

  // Add schedule item
  const addScheduleItem = async (e) => {
    e.preventDefault();
    if (!trip || !activeDayId) {
      console.log("Cannot add schedule item: trip or activeDayId is missing.", {
        trip,
        activeDayId,
      });
      return;
    }
    const day = dayPlans.find((d) => d._id === activeDayId);
    const nextOrder = (day?.items?.length || 0) + 1;
    const dataToSend = {
      placeId: scheduleForm.placeId,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      order: nextOrder,
      travelTimeToNext: scheduleForm.travelTimeToNext
        ? Number(scheduleForm.travelTimeToNext)
        : null,
    };
    console.log("Adding schedule item with data:", dataToSend);
    await itineraryAPI.addPlaceToDay(activeDayId, dataToSend);
    await refreshItinerary(trip._id);
    setScheduleForm({
      placeId: "",
      startTime: "09:00",
      endTime: "10:00",
      travelTimeToNext: "",
    });
  };

  // Delete schedule item
  const removeScheduleItem = async (itemId) => {
    if (!trip || !activeDayId) return;
    await itineraryAPI.removePlaceFromDay(activeDayId, itemId);
    await refreshItinerary(trip._id);
  };

  // Reorder items with drag and drop
  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    if (!trip || !activeDayId) return;

    const day = dayPlans.find((d) => d._id === activeDayId);
    const items = Array.from(day.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    const updatedDayPlans = dayPlans.map((d) =>
      d._id === activeDayId ? { ...d, items: updatedItems } : d
    );
    setDayPlans(updatedDayPlans);

    await itineraryAPI.reorderPlaces(
      activeDayId,
      updatedItems.map((i) => ({ id: i._id, order: i.order }))
    );
    await refreshItinerary(trip._id);
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav currentView={currentView} setCurrentView={setCurrentView} trip={trip} onExitTrip={handleExitTrip} />
      <div className="ml-3 mt-1 text-sm italic text-gray-500">
        {`Currently selected trip: ${trip?.destination || "None"}`}
      </div>

      <main className="py-8">
        {currentView === "home" && (
          <Home
            allTrips={allTrips}
            onSelectTrip={handleSelectTrip}
            onDeleteTrip={handleDeleteTrip}
            handleTripSubmit={handleTripSubmit}
            tripForm={tripForm}
            setTripForm={setTripForm}
            onJoinTrip={handleJoinTrip}
          />
        )}
        {currentView === "overview" && trip && (
          <TripDetails trip={trip} onExitTrip={handleExitTrip} />
        )}
        {currentView === "places" && (
          <Places
            addPlace={addPlace}
            placeForm={placeForm}
            setPlaceForm={setPlaceForm}
            places={places}
            removePlace={removePlace}
            trip={trip}
          />
        )}
        {currentView === "planner" && (
          <Planner
            trip={trip}
            dayPlans={dayPlans}
            activeDayId={activeDayId}
            setActiveDayId={setActiveDayId}
            activeDay={activeDay}
            addScheduleItem={addScheduleItem}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            places={places}
            removeScheduleItem={removeScheduleItem}
            onDragEnd={handleOnDragEnd}
            onEditClick={handleEditClick}
          />
        )}
        {editingItem && (
          <EditScheduleItemModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            item={editingItem}
            onSave={handleSaveEdit}
          />
        )}
        {currentView === "timeline" && (
          <TimelineView trip={trip} dayPlans={dayPlans} />
        )}
        {currentView === "expenses" && (
          <ExpensesPage trip={trip} places={places} />
        )}
      </main>
    </div>
  );
};

export default App;
