import React, { useState, useEffect } from 'react';
import { participantsAPI, familiesAPI } from './services/api';

const ParticipantsManager = ({ trip }) => {
    const [participants, setParticipants] = useState([]);
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(false);

    // Forms
    const [newFamilyName, setNewFamilyName] = useState('');
    const [newHeadName, setNewHeadName] = useState('');
    const [newIndependentName, setNewIndependentName] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [selectedFamilyId, setSelectedFamilyId] = useState(null);

    useEffect(() => {
        if (trip) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trip]);

    const fetchData = async () => {
        if (!trip) return;
        setLoading(true);
        try {
            const pRes = await participantsAPI.getByTrip(trip._id);
            const fRes = await familiesAPI.getByTrip(trip._id);
            setParticipants(pRes.data);
            setFamilies(fRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFamily = async (e) => {
        e.preventDefault();
        if (!newFamilyName.trim() || !newHeadName.trim()) return;
        try {
            await familiesAPI.create({
                tripId: trip._id,
                name: newFamilyName,
                headName: newHeadName
            });
            setNewFamilyName('');
            setNewHeadName('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to create family");
        }
    };

    const handleCreateIndependent = async (e) => {
        e.preventDefault();
        if (!newIndependentName.trim()) return;
        try {
            await participantsAPI.create({
                tripId: trip._id,
                name: newIndependentName,
                isHead: true
            });
            setNewIndependentName('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to add participant");
        }
    };

    const handleAddMemberToFamily = async (e) => {
        e.preventDefault();
        if (!selectedFamilyId || !newMemberName.trim()) return;
        try {
            await familiesAPI.addMember(selectedFamilyId, { name: newMemberName });
            setNewMemberName('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to add member");
        }
    };

    const handleDeleteParticipant = async (id) => {
        if (!window.confirm("Delete this participant?")) return;
        try {
            await participantsAPI.delete(id);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete");
        }
    };

    const handleDeleteFamily = async (id) => {
        if (!window.confirm("Delete this family? Members will become independent.")) return;
        try {
            await familiesAPI.delete(id);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete family");
        }
    };

    const independentParticipants = participants.filter(p => !p.familyId);

    return (
        <div className="space-y-8">
            {/* 1. Families Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">👨‍👩‍👧‍👦</span>
                    Families & Groups
                </h3>

                {/* Create Family Form */}
                <form onSubmit={handleCreateFamily} className="flex gap-3 mb-6 bg-gray-50 p-4 rounded-lg">
                    <input
                        type="text"
                        placeholder="Family Name (e.g. Smith Family)"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
                        value={newFamilyName}
                        onChange={e => setNewFamilyName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Head Name (Pays)"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
                        value={newHeadName}
                        onChange={e => setNewHeadName(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition">
                        Create Family
                    </button>
                </form>

                {/* List Families */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {families.map(family => (
                        <div key={family._id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg text-gray-800">{family.name}</h4>
                                <button
                                    onClick={() => handleDeleteFamily(family._id)}
                                    className="text-red-400 hover:text-red-600 text-sm"
                                    title="Delete Family"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="mb-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Head (Payer)</span>
                                <div className="flex items-center text-green-700 font-medium bg-green-50 p-1.5 rounded mt-1">
                                    👑 {family.headId?.name || "Unknown"}
                                </div>
                            </div>

                            <div className="mb-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dependents</span>
                                <ul className="mt-1 space-y-1">
                                    {family.members && family.members.filter(m => m._id !== family.headId?._id).map(member => (
                                        <li key={member._id} className="flex justify-between items-center bg-gray-50 p-1.5 rounded text-sm text-gray-700">
                                            <span>👶 {member.name}</span>
                                            <button
                                                onClick={() => handleDeleteParticipant(member._id)}
                                                className="text-gray-400 hover:text-red-500 ml-2"
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                    {(!family.members || family.members.filter(m => m._id !== family.headId?._id).length === 0) && (
                                        <li className="text-sm text-gray-400 italic">No dependents yet</li>
                                    )}
                                </ul>
                            </div>

                            {/* Add Member Form */}
                            <form
                                onSubmit={(e) => {
                                    setSelectedFamilyId(family._id);
                                    handleAddMemberToFamily(e);
                                }}
                                className="flex gap-2 mt-3 pt-3 border-t border-gray-100"
                            >
                                <input
                                    type="text"
                                    placeholder="Add dependent..."
                                    className="w-full text-sm p-1.5 border border-gray-300 rounded"
                                    value={selectedFamilyId === family._id ? newMemberName : ''}
                                    onChange={e => {
                                        setSelectedFamilyId(family._id);
                                        setNewMemberName(e.target.value);
                                    }}
                                />
                                <button type="submit" className="text-blue-500 hover:bg-blue-100 p-1.5 rounded transition">
                                    +
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Independent Participants Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                    <span className="bg-purple-100 text-purple-600 p-2 rounded-full mr-2">👤</span>
                    Independent Travelers
                </h3>
                <p className="text-sm text-gray-500 mb-4">People who pay for themselves and are not part of any family group.</p>

                <form onSubmit={handleCreateIndependent} className="flex gap-3 mb-6 max-w-lg">
                    <input
                        type="text"
                        placeholder="Participant Name"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-400"
                        value={newIndependentName}
                        onChange={e => setNewIndependentName(e.target.value)}
                    />
                    <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-medium transition">
                        Add
                    </button>
                </form>

                <div className="flex flex-wrap gap-3">
                    {independentParticipants.length === 0 && (
                        <span className="text-gray-400 italic">No independent participants added.</span>
                    )}
                    {independentParticipants.map(person => (
                        <div key={person._id} className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg text-purple-900 shadow-sm">
                            <span className="font-medium">{person.name}</span>
                            <button
                                onClick={() => handleDeleteParticipant(person._id)}
                                className="text-purple-300 hover:text-red-500 ml-2 font-bold"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParticipantsManager;
