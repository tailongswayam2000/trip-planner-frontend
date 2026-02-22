import React, { useState, useEffect } from 'react';
import { settlementsAPI } from './services/api';

const SettlementReport = ({ trip }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (trip) {
            fetchSettlements();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trip]);

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const res = await settlementsAPI.calculate(trip._id);
            setData(res.data);
        } catch (error) {
            console.error("Error fetching settlements:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settlement data...</div>;
    if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

    const { settlements, settlingBalances, individualBalances, totalAmount } = data;

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-100">
                    <h4 className="text-gray-500 text-sm font-semibold uppercase">Total Trip Cost</h4>
                    <div className="text-3xl font-bold text-blue-700 mt-2">₹{totalAmount?.toLocaleString() || 0}</div>
                </div>
                {/* Could add more stats here */}
            </div>

            {/* 1. Who Pays Whom (Settlements) */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
                    <span className="bg-green-100 text-green-600 p-2 rounded-full mr-3">💰</span>
                    Settlements (Who Pays Whom)
                </h3>

                {settlements.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 italic">Example: "All settled up!" or "No expenses yet."</div>
                ) : (
                    <div className="space-y-4">
                        {settlements.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg text-gray-800">{s.from.name}</span>
                                    <span className="text-gray-400">➡️</span>
                                    <span className="font-bold text-lg text-gray-800">{s.to.name}</span>
                                </div>
                                <div className="font-bold text-xl text-green-700">
                                    ₹{s.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Balances (Net) */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
                    <span className="bg-indigo-100 text-indigo-600 p-2 rounded-full mr-3">⚖️</span>
                    Net Balances
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                <th className="py-3 px-4">Entity</th>
                                <th className="py-3 px-4 text-right">Net Balance</th>
                                <th className="py-3 px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.values(settlingBalances || {}).map(entity => {
                                const isPositive = entity.netBalance > 0;
                                const isZero = Math.abs(entity.netBalance) < 0.01;
                                return (
                                    <tr key={entity.id} className="hover:bg-gray-50 transition">
                                        <td className="py-3 px-4 font-medium text-gray-800">
                                            {entity.name}
                                            {entity.members && entity.members.length > 0 && (
                                                <span className="text-xs text-gray-400 block font-normal">
                                                    Includes: {entity.members.map(m => m.name).join(', ')}
                                                </span>
                                            )}
                                        </td>
                                        <td className={`py-3 px-4 text-right font-bold ${isPositive ? 'text-green-600' : isZero ? 'text-gray-400' : 'text-red-500'}`}>
                                            {isPositive ? '+' : ''}₹{Math.round(entity.netBalance).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`text-xs px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' :
                                                    isZero ? 'bg-gray-100 text-gray-600' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {isPositive ? 'Gets Back' : isZero ? 'Settled' : 'Owes'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Detailed Breakdown (Collapsible maybe? Showing flattened list for now) */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-bold text-gray-600 mb-4">Detailed Breakdown (Individuals)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-100">
                                <th className="px-4 py-2 text-left">Person</th>
                                <th className="px-4 py-2 text-right">Paid</th>
                                <th className="px-4 py-2 text-right">Share Cost</th>
                                <th className="px-4 py-2 text-right">Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(individualBalances || {}).map(p => (
                                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{p.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">{p.totalPaid > 0 ? `₹${p.totalPaid.toLocaleString()}` : '-'}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">{p.totalOwed > 0 ? `₹${Math.round(p.totalOwed).toLocaleString()}` : '-'}</td>
                                    <td className={`px-4 py-2 text-right font-bold ${p.netBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {p.netBalance > 0 ? '+' : ''}{Math.round(p.netBalance).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SettlementReport;
