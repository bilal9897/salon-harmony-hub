import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Expense, getStaffStats, getExpensesByCategory } from "./store";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const BRAND_COLOR: [number, number, number] = [13, 148, 136]; // teal
const DARK_BG: [number, number, number] = [45, 38, 35];

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("GlamBook", 14, 18);
  doc.setFontSize(11);
  doc.text(title, 14, 28);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 35);
}

function addFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
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
}

const tableHead: [number, number, number] = BRAND_COLOR;

// ─── DAILY REPORT WITH RECEIPT ───────────────────────────────────────────────

export function generateDailyReport(
  date: string, // "YYYY-MM-DD"
  transactions: Transaction[],
  expenses: Expense[]
) {
  const dayTx = transactions.filter((t) => t.date === date);
  const dayExp = expenses.filter((e) => e.date === date);

  const totalRevenue = dayTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = dayExp.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const cashRevenue = dayTx.filter((t) => t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0);
  const onlineRevenue = totalRevenue - cashRevenue;
  const staffStats = getStaffStats(dayTx);

  const dateLabel = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Receipt-style: 80mm width ≈ 226 points
  const receiptWidth = 80;
  const doc = new jsPDF({ unit: "mm", format: [receiptWidth, 297] });
  const pw = receiptWidth;
  const margin = 6;
  const contentWidth = pw - margin * 2;

  // Header
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pw, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("GlamBook", pw / 2, 10, { align: "center" });
  doc.setFontSize(7);
  doc.text("Daily Sales Receipt", pw / 2, 15, { align: "center" });
  doc.text(dateLabel, pw / 2, 19, { align: "center" });

  let y = 27;

  // Dashed line
  const drawDash = () => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, pw - margin, y);
    y += 4;
  };

  drawDash();

  // Summary
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  const summaryRows = [
    ["Total Revenue", fmt(totalRevenue)],
    ["Cash", fmt(cashRevenue)],
    ["Online", fmt(onlineRevenue)],
    ["Expenses", fmt(totalExpenses)],
    ["Net Profit", fmt(profit)],
    ["Transactions", String(dayTx.length)],
  ];

  summaryRows.forEach(([label, value]) => {
    doc.setFont("helvetica", label === "Net Profit" ? "bold" : "normal");
    doc.text(label, margin, y);
    doc.text(value, pw - margin, y, { align: "right" });
    y += 5;
  });

  y += 1;
  drawDash();

  // Staff breakdown
  if (staffStats.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Staff Breakdown", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    staffStats.forEach((s) => {
      const count = dayTx.filter((t) => t.staffMember === s.name).length;
      doc.text(s.name, margin, y);
      doc.text(`${fmt(s.revenue)} (${count})`, pw - margin, y, { align: "right" });
      y += 5;
    });
    y += 1;
    drawDash();
  }

  // Transaction list
  if (dayTx.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Transactions", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    dayTx.forEach((t, i) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`#${i + 1}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(t.time, margin + 8, y);
      doc.text(t.staffMember, margin + 22, y);
      doc.text(t.paymentMethod === "cash" ? "Cash" : "Online", margin + 42, y);
      doc.text(fmt(t.amount), pw - margin, y, { align: "right" });
      y += 4.5;
    });

    y += 1;
    drawDash();
  }

  // Expenses
  if (dayExp.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Expenses", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    dayExp.forEach((e) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
      doc.text(e.category, margin, y);
      doc.text(e.description || "—", margin + 22, y);
      doc.text(fmt(e.amount), pw - margin, y, { align: "right" });
      y += 4.5;
    });

    y += 1;
    drawDash();
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text("Thank you — GlamBook", pw / 2, y + 2, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pw / 2, y + 6, { align: "center" });

  doc.save(`GlamBook_Daily_${date}.pdf`);
}

// ─── MONTHLY REPORT ──────────────────────────────────────────────────────────

