import React, { useState, useEffect } from "react";
import { paymentUsersAPI, expensesAPI } from "./services/api";
import HistoryModal from "./HistoryModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const toLocalISOString = (date) => {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
};

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
    paymentTime: toLocalISOString(new Date()), // YYYY-MM-DDTHH:MM
  });

  useEffect(() => {
    if (isOpen) {
      setExpenseForm({
        amount: "",
        paymentUserId: "",
        description: "",
        modeOfPayment: "UPI",
        placeId: "",
        paymentTime: toLocalISOString(new Date()),
      });
    }
  }, [isOpen]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await onAddExpenseSubmit(expenseForm);
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
              Amount (Rs.)
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
                <option key={user._id} value={user._id}>
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
                <option key={place._id} value={place._id}>
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
      fetchExpenses(trip._id);
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
      console.log("Fetched expenses data:", response.data);
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    if (!trip) {
      alert("Please select a trip before adding a user.");
      return;
    }
    try {
      await paymentUsersAPI.create({ name: newUserName, trip_id: trip._id });
      setNewUserName("");
      fetchPaymentUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      alert(error.response?.data?.error || "Failed to add user");
    }
  };

  const handleDeleteUser = async (userId) => {
    console.log("Attempting to delete user with ID:", userId);
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This will set their associated expenses to NULL."
      )
    )
      return;
    try {
      console.log("Calling paymentUsersAPI.delete for user ID:", userId);
      await paymentUsersAPI.delete(userId);
      console.log("User deleted successfully on backend.");
      fetchPaymentUsers();
      fetchExpenses(trip._id); // Refresh expenses as user might be linked
      console.log("Frontend state refreshed after user deletion.");
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
        tripId: trip._id,
        amount: parseFloat(expenseFormData.amount),
      });
      fetchExpenses(trip._id);
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
      fetchExpenses(trip._id);
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert(error.response?.data?.error || "Failed to delete expense");
    }
  };

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = expense.payment_time
      ? expense.payment_time.slice(0, 10)
      : "N/A";
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
    acc[user._id] = { name: user.name, total: 0 };
    return acc;
  }, {});

  expenses.forEach((expense) => {
    if (expense.paid_by && userWisePayments[expense.paid_by._id]) {
      userWisePayments[expense.paid_by._id].total += expense.amount;
    }
  });

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
      doc.text(`Expense Report for ${trip.destination}`, pageWidth / 2, 15, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255); // White text
      doc.text(
        `Dates: ${new Date(trip.start_date).toLocaleDateString()} - ${new Date(
          trip.end_date
        ).toLocaleDateString()}`,
        leftMargin,
        25
      );
      doc.getFontSize(32);
      doc.text(
        `Total Expenses: Rs.${totalExpenses.toFixed(2)}/-`,
        leftMargin,
        32
      );
      yPos = 55; // Set yPos after header
    };

    // Add header to the first page
    addHeader(1);

    // Payment Timeline
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Black text for content
    doc.text("Payment Timeline", leftMargin, yPos);
    yPos += 10;

    if (sortedDates.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No expenses recorded for this trip yet.", leftMargin, yPos);
      yPos += 10;
    } else {
      sortedDates.forEach((date) => {
        // Check if enough space for date header + at least one row
        if (yPos + 20 > pageHeight - 30) {
          // 20 for date header, 30 for footer
          doc.addPage();
          addHeader(doc.internal.getNumberOfPages());
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(
          new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          leftMargin,
          yPos
        );
        yPos += 7;

        const timelineData = groupedExpenses[date].map((expense) => [
          `Rs.${expense.amount.toFixed(2)}`,
          expense.description || "No description",
          expense.paymentUserName || "N/A",
          expense.modeOfPayment,
          new Date(expense.payment_time).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          }),
          expense.placeName || "N/A",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Amount", "Description", "Paid By", "Mode", "Time", "Place"]],
          body: timelineData,
          theme: "striped",
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: leftMargin, right: rightMargin },
          didDrawPage: (data) => {
            // Only draw header on subsequent pages
            if (data.pageNumber > 1) {
              addHeader(data.pageNumber);
            }
            // Footer
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(150, 150, 150); // Gray color
            doc.text(
              `Generated: ${new Date().toLocaleString()} | Page ${
                data.pageNumber
              } of ${doc.internal.getNumberOfPages()}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: "center" }
            );
          },
        });

        yPos = doc.lastAutoTable.finalY + 10;
      });
    }

    // User-wise Payment Report
    // Check if enough space for section title + table
    if (yPos + 30 > pageHeight - 30) {
      // 30 for title, 30 for footer
      doc.addPage();
      addHeader(doc.internal.getNumberOfPages());
    }

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Black text for content
    doc.text("User-wise Payment Report", leftMargin, yPos);
    yPos += 10;

    const usersWithPayments = Object.values(userWisePayments).filter(
      (user) => user.total > 0
    );

    if (usersWithPayments.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No user payments recorded yet.", leftMargin, yPos);
    } else {
      const finalBody = usersWithPayments.map((user) => [
        user.name,
        user.total.toFixed(2),
      ]);
      finalBody.push(["Overall Total", totalExpenses.toFixed(2)]);

      autoTable(doc, {
        startY: yPos,
        head: [["Payer Name", "Total Amount (Rs.)"]],
        body: finalBody,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: leftMargin, right: rightMargin },
        didDrawPage: (data) => {
          // Only draw header on subsequent pages
          if (data.pageNumber > 1) {
            addHeader(data.pageNumber);
          }
          // Footer
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(150, 150, 150); // Gray color
          doc.text(
            `Generated: ${new Date().toLocaleString()} | Page ${
              data.pageNumber
            } of ${doc.internal.getNumberOfPages()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        },
      });
    }

    doc.save(`Expense_Report_${trip.destination}.pdf`);
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
            Please select a trip from Home page to track expenses for.
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
                          key={user._id}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                        >
                          <span>{user.name}</span>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
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
                            Rs.{user.total.toFixed(2)}
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
                  Total Expenses: Rs.{totalExpenses.toFixed(2)}
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
                              key={expense._id}
                              className="bg-gray-50 p-3 rounded-md flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium text-gray-800">
                                  Rs.{expense.amount.toFixed(2)} -{" "}
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
                                  {expense.payment_time
                                    ? new Date(
                                        expense.payment_time
                                      ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "N/A"}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
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
