import React, { useState, useEffect } from "react";
import { paymentUsersAPI, expensesAPI } from "./services/api";
import HistoryModal from "./HistoryModal";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";

applyPlugin(jsPDF);

const AddExpenseModal = ({
  isOpen,
  onClose,
  trip,
  paymentUsers,
  places,
  onAddExpenseSubmit,
}) => {
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    paymentUserId: "",
    description: "",
    modeOfPayment: "UPI",
    placeId: "",
    paymentTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await onAddExpenseSubmit(expenseForm);
    setExpenseForm({
      amount: "",
      paymentUserId: "",
      description: "",
      modeOfPayment: "UPI",
      placeId: "",
      paymentTime: new Date().toISOString().slice(0, 16),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-[92%] relative">
        <h3 className="text-2xl font-bold mb-6 text-slate-700">
          Add New Expense
        </h3>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, amount: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paid By
            </label>
            <select
              required
              value={expenseForm.paymentUserId}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  paymentUserId: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
            >
              <option value="">Select Payer</option>
              {paymentUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={expenseForm.description}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, description: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
              rows="2"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode of Payment
            </label>
            <select
              value={expenseForm.modeOfPayment}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  modeOfPayment: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Linked Place (Optional)
            </label>
            <select
              value={expenseForm.placeId}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, placeId: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
            >
              <option value="">None</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Time
            </label>
            <input
              type="datetime-local"
              value={expenseForm.paymentTime}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, paymentTime: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff]"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#9ed454] text-white rounded-lg hover:bg-[#7cb83e]"
          >
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
};

const ExpensesPage = ({ trip, places }) => {
  const [paymentUsers, setPaymentUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (trip) {
      fetchPaymentUsers();
      fetchExpenses(trip.id);
    }
  }, [trip]);

  const fetchPaymentUsers = async () => {
    try {
      const response = await paymentUsersAPI.getAll();
      setPaymentUsers(response.data);
    } catch (error) {
      console.error("Error fetching payment users:", error);
    }
  };

  const fetchExpenses = async (tripId) => {
    try {
      const response = await expensesAPI.getByTrip(tripId);
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    try {
      await paymentUsersAPI.create({ name: newUserName });
      setNewUserName("");
      fetchPaymentUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      alert(error.response?.data?.error || "Failed to add user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This will set their associated expenses to NULL."
      )
    )
      return;
    try {
      await paymentUsersAPI.delete(userId);
      fetchPaymentUsers();
      fetchExpenses(trip.id); // Refresh expenses as user might be linked
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.error || "Failed to delete user");
    }
  };

  const handleAddExpenseSubmit = async (expenseFormData) => {
    if (!trip) return;
    try {
      await expensesAPI.create({
        ...expenseFormData,
        tripId: trip.id,
        amount: parseFloat(expenseFormData.amount),
      });
      fetchExpenses(trip.id);
    } catch (error) {
      console.error("Error adding expense:", error);
      alert(error.response?.data?.error || "Failed to add expense");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      await expensesAPI.delete(expenseId);
      fetchExpenses(trip.id);
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert(error.response?.data?.error || "Failed to delete expense");
    }
  };

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = expense.paymentTime.slice(0, 10);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedExpenses).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate user-wise total payments
  const userWisePayments = paymentUsers.reduce((acc, user) => {
    acc[user.id] = { name: user.name, total: 0 };
    return acc;
  }, {});

  expenses.forEach((expense) => {
    if (expense.paymentUserId && userWisePayments[expense.paymentUserId]) {
      userWisePayments[expense.paymentUserId].total += expense.amount;
    }
  });

  const handleDownloadPdf = () => {
    if (!trip) return;

    const doc = new jsPDF();
    let yPos = 15; // Initial Y position
    const leftMargin = 15;
    const rightMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - leftMargin - rightMargin;
    const lineHeight = 7; // Standard line height

    // Helper to add text and manage Y position with max width
    const addText = (text, x, y, options = {}) => {
      doc.text(text, x, y, { maxWidth: textWidth, ...options });
      const textLines = doc.splitTextToSize(text, textWidth);
      yPos = y + textLines.length * lineHeight;
    };

    // Helper to check for page break
    const checkPageBreak = () => {
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        // Reduced margin for footer
        doc.addPage();
        yPos = leftMargin; // Reset Y position for new page
      }
    };

    // --- Expense Report Title ---
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    addText(`Expense Report for ${trip.locationOfStay}`, leftMargin, yPos);
    yPos += 5; // Extra space after title

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(
      `Dates: ${new Date(trip.checkInDate).toLocaleDateString()} - ${new Date(
        trip.checkOutDate
      ).toLocaleDateString()}`,
      leftMargin,
      yPos
    );
    addText(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, leftMargin, yPos);
    yPos += 10; // Space before sections

    // --- Payment Timeline ---
    checkPageBreak();
    doc.setFontSize(18);
    doc.setFont("times", "bold");
    addText("Payment Timeline", leftMargin, yPos);
    yPos += 5; // Extra space after section title

    if (sortedDates.length === 0) {
      doc.setFontSize(10);
      doc.setFont("times", "italic");
      addText("No expenses recorded for this trip yet.", leftMargin + 5, yPos);
      yPos += 5; // Space after message
    } else {
      sortedDates.forEach((date) => {
        checkPageBreak();
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        addText(
          `${new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          leftMargin,
          yPos
        );
        yPos += 3; // Space after day title

        groupedExpenses[date].forEach((expense) => {
          checkPageBreak();
          // const startYForEntry = yPos; // Store starting Y for this entry

          // Line 1: Amount (bold)
          doc.setFontSize(12);
          doc.setFont("times", "bold");
          addText(`₹${expense.amount.toFixed(2)}`, leftMargin, yPos);

          // Line 2: Description, Paid By, Mode
          doc.setFontSize(12);
          doc.setFont("times", "normal");
          const descriptionLine = `${
            expense.description || "No description"
          } (Paid by: ${expense.paymentUserName || "N/A"}, Mode: ${
            expense.modeOfPayment
          })`;
          addText(descriptionLine, leftMargin, yPos);

          // Line 3: Time
          doc.setFontSize(10);
          doc.setFont("times", "italic");
          addText(
            `Time: ${new Date(expense.paymentTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            leftMargin,
            yPos
          );

          // Line 4: Linked Place (Conditional)
          if (expense.placeName) {
            doc.setFontSize(10);
            doc.setFont("times", "italic");
            addText(`Linked to: ${expense.placeName}`, leftMargin, yPos);
          }
          yPos += 5; // Add a small vertical space after each complete expense entry
        });
        yPos += 5; // Space after each day
      });
    }

    // --- User-wise Payment Report (Manual Table) ---
    checkPageBreak();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    addText("User-wise Payment Report", leftMargin, yPos);
    yPos += 5; // Extra space after section title

    const usersWithPayments = Object.values(userWisePayments).filter(
      (user) => user.total > 0
    );

    if (usersWithPayments.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      addText("No user payments recorded yet.", leftMargin + 5, yPos);
      yPos += 5; // Space after message
    } else {
      const colWidth = textWidth / 2; // Divide available width for two columns
      // const tableStartY = yPos;

      // Table Headers
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(92, 85, 225); // Tailwind bg-[#5c55e1]
      doc.setTextColor(255, 255, 255);
      doc.rect(leftMargin, yPos, textWidth, lineHeight + 2, "F"); // Draw filled rectangle for header
      doc.text("Payer Name", leftMargin + 2, yPos + lineHeight);
      doc.text(
        "Total Amount (₹)",
        leftMargin + colWidth + 2,
        yPos + lineHeight
      );
      yPos += lineHeight + 2; // Move yPos past header

      // Table Rows
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0); // Reset text color
      usersWithPayments.forEach((user, index) => {
        checkPageBreak();
        const rowY = yPos;
        doc.rect(leftMargin, rowY, textWidth, lineHeight + 2, "S"); // Draw border for row
        doc.text(user.name, leftMargin + 2, rowY + lineHeight);
        doc.text(
          user.total.toFixed(2),
          leftMargin + colWidth + 2,
          rowY + lineHeight
        );
        yPos += lineHeight + 2;
      });

      // Total Row for User-wise Payments
      checkPageBreak();
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240); // Light gray background
      doc.rect(leftMargin, yPos, textWidth, lineHeight + 2, "F"); // Fill first
      doc.rect(leftMargin, yPos, textWidth, lineHeight + 2, "S"); // Then stroke
      doc.text("Overall Total", leftMargin + 2, yPos + lineHeight);
      doc.text(
        totalExpenses.toFixed(2),
        leftMargin + colWidth + 2,
        yPos + lineHeight
      );
      yPos += lineHeight + 2;
    }

    // --- PDF Footer ---
    const pageCount = doc.internal.numberOfPages;
    const generationDateTime = new Date().toLocaleString();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150); // Gray color
      doc.text(
        `Generated: ${generationDateTime} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`Expense_Report_${trip.locationOfStay}.pdf`);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-700">Expense Tracker</h2>
          {trip && (
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-4 py-2 bg-[#9ed454] text-white rounded-lg hover:bg-[#7cb83e]"
            >
              Add New Expense
            </button>
          )}
          {trip && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="ml-4 px-4 py-2 bg-[#7bbbff] text-white rounded-lg hover:bg-[#5c55e1]"
            >
              Show History
            </button>
          )}
        </div>

        {!trip && (
          <div className="bg-white p-4 rounded border border-gray-200 shadow-sm mb-6">
            Please select a trip to track expenses.
          </div>
        )}

        {trip && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Management */}
            <div className="space-y-6">
              {/* User Management */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 mb-4">
                  Manage Payers
                </h3>
                <form
                  onSubmit={handleAddUser}
                  className="flex items-center gap-2 mb-4"
                >
                  <input
                    type="text"
                    placeholder="New Payer Name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7bbbff] min-w-0"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#9ed454] text-white rounded-lg hover:bg-[#7cb83e]"
                  >
                    Add
                  </button>
                </form>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Current Payers:
                  </h4>
                  {paymentUsers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No payers added yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {paymentUsers.map((user) => (
                        <li
                          key={user.id}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                        >
                          <span>{user.name}</span>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* User-wise Total Payments */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 mb-4">
                  User-wise Total Payments
                </h3>
                {Object.values(userWisePayments).filter(
                  (user) => user.total > 0
                ).length === 0 ? (
                  <p className="text-gray-500">No payments recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.values(userWisePayments)
                      .filter((user) => user.total > 0)
                      .map((user) => (
                        <li
                          key={user.name}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                        >
                          <span>{user.name}</span>
                          <span className="font-semibold">
                            ₹{user.total.toFixed(2)}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Expense Timeline */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 mb-4">
                  Expense Timeline
                </h3>
                <p className="text-lg font-bold text-gray-800 mb-4">
                  Total Expenses: ₹{totalExpenses.toFixed(2)}
                </p>
                <button
                  onClick={handleDownloadPdf}
                  className="mb-6 px-4 py-2 bg-[#7bbbff] text-white rounded-lg hover:bg-[#5c55e1] transition duration-150 ease-in-out"
                >
                  Download Expense Report
                </button>
                {sortedDates.length === 0 ? (
                  <p className="text-gray-500">
                    No expenses recorded for this trip yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {sortedDates.map((date) => (
                      <div
                        key={date}
                        className="border-b border-gray-200 pb-4 last:border-b-0"
                      >
                        <h4 className="text-lg font-semibold text-gray-700 mb-3">
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h4>
                        <ul className="space-y-3">
                          {groupedExpenses[date].map((expense) => (
                            <li
                              key={expense.id}
                              className="bg-gray-50 p-3 rounded-md flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium text-gray-800">
                                  ₹{expense.amount.toFixed(2)} -{" "}
                                  {expense.description || "No description"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Paid by: {expense.paymentUserName || "N/A"} (
                                  {expense.modeOfPayment})
                                </p>
                                {expense.placeName && (
                                  <p className="text-xs text-gray-500">
                                    Linked to: {expense.placeName}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    expense.paymentTime
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Delete
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        trip={trip}
        paymentUsers={paymentUsers}
        places={places}
        onAddExpenseSubmit={handleAddExpenseSubmit}
      />
      {showHistoryModal && (
        <HistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>
  );
};

export default ExpensesPage;
