import React, { useEffect, useMemo, useState } from "react";
import "./index.css";
import { tripAPI, placesAPI, itineraryAPI } from "./services/api";

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
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const categoryColor = (cat) => {
  switch (cat) {
    case "historical":
      return "bg-tan";
    case "restaurant":
      return "bg-lime-green";
    case "shopping":
      return "bg-sky-blue";
    case "nature":
      return "bg-pale-cyan";
    case "adventure":
      return "bg-medium-slate-blue text-white";
    case "cultural":
      return "bg-sky-blue/70";
    case "entertainment":
      return "bg-lime-green/70";
    default:
      return "bg-sky-blue";
  }
};

const App = () => {
  const [currentView, setCurrentView] = useState("setup");

  // Trip
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

  // Load initial places (sample) and keep backend healthy
  useEffect(() => {
    (async () => {
      try {
        await placesAPI.getAll().then((r) => setPlaces(r.data));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Helpers
  const refreshItinerary = async (tripId) => {
    const res = await itineraryAPI.getByTrip(tripId);
    setDayPlans(res.data);
    if (!activeDayId && res.data.length > 0) setActiveDayId(res.data[0].id);
  };

  // Trip setup submit
  const handleTripSubmit = async (e) => {
    e.preventDefault();
    const created = await tripAPI.create(tripForm);
    const t = created.data;
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

  // Reorder items up/down
  const moveItem = async (itemId, dir) => {
    if (!trip || !activeDayId) return;
    const day = dayPlans.find((d) => d.id === activeDayId);
    const items = [...day.items].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const idx = items.findIndex((i) => i.id === itemId);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const tmp = items[idx].order;
    items[idx].order = items[swapIdx].order;
    items[swapIdx].order = tmp;
    await itineraryAPI.reorderPlaces(
      activeDayId,
      items.map((i) => ({ id: i.id, order: i.order }))
    );
    await refreshItinerary(trip.id);
  };

  // Timeline component
  const Timeline = ({ items }) => {
    const sorted = [...(items || [])].sort((a, b) =>
      (a.startTime || "").localeCompare(b.startTime || "")
    );
    return (
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-4">
          {sorted.map((it) => (
            <div key={it.id} className="relative">
              <div className="absolute -left-1 top-2 h-3 w-3 rounded-full bg-sky-blue border border-white shadow" />
              <div className="bg-white rounded-lg border p-3 shadow-travel">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {it.startTime} – {it.endTime}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${categoryColor(
                      it.category
                    )}`}
                  >
                    {it.category}
                  </span>
                </div>
                <div className="mt-1 font-semibold">{it.placeName}</div>
                {it.travelTimeToNext ? (
                  <div className="mt-1 text-xs text-gray-500">
                    Travel to next: {it.travelTimeToNext} min
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="text-gray-500 text-sm">No items scheduled</div>
          )}
        </div>
      </div>
    );
  };

  // Nav
  const Nav = () => (
    <nav className="bg-sky-blue text-white p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">TripPlan</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView("setup")}
            className={`px-3 py-2 rounded ${
              currentView === "setup"
                ? "bg-medium-slate-blue"
                : "hover:bg-sky-blue/80"
            }`}
          >
            Trip Setup
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
    </nav>
  );

  const TripSetup = () => (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">
        Plan Your Trip
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
        <div className="grid grid-cols-2 gap-4">
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
            onChange={(e) =>
              setTripForm({ ...tripForm, budget: e.target.value })
            }
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

  const Places = () => (
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
          <input
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            placeholder="Place name"
            value={placeForm.name}
            onChange={(e) =>
              setPlaceForm({ ...placeForm, name: e.target.value })
            }
          />
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
          <input
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            placeholder="Address"
            value={placeForm.address}
            onChange={(e) =>
              setPlaceForm({ ...placeForm, address: e.target.value })
            }
          />
          <textarea
            rows={2}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-blue"
            placeholder="Notes"
            value={placeForm.notes}
            onChange={(e) =>
              setPlaceForm({ ...placeForm, notes: e.target.value })
            }
          />
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

  const Planner = () => (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-travel">
            <h3 className="font-semibold mb-3">Days</h3>
            <div className="space-y-2">
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

            <form
              onSubmit={addScheduleItem}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4"
            >
              <select
                required
                className="p-2 border rounded"
                value={scheduleForm.placeId}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, placeId: e.target.value })
                }
              >
                <option value="">Select place</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                required
                type="time"
                className="p-2 border rounded"
                value={scheduleForm.startTime}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    startTime: e.target.value,
                  })
                }
              />
              <input
                required
                type="time"
                className="p-2 border rounded"
                value={scheduleForm.endTime}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                }
              />
              <input
                type="number"
                min="0"
                className="p-2 border rounded"
                placeholder="Travel to next (min)"
                value={scheduleForm.travelTimeToNext}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    travelTimeToNext: e.target.value,
                  })
                }
              />
              <button
                type="submit"
                className="bg-lime-green text-white rounded px-3 py-2"
              >
                Add
              </button>
            </form>

            <div className="space-y-2">
              {(activeDay?.items || [])
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <div className="font-medium">{it.placeName}</div>
                      <div className="text-xs text-gray-600">
                        {it.startTime}–{it.endTime} • Order {it.order}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveItem(it.id, "up")}
                        className="px-2 py-1 border rounded"
                      >
                        Up
                      </button>
                      <button
                        onClick={() => moveItem(it.id, "down")}
                        className="px-2 py-1 border rounded"
                      >
                        Down
                      </button>
                      <button
                        onClick={() => removeScheduleItem(it.id)}
                        className="px-2 py-1 border rounded text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              {(!activeDay || activeDay.items.length === 0) && (
                <div className="text-sm text-gray-500">No items yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const TimelineView = () => (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">
        Timeline
      </h2>
      {!trip && (
        <div className="bg-white p-4 rounded border">
          Create and save a trip first in Trip Setup.
        </div>
      )}
      {trip && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-travel">
            <h3 className="font-semibold mb-3">Days</h3>
            <div className="space-y-2">
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
            <h3 className="font-semibold mb-3">
              {activeDay ? `Day: ${formatDate(activeDay.date)}` : "—"}
            </h3>
            <Timeline items={activeDay?.items || []} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-pale-cyan">
      <Nav />
      <main className="py-8">
        {currentView === "setup" && <TripSetup />}
        {currentView === "places" && <Places />}
        {currentView === "planner" && <Planner />}
        {currentView === "timeline" && <TimelineView />}
      </main>
    </div>
  );
};

export default App;
