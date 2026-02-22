import React, { useState, useEffect } from "react";
import { participantsAPI, expensesAPI } from "./services/api";
import ParticipantsManager from "./ParticipantsManager";
import SettlementReport from "./SettlementReport";
import HistoryModal from "./HistoryModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const toLocalISOString = (date) => {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
};

const EXPENSE_CATEGORIES = ['food', 'transport', 'stay', 'tickets', 'shopping', 'other'];

const AddExpenseModal = ({
  isOpen,
  onClose,
  trip,
  participants,
  places,
  onAddExpenseSubmit,
}) => {
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    paidByParticipant: "",
    description: "",
    modeOfPayment: "UPI",
    placeId: "",
    category: "other",
    paymentTime: toLocalISOString(new Date()),
    splitAmong: [],
    isPersonal: false
  });

  useEffect(() => {
    if (isOpen && participants.length > 0) {
      // Default to checking all participants for split
      const allIds = participants.map(p => p._id);
      setExpenseForm({
        amount: "",
        paidByParticipant: "",
        description: "",
        modeOfPayment: "UPI",
        placeId: "",
        category: "other",
        paymentTime: toLocalISOString(new Date()),
        splitAmong: allIds,
        isPersonal: false
      });
    }
  }, [isOpen, participants]);

  const handleSplitToggle = (participantId) => {
    if (expenseForm.isPersonal) return; // Can't toggle if personal

    setExpenseForm(prev => {
      const current = prev.splitAmong;
      if (current.includes(participantId)) {
        return { ...prev, splitAmong: current.filter(id => id !== participantId) };
      } else {
        return { ...prev, splitAmong: [...current, participantId] };
      }
    });
  };

  const handleIsPersonalChange = (e) => {
    const isPersonal = e.target.checked;
    setExpenseForm(prev => ({
      ...prev,
      isPersonal,
      // If personal, splitAmong is just the payer (will be handled by backend logic too, but good distinct visual)
      splitAmong: isPersonal && prev.paidByParticipant ? [prev.paidByParticipant] : prev.splitAmong
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (expenseForm.splitAmong.length === 0 && !expenseForm.isPersonal) {
      alert("Please select at least one person to split with.");
      return;
    }
    await onAddExpenseSubmit(expenseForm);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-[95%] relative max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4 text-slate-700">Add New Expense</h3>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
              <input
                type="number"
                step="0.01"
                required
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              />
            </div>

            {/* Payer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
              <select
                required
                value={expenseForm.paidByParticipant}
                onChange={(e) => setExpenseForm({ ...expenseForm, paidByParticipant: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              >
                <option value="">Select Payer</option>
                {participants.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} {p.familyId?.name ? `(${p.familyId.name})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              rows="2"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={expenseForm.modeOfPayment}
                onChange={(e) => setExpenseForm({ ...expenseForm, modeOfPayment: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="datetime-local"
                value={expenseForm.paymentTime}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentTime: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              />
            </div>
          </div>

          {/* Split Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">Split Among</label>
              <label className="flex items-center text-sm text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={expenseForm.isPersonal}
                  onChange={handleIsPersonalChange}
                  className="mr-2"
                />
                Personal Expense (Only Payer)
              </label>
            </div>

            {!expenseForm.isPersonal && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {participants.map(p => (
                  <label key={p._id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={expenseForm.splitAmong.includes(p._id)}
                      onChange={() => handleSplitToggle(p._id)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            )}
            {expenseForm.isPersonal && (
              <p className="text-sm text-gray-500 italic">This expense will be assigned 100% to the payer.</p>
            )}
          </div>

          {/* Place Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linked Place (Optional)</label>
            <select
              value={expenseForm.placeId}
              onChange={(e) => setExpenseForm({ ...expenseForm, placeId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">None</option>
              {places.map((place) => (
                <option key={place._id} value={place._id}>{place.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-[#9ed454] text-white rounded-lg hover:bg-[#7cb83e] font-bold text-lg shadow-md transition transform hover:-translate-y-0.5"
          >
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
};

const ExpensesPage = ({ trip, places }) => {
  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState("expenses");

  useEffect(() => {
    if (trip) {
      if (activeTab === "participants") {
        // fetching done inside ParticipantsManager usually, but we need participants for AddModal too
        // so let's fetch here or re-fetch when tab changes
      }
      fetchCommonData(trip._id);
    }
  }, [trip, activeTab]);

  const fetchCommonData = async (tripId) => {
    try {
      const [pRes, eRes] = await Promise.all([
        participantsAPI.getByTrip(tripId),
        expensesAPI.getByTrip(tripId)
      ]);
      setParticipants(pRes.data);
      setExpenses(eRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddExpenseSubmit = async (expenseFormData) => {
    if (!trip) return;
    try {
      await expensesAPI.create({
        ...expenseFormData,
        trip_id: trip._id, // API expects snake_case for trip_id sometimes, ensuring compatibility
        tripId: trip._id,
        amount: parseFloat(expenseFormData.amount),
      });
      fetchCommonData(trip._id);
    } catch (error) {
      console.error("Error adding expense:", error);
      alert(error.response?.data?.error || "Failed to add expense");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await expensesAPI.delete(expenseId);
      fetchCommonData(trip._id);
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert(error.response?.data?.error || "Failed to delete expense");
    }
  };

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = expense.payment_time ? expense.payment_time.slice(0, 10) : "N/A";
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a));
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // PDF Generation (Simplified for new structure)
  const handleDownloadPdf = () => {
    if (!trip) return;
    const doc = new jsPDF();
    doc.text(`Expense Report: ${trip.destination}`, 15, 15);
    doc.text(`Total: ₹${totalExpenses.toFixed(2)}`, 15, 25);

    const tableRows = expenses.map(e => [
      e.payment_time?.slice(0, 10),
      e.description,
      e.paidByParticipant?.name || 'Unknown',
      `₹${e.amount}`,
      e.category
    ]);

    autoTable(doc, {
      head: [['Date', 'Description', 'Paid By', 'Amount', 'Category']],
      body: tableRows,
      startY: 35
    });

    doc.save(`Expenses_${trip.destination}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-slate-700">Expense Tracker</h2>
      </div>

      {!trip ? (
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm mb-6">
          Please select a trip from Home page to track expenses.
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'expenses' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              💸 Expenses
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'participants' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              👥 Participants
            </button>
            <button
              onClick={() => setActiveTab("settlements")}
              className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'settlements' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ⚖️ Settlements
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📜 History
            </button>
          </div>

          {/* Content */}
          {activeTab === "participants" && (
            <ParticipantsManager trip={trip} />
          )}

          {activeTab === "settlements" && (
            <SettlementReport trip={trip} />
          )}

          {activeTab === "history" && (
            <HistoryModal
              isOpen={true}
              onClose={() => setActiveTab("expenses")}
              trip={trip}
              inline={true}
            />
          )}

          {activeTab === "expenses" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                  <p className="text-gray-500 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold text-slate-700">₹{totalExpenses.toLocaleString()}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDownloadPdf} className="px-4 py-2 text-blue-600 border border-blue-200 rounded hover:bg-blue-50">Download PDF</button>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="px-4 py-2 bg-[#9ed454] text-white rounded hover:bg-[#7cb83e] shadow-md"
                  >
                    + Add Expense
                  </button>
                </div>
              </div>

              {sortedDates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">💸</p>
                  <p>No expenses added yet. Add participants first, then track spending!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedDates.map((date) => (
                    <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-semibold text-gray-600 flex justify-between">
                        <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">
                          ₹{groupedExpenses[date].reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {groupedExpenses[date].map((expense) => (
                          <div key={expense._id} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${categoryColor(expense.category)}`}>
                                {categoryIcon(expense.category)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{expense.description}</p>
                                <div className="flex text-xs text-gray-500 gap-2 mt-0.5">
                                  <span className="font-semibold text-blue-600">{expense.paidByParticipant?.name || 'Unknown'}</span>
                                  <span>•</span>
                                  <span>{expense.modeOfPayment}</span>
                                  {expense.isPersonal && <span className="text-orange-500">• Personal</span>}
                                  {expense.splitAmong?.length > 0 && !expense.isPersonal && (
                                    <span>• Split with {expense.splitAmong.length} others</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-slate-700">₹{expense.amount.toLocaleString()}</span>
                              <button onClick={() => handleDeleteExpense(expense._id)} className="text-gray-300 hover:text-red-500 transition">
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        trip={trip}
        participants={participants}
        places={places}
        onAddExpenseSubmit={handleAddExpenseSubmit}
      />


    </div>
  );
};

// Helper functions for UI
const categoryColor = (cat) => {
  const map = {
    food: 'bg-orange-100 text-orange-600',
    transport: 'bg-blue-100 text-blue-600',
    stay: 'bg-purple-100 text-purple-600',
    tickets: 'bg-pink-100 text-pink-600',
    shopping: 'bg-yellow-100 text-yellow-600',
    other: 'bg-gray-100 text-gray-600'
  };
  return map[cat] || map.other;
};

const categoryIcon = (cat) => {
  const map = {
    food: '🍔',
    transport: '🚕',
    stay: '🏨',
    tickets: '🎟️',
    shopping: '🛍️',
    other: '📝'
  };
  return map[cat] || map.other;
};

export default ExpensesPage;