export function generateMonthlyReport(
  month: string,
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

  addHeader(doc, `Monthly Report — ${label}`, `Generated: ${new Date().toLocaleDateString("en-IN")}`);

  let y = 52;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(14);
  doc.text("Summary", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", fmt(totalRevenue)],
      ["Cash Revenue", fmt(cashRevenue)],
      ["Online Revenue", fmt(onlineRevenue)],
      ["Total Expenses", fmt(totalExpenses)],
      ["Net Profit", fmt(profit)],
      ["Transactions", String(monthTx.length)],
    ],
    theme: "grid",
    headStyles: { fillColor: tableHead, textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

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
      headStyles: { fillColor: tableHead, textColor: 255 },
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

  if (y > 240) { doc.addPage(); y = 20; }
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
      headStyles: { fillColor: tableHead, textColor: 255 },
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

  if (monthTx.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text("Transaction Details", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Time", "Staff", "Amount", "Method"]],
      body: monthTx.map((t) => [t.date, t.time, t.staffMember, fmt(t.amount), t.paymentMethod]),
      theme: "grid",
      headStyles: { fillColor: tableHead, textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  doc.save(`GlamBook_Report_${month}.pdf`);
}

// ─── ANNUAL REPORT ───────────────────────────────────────────────────────────

export function generateAnnualReport(
  year: string,
  transactions: Transaction[],
  expenses: Expense[]
) {
  const yearTx = transactions.filter((t) => t.date.startsWith(year));
  const yearExp = expenses.filter((e) => e.date.startsWith(year));

  const totalRevenue = yearTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = yearExp.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const cashRevenue = yearTx.filter((t) => t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0);
  const onlineRevenue = totalRevenue - cashRevenue;

  const staffStats = getStaffStats(yearTx);
  const expenseBreakdown = getExpensesByCategory(yearExp);

  const doc = new jsPDF();

  addHeader(doc, `Annual Report — ${year}`, `Generated: ${new Date().toLocaleDateString("en-IN")}`);

  let y = 52;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(14);
  doc.text("Annual Summary", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", fmt(totalRevenue)],
      ["Cash Revenue", fmt(cashRevenue)],
      ["Online Revenue", fmt(onlineRevenue)],
      ["Total Expenses", fmt(totalExpenses)],
      ["Net Profit", fmt(profit)],
      ["Total Transactions", String(yearTx.length)],
    ],
    theme: "grid",
    headStyles: { fillColor: tableHead, textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  // Monthly breakdown
  y = (doc as any).lastAutoTable.finalY + 14;
  doc.setFontSize(14);
  doc.text("Monthly Breakdown", 14, y);
  y += 6;

  const monthlyData: string[][] = [];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const prefix = `${year}-${mm}`;
    const mTx = yearTx.filter((t) => t.date.startsWith(prefix));
    const mExp = yearExp.filter((e) => e.date.startsWith(prefix));
    const rev = mTx.reduce((s, t) => s + t.amount, 0);
    const exp = mExp.reduce((s, e) => s + e.amount, 0);
    if (rev > 0 || exp > 0) {
      const monthName = new Date(`${prefix}-01`).toLocaleDateString("en-IN", { month: "short" });
      monthlyData.push([monthName, fmt(rev), fmt(exp), fmt(rev - exp), String(mTx.length)]);
    }
  }

  if (monthlyData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Month", "Revenue", "Expenses", "Profit", "Txns"]],
      body: monthlyData,
      theme: "grid",
      headStyles: { fillColor: tableHead, textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  } else {
    y += 6;
    doc.setFontSize(10);
    doc.text("No monthly data available.", 14, y);
    y += 14;
  }

  // Staff Performance
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.text("Staff Performance", 14, y);
  y += 6;

  if (staffStats.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Staff Member", "Revenue", "Transactions"]],
      body: staffStats.map((s) => [
        s.name,
        fmt(s.revenue),
        String(yearTx.filter((t) => t.staffMember === s.name).length),
      ]),
      theme: "grid",
      headStyles: { fillColor: tableHead, textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  } else {
    y += 6;
    doc.setFontSize(10);
    doc.text("No staff data.", 14, y);
    y += 14;
  }

  // Expense Breakdown
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.text("Expense Breakdown", 14, y);
  y += 6;

  if (expenseBreakdown.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount"]],
      body: expenseBreakdown.map((e) => [e.category, fmt(e.amount)]),
      theme: "grid",
      headStyles: { fillColor: tableHead, textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
  } else {
    y += 6;
    doc.setFontSize(10);
    doc.text("No expenses recorded.", 14, y);
  }

  addFooter(doc);
  doc.save(`GlamBook_Annual_${year}.pdf`);
}
