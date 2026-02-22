import React, { useState, useEffect } from 'react';
import { ledgerAPI } from './services/api';

const HistoryModal = ({ isOpen, onClose, trip, inline = false }) => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && trip) {
      const fetchLedgerEntries = async () => {
        try {
          setLoading(true);
          const response = await ledgerAPI.getAll(trip._id);
          setLedgerEntries(response.data);
        } catch (err) {
          console.error("Error fetching ledger entries:", err);
          setError("Failed to load history.");
        } finally {
          setLoading(false);
        }
      };
      fetchLedgerEntries();
    } else if (isOpen && !trip) {
      setError("Please select a trip to view ledger history.");
      setLedgerEntries([]);
      setLoading(false);
    }
  }, [isOpen, trip]);

  if (!isOpen) return null;

  const content = (
    <>
      <h3 className="text-xl font-bold mb-4 text-slate-700 flex items-center">
        <span className="bg-amber-100 text-amber-600 p-2 rounded-full mr-3">📜</span>
        Payment History Ledger
      </h3>
      <div className={`${inline ? '' : 'max-h-96'} overflow-y-auto space-y-3`}>
        {loading && <p className="text-gray-500 text-center py-4">Loading history...</p>}
        {error && <p className="text-red-500 text-center py-4">{error}</p>}
        {!loading && ledgerEntries.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>No history entries found. Add expenses to see the ledger.</p>
          </div>
        )}
        {!loading && ledgerEntries.length > 0 && (
          <ul className="space-y-3">
            {ledgerEntries.map((entry) => (
              <li key={entry._id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:bg-gray-100 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-700">{entry.event_description}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <span className={`font-bold ${entry.event_description.includes('was added')
                        ? 'text-green-600'
                        : entry.event_description.includes('was deleted')
                          ? 'text-red-600'
                          : 'text-slate-700'
                      }`}>
                      {entry.event_description.includes('was added') ? '+' : entry.event_description.includes('was deleted') ? '-' : ''}₹{entry.amount?.toLocaleString()}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  // Inline mode: render as a normal div (for tabs)
  if (inline) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        {content}
      </div>
    );
  }

  // Modal mode: render as overlay (backward compat)
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-[92%] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        {content}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;