import React, { useState, useEffect } from 'react';
import { ledgerAPI } from './services/api';

const HistoryModal = ({ isOpen, onClose }) => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchLedgerEntries = async () => {
        try {
          setLoading(true);
          const response = await ledgerAPI.getAll();
          console.log("Ledger entries received:", response.data);
          setLedgerEntries(response.data);
        } catch (err) {
          console.error("Error fetching ledger entries:", err);
          setError("Failed to load history.");
        } finally {
          setLoading(false);
        }
      };
      fetchLedgerEntries();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-[92%] relative">
        <h3 className="text-2xl font-bold mb-6 text-slate-700">
          Payment History Ledger
        </h3>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <div className="max-h-96 overflow-y-auto space-y-4">
          {loading && <p>Loading history...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && ledgerEntries.length === 0 && (
            <p>No history entries found.</p>
          )}
          {!loading && ledgerEntries.length > 0 && (
            <ul className="space-y-3">
              {ledgerEntries.map((entry) => (
                <li key={entry._id} className="bg-gray-50 p-3 rounded-md text-sm">
                  <p className="font-semibold text-gray-700">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  <p className="text-gray-600">{entry.event_description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
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