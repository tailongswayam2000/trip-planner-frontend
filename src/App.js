import React, { useEffect, useMemo, useState } from "react";
import "./index.css";
import "./Timeline.css";
import { tripAPI, placesAPI, itineraryAPI } from "./services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const categories = [
  "historical",
  "restaurant",
  "shopping",
  "nature",
  "adventure",
  "cultural",
  "entertainment",
];
const travelModes = ["flight", "train", "car", "bus", "other"];

const getDateRange = (start, end) => {
  if (!start || !end) return [];
  const out = [];
  const s = new Date(start);
  const e = new Date(end);
  let d = new Date(s);
  while (d < e) {
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
    historical: "bg-orange-100 text-orange-800 border border-orange-200",
    restaurant: "bg-blue-100 text-blue-800 border border-blue-200",
    shopping: "bg-green-100 text-green-800 border border-green-200",
    nature: "bg-purple-100 text-purple-800 border border-purple-200",
    adventure: "bg-pink-100 text-pink-800 border border-pink-200",
    cultural: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    entertainment: "bg-teal-100 text-teal-800 border border-teal-200",
  };
  return colors[category] || "bg-gray-100 text-gray-800 border border-gray-200";
};

const Home = ({
  allTrips,
  onSelectTrip,
  onDeleteTrip,
  handleTripSubmit,
  tripForm,
  setTripForm,
}) => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <TripSetup
          handleTripSubmit={handleTripSubmit}
          tripForm={tripForm}
          setTripForm={setTripForm}
        />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">
          Your Trips
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-travel">
          {allTrips.length === 0 ? (
            <p>You have no trips planned yet.</p>
          ) : (
            <ul className="space-y-4">
              {allTrips.map((trip) => (
                <li
                  key={trip.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{trip.locationOfStay}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(trip.checkInDate)} -{" "}
                      {formatDate(trip.checkOutDate)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectTrip(trip.id)}
                      className="px-3 py-1 bg-sky-blue text-white rounded hover:bg-medium-slate-blue"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => onDeleteTrip(trip.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// Timeline component
const Timeline = ({ dayPlans }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-slate-700 mb-12 embossed-text">
          Travel Timeline
        </h1>

        {dayPlans.map((day, dayIndex) => (
          <React.Fragment key={day.id}>
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
                      <div key={item.id} className="relative">
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
                            🚶‍♂️ {item.travelTimeToNext} min travel to next
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

const Nav = ({ currentView, setCurrentView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-sky-blue text-white p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plan My Trip</h1>
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
        </div>
        <div className={`hidden md:flex gap-2`}>
          <button
            onClick={() => setCurrentView("home")}
            className={`px-3 py-2 rounded ${
              currentView === "home"
                ? "bg-medium-slate-blue"
                : "hover:bg-sky-blue/80"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentView("places")}
            className={`px-3 py-2 rounded ${
              currentView === "places"
                ? "bg-medium-slate-blue"
                : "hover:bg-sky-blue/80"
            }`}
          >
            Places
          </button>
          <button
            onClick={() => setCurrentView("planner")}
            className={`px-3 py-2 rounded ${
              currentView === "planner"
                ? "bg-medium-slate-blue"
                : "hover:bg-sky-blue/80"
            }`}
          >
            Daily Planner
          </button>
          <button
            onClick={() => setCurrentView("timeline")}
            className={`px-3 py-2 rounded ${
              currentView === "timeline"
                ? "bg-medium-slate-blue"
                : "hover:bg-sky-blue/80"
            }`}
          >
            Timeline
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-4">
          <button
            onClick={() => {
              setCurrentView("home");
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded ${
              currentView === "home" ? "bg-medium-slate-blue" : ""
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              setCurrentView("places");
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded ${
              currentView === "places" ? "bg-medium-slate-blue" : ""
            }`}
          >
            Places
          </button>
          <button
            onClick={() => {
              setCurrentView("planner");
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded ${
              currentView === "planner" ? "bg-medium-slate-blue" : ""
            }`}
          >
            Daily Planner
          </button>
          <button
            onClick={() => {
              setCurrentView("timeline");
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded ${
              currentView === "timeline" ? "bg-medium-slate-blue" : ""
            }`}
          >
            Timeline
          </button>
        </div>
      )}
    </nav>
  );
};

const TripSetup = ({ handleTripSubmit, tripForm, setTripForm }) => (
  <div className="max-w-3xl mx-auto">
    <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">
      Create a New Trip
    </h2>
    <form
      onSubmit={handleTripSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow-travel"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location of Stay
        </label>
        <input
          type="text"
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
          value={tripForm.locationOfStay}
          onChange={(e) =>
            setTripForm({ ...tripForm, locationOfStay: e.target.value })
          }
          placeholder="Hotel name, City"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-in Date
          </label>
          <input
            type="date"
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            value={tripForm.checkInDate}
            onChange={(e) =>
              setTripForm({ ...tripForm, checkInDate: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-out Date
          </label>
          <input
            type="date"
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            value={tripForm.checkOutDate}
            onChange={(e) =>
              setTripForm({ ...tripForm, checkOutDate: e.target.value })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Mode
          </label>
          <select
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            value={tripForm.travelMode}
            onChange={(e) =>
              setTripForm({ ...tripForm, travelMode: e.target.value })
            }
          >
            {travelModes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of People
          </label>
          <input
            type="number"
            min="1"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            value={tripForm.numberOfPeople}
            onChange={(e) =>
              setTripForm({
                ...tripForm,
                numberOfPeople: Number(e.target.value),
              })
            }
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget (₹)
        </label>
        <input
          type="number"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
          value={tripForm.budget}
          onChange={(e) => setTripForm({ ...tripForm, budget: e.target.value })}
          placeholder="50000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
          value={tripForm.description}
          onChange={(e) =>
            setTripForm({ ...tripForm, description: e.target.value })
          }
          placeholder="Family vacation, business trip, etc."
        />
      </div>
      <button
        type="submit"
        className="w-full bg-lime-green text-white py-3 rounded-lg"
      >
        Save Trip Details
      </button>
    </form>
  </div>
);

const Places = ({ addPlace, placeForm, setPlaceForm, places, removePlace }) => (
  <div className="max-w-6xl mx-auto p-6">
    <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">
      Manage Places
    </h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form
        onSubmit={addPlace}
        className="bg-white p-6 rounded-lg shadow-travel space-y-4"
      >
        <h3 className="text-xl font-semibold">Add New Place</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Place name
            </label>
            <input
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
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
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            placeholder="Notes"
            value={placeForm.notes}
            onChange={(e) =>
              setPlaceForm({ ...placeForm, notes: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          className="w-full bg-lime-green text-white py-2 rounded-lg"
        >
          Add Place
        </button>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-travel">
        <h3 className="text-xl font-semibold mb-4">
          Places List ({places.length})
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {places.map((p) => (
            <div key={p.id} className="p-3 border rounded-lg">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">
                    {p.category} •{" "}
                    {p.estimated_duration ?? p.estimatedDuration ?? 60} mins
                  </div>
                  {p.address ? (
                    <div className="text-sm text-gray-500">{p.address}</div>
                  ) : null}
                </div>
                <button
                  onClick={() => removePlace(p.id)}
                  className="text-red-600"
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
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">
        Daily Planner
      </h2>
      {!trip && (
        <div className="bg-white p-4 rounded border">
          Create and save a trip first in Trip Setup.
        </div>
      )}
      {trip && (
        <div>
          <div className="bg-white p-4 rounded-lg shadow-travel mb-6">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full text-left font-semibold text-lg flex justify-between items-center"
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
            <div className="bg-white p-4 rounded-lg shadow-travel">
              <h3 className="font-semibold mb-3">Days</h3>
              <div className="grid grid-cols-3 gap-2">
                {dayPlans.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDayId(d.id)}
                    className={`w-full text-left p-2 rounded border ${
                      activeDayId === d.id
                        ? "bg-sky-blue text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {formatDate(d.date)} ({d.items.length})
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-travel lg:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">
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
                      className="p-2 border rounded w-full"
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
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Travel to next (min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="p-2 border rounded w-full"
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
                      className="p-2 border rounded w-full"
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
                      className="p-2 border rounded w-full"
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
                  className="bg-lime-green text-white rounded px-3 py-2 mt-4 w-full"
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
                      className={`space-y-2 p-1 rounded ${
                        snapshot.isDraggingOver ? "bg-sky-blue/10" : ""
                      }`}
                    >
                      {(activeDay?.items || [])
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((it, index) => (
                          <Draggable
                            key={it.id}
                            draggableId={it.id.toString()}
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
                                    ? "rgba(123,187,255,0.1)"
                                    : "white",
                                }}
                                className="flex items-center justify-between p-2 border rounded"
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
                                    <div className="font-medium">
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
                                    className="px-2 py-1 border rounded"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeScheduleItem(it.id)}
                                    className="px-2 py-1 border rounded text-red-600"
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
  // Professional PDF Generation Code
  // Replace your existing handleDownloadPdf function with this

  // Professional PDF Generation Code - Fixed Version
  // Replace your existing handleDownloadPdf function with this

  const handleDownloadPdf = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25; // Increased margin for better spacing
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Color palette
    const colors = {
      primary: [41, 98, 255], // Blue
      secondary: [100, 116, 139], // Slate
      accent: [59, 130, 246], // Light blue
      text: [15, 23, 42], // Dark slate
      lightText: [71, 85, 105], // Medium slate
      background: [248, 250, 252], // Very light slate
      border: [226, 232, 240], // Light border
    };

    // Helper functions
    const addPage = () => {
      doc.addPage();
      yPos = margin;
    };

    const checkPageBreak = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin - 10) {
        // Leave space for footer
        addPage();
      }
    };

    const setColor = (colorArray, type = "text") => {
      if (type === "text") {
        doc.setTextColor(colorArray[0], colorArray[1], colorArray[2]);
      } else if (type === "fill") {
        doc.setFillColor(colorArray[0], colorArray[1], colorArray[2]);
      } else if (type === "draw") {
        doc.setDrawColor(colorArray[0], colorArray[1], colorArray[2]);
      }
    };

    const addText = (text, x, y, options = {}) => {
      // Ensure text stays within margins
      if (x < margin) x = margin;
      if (x > pageWidth - margin) x = pageWidth - margin;
      doc.text(text, x, y, options);
    };

    const addRect = (x, y, width, height, style = "F") => {
      // Ensure rectangles stay within margins
      if (x < 0) x = 0;
      if (x + width > pageWidth) width = pageWidth - x;
      doc.rect(x, y, width, height, style);
    };

    // === COVER PAGE ===
    // Header background
    setColor(colors.primary, "fill");
    addRect(0, 0, pageWidth, 50, "F");

    // Title
    setColor([255, 255, 255], "text");
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    addText("TRAVEL ITINERARY", margin, 30);

    // Trip destination
    yPos = 70;
    setColor(colors.text, "text");
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    addText(`Trip to ${trip.locationOfStay}`, margin, yPos);

    yPos += 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    setColor(colors.lightText, "text");
    addText(
      `${formatDate(trip.checkInDate)} - ${formatDate(trip.checkOutDate)}`,
      margin,
      yPos
    );

    // Trip details section
    yPos += 25;
    setColor(colors.text, "text");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText("Trip Details", margin, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    setColor(colors.lightText, "text");

    const duration = Math.ceil(
      (new Date(trip.checkOutDate) - new Date(trip.checkInDate)) /
        (1000 * 60 * 60 * 24)
    );

    addText(`Duration: ${duration} days`, margin, yPos);
    yPos += 8;
    addText(`Number of travelers: ${trip.numberOfPeople}`, margin, yPos);
    yPos += 8;
    addText(`Travel mode: ${trip.travelMode}`, margin, yPos);
    yPos += 8;
    addText(`Budget: ₹${trip.budget.toLocaleString()}`, margin, yPos);
    yPos += 8;
    addText(
      `Total activities: ${dayPlans.reduce(
        (acc, day) => acc + day.items.length,
        0
      )}`,
      margin,
      yPos
    );

    // Description section
    if (trip.description) {
      yPos += 20;
      setColor(colors.text, "text");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText("Trip Overview", margin, yPos);

      yPos += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      setColor(colors.lightText, "text");

      // Word wrap description within margins
      const lines = doc.splitTextToSize(trip.description, contentWidth);
      lines.forEach((line) => {
        addText(line, margin, yPos);
        yPos += 6;
      });
    }

    // === DETAILED ITINERARY ===
    addPage();

    // Page header
    setColor(colors.primary, "fill");
    addRect(0, 0, pageWidth, 35, "F");

    setColor([255, 255, 255], "text");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText("DETAILED ITINERARY", margin, 22);

    yPos = 50;

    // Daily itinerary
    dayPlans.forEach((day, dayIndex) => {
      checkPageBreak(40);

      // Day header
      setColor(colors.accent, "fill");
      addRect(margin, yPos, contentWidth, 15, "F");

      setColor([255, 255, 255], "text");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      addText(
        `Day ${dayIndex + 1}: ${formatDate(day.date)}`,
        margin + 5,
        yPos + 10
      );

      yPos += 25;

      if (day.items.length === 0) {
        setColor(colors.lightText, "text");
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        addText("No activities scheduled for this day", margin + 10, yPos);
        yPos += 20;
      } else {
        // Timeline
        const timelineX = margin + 15;
        const contentStartX = margin + 35;

        day.items
          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
          .forEach((item, itemIndex) => {
            checkPageBreak(30);

            // Timeline circle with number
            setColor(colors.primary, "fill");
            doc.circle(timelineX, yPos + 8, 4, "F");

            // Number in circle - properly centered
            setColor([255, 255, 255], "text");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            const numberText = `${itemIndex + 1}`;
            const numberWidth = doc.getTextWidth(numberText);
            addText(numberText, timelineX - numberWidth / 2, yPos + 10);

            // Timeline connecting line
            if (itemIndex < day.items.length - 1) {
              setColor(colors.border, "draw");
              doc.setLineWidth(1);
              doc.line(timelineX, yPos + 12, timelineX, yPos + 35);
            }

            // Activity content box
            setColor(colors.background, "fill");
            addRect(contentStartX, yPos, contentWidth - 20, 20, "F");
            setColor(colors.border, "draw");
            doc.setLineWidth(0.5);
            addRect(contentStartX, yPos, contentWidth - 20, 20, "S");

            // Activity name
            setColor(colors.text, "text");
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            addText(item.placeName, contentStartX + 5, yPos + 8);

            // Time
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            setColor(colors.lightText, "text");
            addText(
              `${item.startTime} - ${item.endTime}`,
              contentStartX + 5,
              yPos + 15
            );

            // Category - simple text
            const categoryText = `Category: ${item.category}`;
            const categoryX = contentStartX + contentWidth - 80;
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            setColor(colors.secondary, "text");
            addText(categoryText, categoryX, yPos + 8);

            yPos += 25;

            // Travel time - clean format
            if (item.travelTimeToNext) {
              setColor(colors.lightText, "text");
              doc.setFontSize(9);
              doc.setFont("helvetica", "italic");
              addText(
                `Travel time to next location: ${item.travelTimeToNext} minutes`,
                contentStartX + 5,
                yPos
              );
              yPos += 10;
            }

            yPos += 5; // Space between activities
          });
      }

      yPos += 15; // Space between days
    });

    // Helper function to add footer to all pages
    const addFooter = () => {
      const totalPages = doc.internal.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Simple footer line
        setColor(colors.lightText, "text");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        const footerY = pageHeight - 15;
        const footerText = `Generated on ${new Date().toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )} | Trip to ${trip.locationOfStay} | Page ${i} of ${totalPages}`;

        // Center the footer text
        const footerWidth = doc.getTextWidth(footerText);
        const footerX = (pageWidth - footerWidth) / 2;
        addText(footerText, footerX, footerY);
      }
    };

    // Add footers to all pages
    addFooter();

    // Save the document
    doc.save(`${trip.locationOfStay.replace(/\s+/g, "_")}_Itinerary.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">
        Full Trip Timeline
      </h2>
      {!trip && (
        <div className="bg-white p-4 rounded border">
          Create and save a trip first in Trip Setup.
        </div>
      )}
      {trip && (
        <>
          <button
            onClick={handleDownloadPdf}
            className="mb-6 px-4 py-2 bg-sky-blue text-white rounded-lg hover:bg-medium-slate-blue"
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
    locationOfStay: "",
    checkInDate: "",
    checkOutDate: "",
    travelMode: "flight",
    numberOfPeople: 2,
    budget: "",
    description: "",
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
    () => dayPlans.find((d) => d.id === activeDayId) || null,
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
      updatedItem.id,
      updatedItem
    );
    await refreshItinerary(trip.id);
    setEditModalOpen(false);
    setEditingItem(null);
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch places
        placesAPI.getAll().then((r) => setPlaces(r.data));

        // Fetch all trips
        tripAPI.getAll().then((res) => setAllTrips(res.data));
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Helpers
  const refreshItinerary = async (tripId) => {
    const res = await itineraryAPI.getByTrip(tripId);
    setDayPlans(res.data);
    if (res.data.length > 0) {
      setActiveDayId(res.data[0].id);
    }
  };

  const handleSelectTrip = async (tripId) => {
    const selectedTrip = allTrips.find((t) => t.id === tripId);
    if (selectedTrip) {
      setTrip(selectedTrip);
      setTripForm({
        locationOfStay: selectedTrip.locationOfStay,
        checkInDate: selectedTrip.checkInDate.slice(0, 10),
        checkOutDate: selectedTrip.checkOutDate.slice(0, 10),
        travelMode: selectedTrip.travelMode,
        numberOfPeople: selectedTrip.numberOfPeople,
        budget: selectedTrip.budget,
        description: selectedTrip.description,
      });
      await refreshItinerary(selectedTrip.id);
      setCurrentView("planner");
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await tripAPI.delete(tripId);
      setAllTrips(allTrips.filter((t) => t.id !== tripId));
      if (trip && trip.id === tripId) {
        setTrip(null);
        setTripForm({
          locationOfStay: "",
          checkInDate: "",
          checkOutDate: "",
          travelMode: "flight",
          numberOfPeople: 2,
          budget: "",
          description: "",
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
    const created = await tripAPI.create(tripForm);
    const t = created.data;
    setAllTrips([...allTrips, t]);
    setTrip(t);

    // Scaffold day plans for each date
    const days = getDateRange(tripForm.checkInDate, tripForm.checkOutDate);
    await Promise.all(
      days.map((date) => itineraryAPI.createDayPlan({ tripId: t.id, date }))
    );
    await refreshItinerary(t.id);
    setCurrentView("planner");
  };

  // Places create/delete
  const addPlace = async (e) => {
    e.preventDefault();
    const res = await placesAPI.create(placeForm);
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
    setPlaces((p) => p.filter((x) => x.id !== id));
  };

  // Add schedule item
  const addScheduleItem = async (e) => {
    e.preventDefault();
    if (!trip || !activeDayId) return;
    const day = dayPlans.find((d) => d.id === activeDayId);
    const nextOrder = (day?.items?.length || 0) + 1;
    await itineraryAPI.addPlaceToDay(activeDayId, {
      placeId: Number(scheduleForm.placeId),
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      order: nextOrder,
      travelTimeToNext: scheduleForm.travelTimeToNext
        ? Number(scheduleForm.travelTimeToNext)
        : null,
    });
    await refreshItinerary(trip.id);
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
    await refreshItinerary(trip.id);
  };

  // Reorder items with drag and drop
  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    if (!trip || !activeDayId) return;

    const day = dayPlans.find((d) => d.id === activeDayId);
    const items = Array.from(day.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    const updatedDayPlans = dayPlans.map((d) =>
      d.id === activeDayId ? { ...d, items: updatedItems } : d
    );
    setDayPlans(updatedDayPlans);

    await itineraryAPI.reorderPlaces(
      activeDayId,
      updatedItems.map((i) => ({ id: i.id, order: i.order }))
    );
    await refreshItinerary(trip.id);
  };

  return (
    <div className="min-h-screen bg-pale-cyan">
      <Nav currentView={currentView} setCurrentView={setCurrentView} />
      <main className="py-8">
        {currentView === "home" && (
          <Home
            allTrips={allTrips}
            onSelectTrip={handleSelectTrip}
            onDeleteTrip={handleDeleteTrip}
            handleTripSubmit={handleTripSubmit}
            tripForm={tripForm}
            setTripForm={setTripForm}
          />
        )}
        {currentView === "places" && (
          <Places
            addPlace={addPlace}
            placeForm={placeForm}
            setPlaceForm={setPlaceForm}
            places={places}
            removePlace={removePlace}
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
      </main>
    </div>
  );
};

export default App;
