import React, { useState } from 'react';


const TripPlanner = () => {
  const [currentView, setCurrentView] = useState('setup');
  const [tripData, setTripData] = useState({
    locationOfStay: '',
    checkInDate: '',
    checkOutDate: '',
    travelMode: 'flight',
    numberOfPeople: 2,
    budget: '',
    description: ''
  });

  const [places, setPlaces] = useState([]);
  const [newPlace, setNewPlace] = useState({
    name: '',
    category: 'historical',
    estimatedDuration: 60,
    notes: '',
    address: ''
  });

  const categories = ['historical', 'restaurant', 'shopping', 'nature', 'adventure', 'cultural', 'entertainment'];
  const travelModes = ['flight', 'train', 'car', 'bus', 'other'];

  const handleTripSubmit = (e) => {
    e.preventDefault();
    console.log('Trip Data:', tripData);
    setCurrentView('places');
  };

  const handleAddPlace = (e) => {
    e.preventDefault();
    const place = {
      ...newPlace,
      id: Date.now(),
    };
    setPlaces([...places, place]);
    setNewPlace({
      name: '',
      category: 'historical',
      estimatedDuration: 60,
      notes: '',
      address: ''
    });
  };

  const Navigation = () => (
    <nav className="bg-sky-blue text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">TripPlan</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setCurrentView('setup')}
            className={`px-4 py-2 rounded ${currentView === 'setup' ? 'bg-medium-slate-blue' : 'bg-transparent hover:bg-sky-blue/80'}`}
          >
            Trip Setup
          </button>
          <button 
            onClick={() => setCurrentView('places')}
            className={`px-4 py-2 rounded ${currentView === 'places' ? 'bg-medium-slate-blue' : 'bg-transparent hover:bg-sky-blue/80'}`}
          >
            Places
          </button>
          <button 
            onClick={() => setCurrentView('planner')}
            className={`px-4 py-2 rounded ${currentView === 'planner' ? 'bg-medium-slate-blue' : 'bg-transparent hover:bg-sky-blue/80'}`}
          >
            Daily Planner
          </button>
          <button 
            onClick={() => setCurrentView('timeline')}
            className={`px-4 py-2 rounded ${currentView === 'timeline' ? 'bg-medium-slate-blue' : 'bg-transparent hover:bg-sky-blue/80'}`}
          >
            Timeline
          </button>
        </div>
      </div>
    </nav>
  );

  const TripSetup = () => (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">Plan Your Trip</h2>
      <form onSubmit={handleTripSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-travel">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location of Stay</label>
          <input
            type="text"
            value={tripData.locationOfStay}
            onChange={(e) => setTripData({...tripData, locationOfStay: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
            placeholder="Hotel name, City"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
            <input
              type="date"
              value={tripData.checkInDate}
              onChange={(e) => setTripData({...tripData, checkInDate: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
            <input
              type="date"
              value={tripData.checkOutDate}
              onChange={(e) => setTripData({...tripData, checkOutDate: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel Mode</label>
            <select
              value={tripData.travelMode}
              onChange={(e) => setTripData({...tripData, travelMode: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
            >
              {travelModes.map(mode => (
                <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of People</label>
            <input
              type="number"
              value={tripData.numberOfPeople}
              onChange={(e) => setTripData({...tripData, numberOfPeople: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Budget (₹)</label>
          <input
            type="number"
            value={tripData.budget}
            onChange={(e) => setTripData({...tripData, budget: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
            placeholder="50000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={tripData.description}
            onChange={(e) => setTripData({...tripData, description: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
            rows="3"
            placeholder="Family vacation, business trip, etc."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-lime-green text-white py-3 px-6 rounded-lg hover:bg-lime-green/90 transition-colors font-semibold"
        >
          Save Trip Details
        </button>
      </form>
    </div>
  );

  const PlacesManagement = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">Manage Places</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-travel">
          <h3 className="text-xl font-semibold mb-4">Add New Place</h3>
          <form onSubmit={handleAddPlace} className="space-y-4">
            <input
              type="text"
              value={newPlace.name}
              onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
              placeholder="Place name"
              required
            />
            
            <select
              value={newPlace.category}
              onChange={(e) => setNewPlace({...newPlace, category: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>

            <input
              type="number"
              value={newPlace.estimatedDuration}
              onChange={(e) => setNewPlace({...newPlace, estimatedDuration: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
              placeholder="Duration (minutes)"
              min="5"
            />

            <input
              type="text"
              value={newPlace.address}
              onChange={(e) => setNewPlace({...newPlace, address: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
              placeholder="Address"
            />

            <textarea
              value={newPlace.notes}
              onChange={(e) => setNewPlace({...newPlace, notes: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent"
              rows="2"
              placeholder="Notes"
            />

            <button
              type="submit"
              className="w-full bg-lime-green text-white py-2 px-4 rounded-lg hover:bg-lime-green/90 transition-colors"
            >
              Add Place
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-travel">
          <h3 className="text-xl font-semibold mb-4">Places List ({places.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {places.map(place => (
              <div key={place.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{place.name}</h4>
                    <p className="text-sm text-gray-600">{place.category} • {place.estimatedDuration} mins</p>
                    {place.address && <p className="text-sm text-gray-500">{place.address}</p>}
                  </div>
                  <button
                    onClick={() => setPlaces(places.filter(p => p.id !== place.id))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {places.length === 0 && (
              <p className="text-gray-500 text-center py-8">No places added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DailyPlanner = () => (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">Daily Planner</h2>
      <div className="bg-white p-6 rounded-lg shadow-travel">
        <p className="text-gray-600">Daily itinerary planning will be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">Features: Day selection, time scheduling, place ordering</p>
      </div>
    </div>
  );

  const TimelineView = () => (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-medium-slate-blue mb-6">Timeline View</h2>
      <div className="bg-white p-6 rounded-lg shadow-travel">
        <p className="text-gray-600">Visual timeline canvas will be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">Features: Timeline visualization, drag-and-drop reordering</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-pale-cyan">
      <Navigation />
      <main className="py-8">
        {currentView === 'setup' && <TripSetup />}
        {currentView === 'places' && <PlacesManagement />}
        {currentView === 'planner' && <DailyPlanner />}
        {currentView === 'timeline' && <TimelineView />}
      </main>
    </div>
  );
};

export default TripPlanner;
