import * as XLSX from "xlsx";
import { Transaction, Expense, getStaffStats, getExpensesByCategory, getSalonName } from "./store";

function filterByPeriod<T extends { date: string }>(items: T[], period: string): T[] {
  return items.filter((i) => i.date.startsWith(period));
}

function buildWorkbook(
  periodLabel: string,
  fileLabel: string,
  transactions: Transaction[],
  expenses: Expense[]
) {
  const wb = XLSX.utils.book_new();

  const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
  const cashRevenue = transactions.filter((t) => t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0);
  const onlineRevenue = totalRevenue - cashRevenue;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  // Summary
  const summary = [
    [getSalonName()],
    [`${fileLabel} Report`],
    [`Period: ${periodLabel}`],
    [],
    ["Metric", "Amount (INR)"],
    ["Total Revenue", totalRevenue],
    ["Cash Revenue", cashRevenue],
    ["Online Revenue", onlineRevenue],
    ["Total Expenses", totalExpenses],
    ["Net Profit", profit],
    ["Transactions", transactions.length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Transactions
  const txRows = transactions.map((t) => ({
    Date: t.date,
    Time: t.time,
    Client: t.clientName,
    Service: t.serviceType,
    Staff: t.staffMember,
    Method: t.paymentMethod,
    "Amount (INR)": t.amount,
  }));
  const wsTx = XLSX.utils.json_to_sheet(
    txRows.length ? txRows : [{ Date: "", Time: "", Client: "", Service: "", Staff: "", Method: "", "Amount (INR)": "" }]
  );
  wsTx["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsTx, "Transactions");

  // Expenses
  const expRows = expenses.map((e) => ({
    Date: e.date,
    Category: e.category,
    Description: e.description,
    "Amount (INR)": e.amount,
  }));
  const wsExp = XLSX.utils.json_to_sheet(
    expRows.length ? expRows : [{ Date: "", Category: "", Description: "", "Amount (INR)": "" }]
  );
  wsExp["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsExp, "Expenses");

  // Staff performance
  const staffStats = getStaffStats(transactions);
  const wsStaff = XLSX.utils.json_to_sheet(
    staffStats.length
      ? staffStats.map((s) => ({
          Staff: s.name,
          "Revenue (INR)": s.revenue,
          Transactions: transactions.filter((t) => t.staffMember === s.name).length,
        }))
      : [{ Staff: "", "Revenue (INR)": "", Transactions: "" }]
  );
  wsStaff["!cols"] = [{ wch: 18 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsStaff, "Staff");

  // Expense breakdown
  const expBreakdown = getExpensesByCategory(expenses);
  const wsBreak = XLSX.utils.json_to_sheet(
    expBreakdown.length
      ? expBreakdown.map((e) => ({ Category: e.category, "Amount (INR)": e.amount }))
      : [{ Category: "", "Amount (INR)": "" }]
  );
  wsBreak["!cols"] = [{ wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsBreak, "Expense Breakdown");

  return wb;
}

function save(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

export function generateDailyExcel(date: string, transactions: Transaction[], expenses: Expense[]) {
  const tx = transactions.filter((t) => t.date === date);
  const exp = expenses.filter((e) => e.date === date);
  const label = new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const wb = buildWorkbook(label, "Daily", tx, exp);
  save(wb, `${getSalonName().replace(/\s+/g, "_")}_Daily_${date}.xlsx`);
}

export function generateMonthlyExcel(month: string, transactions: Transaction[], expenses: Expense[]) {
  const tx = filterByPeriod(transactions, month);
  const exp = filterByPeriod(expenses, month);
  const label = new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const wb = buildWorkbook(label, "Monthly", tx, exp);
  save(wb, `${getSalonName().replace(/\s+/g, "_")}_Monthly_${month}.xlsx`);
}

export function generateAnnualExcel(year: string, transactions: Transaction[], expenses: Expense[]) {
  const tx = filterByPeriod(transactions, year);
  const exp = filterByPeriod(expenses, year);
  const wb = buildWorkbook(year, "Annual", tx, exp);
  save(wb, `${getSalonName().replace(/\s+/g, "_")}_Annual_${year}.xlsx`);
}