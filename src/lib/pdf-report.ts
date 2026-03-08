import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Expense, getStaffStats, getExpensesByCategory } from "./store";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function generateMonthlyReport(
  month: string, // "YYYY-MM"
  transactions: Transaction[],
  expenses: Expense[]
) {
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const monthExp = expenses.filter((e) => e.date.startsWith(month));

  const totalRevenue = monthTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthExp.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const cashRevenue = monthTx.filter((t) => t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0);
  const onlineRevenue = totalRevenue - cashRevenue;

  const staffStats = getStaffStats(monthTx);
  const expenseBreakdown = getExpensesByCategory(monthExp);

  const label = new Date(month + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(45, 38, 35);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("GlamBook", 14, 18);
  doc.setFontSize(11);
  doc.text(`Monthly Report — ${label}`, 14, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 35);

  // Summary section
  let y = 52;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(14);
  doc.text("Summary", 14, y);
  y += 8;

  doc.setFontSize(10);
  const summaryData = [
    ["Total Revenue", fmt(totalRevenue)],
    ["Cash Revenue", fmt(cashRevenue)],
    ["Online Revenue", fmt(onlineRevenue)],
    ["Total Expenses", fmt(totalExpenses)],
    ["Net Profit", fmt(profit)],
    ["Transactions", String(monthTx.length)],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [180, 100, 110], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  // Staff Performance
  y = (doc as any).lastAutoTable.finalY + 14;
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Staff Performance", 14, y);
  y += 6;

  if (staffStats.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Staff Member", "Revenue", "Transactions"]],
      body: staffStats.map((s) => [
        s.name,
        fmt(s.revenue),
        String(monthTx.filter((t) => t.staffMember === s.name).length),
      ]),
      theme: "grid",
      headStyles: { fillColor: [180, 100, 110], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  } else {
    y += 6;
    doc.setFontSize(10);
    doc.text("No staff data for this period.", 14, y);
    y += 14;
  }

  // Expense Breakdown
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Expense Breakdown", 14, y);
  y += 6;

  if (expenseBreakdown.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount"]],
      body: expenseBreakdown.map((e) => [e.category, fmt(e.amount)]),
      theme: "grid",
      headStyles: { fillColor: [180, 100, 110], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  } else {
    y += 6;
    doc.setFontSize(10);
    doc.text("No expenses for this period.", 14, y);
    y += 14;
  }

  // Transaction detail table
  if (monthTx.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text("Transaction Details", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Client", "Service", "Staff", "Amount", "Method"]],
      body: monthTx.map((t) => [
        t.date,
        t.clientName,
        t.serviceType,
        t.staffMember,
        fmt(t.amount),
        t.paymentMethod,
      ]),
      theme: "grid",
      headStyles: { fillColor: [180, 100, 110], textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} — GlamBook Salon Management`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`GlamBook_Report_${month}.pdf`);
}
