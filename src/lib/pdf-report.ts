import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Expense, getStaffStats, getExpensesByCategory, getSalonName } from "./store";

// jsPDF default fonts don't support ₹, so use "Rs." in PDFs
function fmt(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

const TEAL: [number, number, number] = [13, 148, 136];
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_BG: [number, number, number] = [245, 245, 244];
const WHITE: [number, number, number] = [255, 255, 255];

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

function drawBrandedHeader(doc: jsPDF, title: string, subtitle: string) {
  const pw = doc.internal.pageSize.getWidth();
  const name = getSalonName();
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pw, 38, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(name, pw / 2, 16, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, pw / 2, 25, { align: "center" });
  doc.setFontSize(8);
  doc.text(subtitle, pw / 2, 32, { align: "center" });
}

function drawFooter(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    // Thin teal line
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.5);
    doc.line(14, ph - 14, pw - 14, ph - 14);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(getSalonName(), 14, ph - 9);
    doc.text(`Page ${i} of ${pages}`, pw - 14, ph - 9, { align: "right" });
  }
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(title, 14, y);
  // Underline
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.8);
  doc.line(14, y + 1.5, 14 + doc.getTextWidth(title), y + 1.5);
  return y + 8;
}

const headStyle = { fillColor: TEAL, textColor: WHITE, fontStyle: "bold" as const, fontSize: 9 };
const bodyStyle = { fontSize: 9, textColor: DARK, cellPadding: 3 };
const altRowStyle = { fillColor: LIGHT_BG };

// ─── DAILY REPORT (A4, Professional) ─────────────────────────────────────────

export function generateDailyReport(
  date: string,
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

  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  drawBrandedHeader(doc, "Daily Sales Report", dateLabel);

  // Summary cards row
  let y = 48;
  y = sectionTitle(doc, "Summary", y);

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", fmt(totalRevenue)],
      ["Cash Revenue", fmt(cashRevenue)],
      ["Online Revenue", fmt(onlineRevenue)],
      ["Total Expenses", fmt(totalExpenses)],
      ["Net Profit", fmt(profit)],
      ["Total Transactions", String(dayTx.length)],
    ],
    theme: "striped",
    headStyles: headStyle,
    bodyStyles: bodyStyle,
    alternateRowStyles: altRowStyle,
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: pw / 2 + 5 },
    tableWidth: pw / 2 - 19,
  });

  const summaryEndY = (doc as any).lastAutoTable.finalY;

  // Staff performance (right side)
  if (staffStats.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Staff", "Revenue", "Txns"]],
      body: staffStats.map((s) => [
        s.name,
        fmt(s.revenue),
        String(dayTx.filter((t) => t.staffMember === s.name).length),
      ]),
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } },
      margin: { left: pw / 2 + 5, right: 14 },
      tableWidth: pw / 2 - 19,
    });
  }

  y = Math.max(summaryEndY, (doc as any).lastAutoTable?.finalY ?? summaryEndY) + 12;

  // Transaction details
  if (dayTx.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Transaction Details", y);

    autoTable(doc, {
      startY: y,
      head: [["#", "Time", "Staff", "Method", "Amount"]],
      body: dayTx.map((t, i) => [
        String(i + 1),
        t.time,
        t.staffMember,
        t.paymentMethod === "cash" ? "Cash" : "Online",
        fmt(t.amount),
      ]),
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        4: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Expenses
  if (dayExp.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Expenses", y);

    autoTable(doc, {
      startY: y,
      head: [["Category", "Description", "Amount"]],
      body: dayExp.map((e) => [e.category, e.description || "-", fmt(e.amount)]),
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });
  }

  drawFooter(doc);
  doc.save(`FreshSaloon_Daily_${date}.pdf`);
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

  const label = new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  drawBrandedHeader(doc, "Monthly Report", label);

  let y = 48;
  y = sectionTitle(doc, "Financial Summary", y);

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", fmt(totalRevenue)],
      ["Cash Revenue", fmt(cashRevenue)],
      ["Online Revenue", fmt(onlineRevenue)],
      ["Total Expenses", fmt(totalExpenses)],
      ["Net Profit", fmt(profit)],
      ["Total Transactions", String(monthTx.length)],
    ],
    theme: "striped",
    headStyles: headStyle,
    bodyStyles: bodyStyle,
    alternateRowStyles: altRowStyle,
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Staff + Expenses side by side
  if (staffStats.length > 0) {
    y = sectionTitle(doc, "Staff Performance", y);
    autoTable(doc, {
      startY: y,
      head: [["Staff Member", "Revenue", "Transactions"]],
      body: staffStats.map((s) => [
        s.name,
        fmt(s.revenue),
        String(monthTx.filter((t) => t.staffMember === s.name).length),
      ]),
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  if (expenseBreakdown.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Expense Breakdown", y);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount"]],
      body: [
        ...expenseBreakdown.map((e) => [e.category, fmt(e.amount)]),
        [{ content: "TOTAL", styles: { fontStyle: "bold" } }, { content: fmt(totalExpenses), styles: { fontStyle: "bold", halign: "right" as const } }],
      ],
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Transaction details
  if (monthTx.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "All Transactions", y);
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Time", "Staff", "Method", "Amount"]],
      body: monthTx.map((t, i) => [
        String(i + 1),
        t.date,
        t.time,
        t.staffMember,
        t.paymentMethod === "cash" ? "Cash" : "Online",
        fmt(t.amount),
      ]),
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: { ...bodyStyle, fontSize: 8 },
      alternateRowStyles: altRowStyle,
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        5: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });
  }

  drawFooter(doc);
  doc.save(`FreshSaloon_Report_${month}.pdf`);
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

  drawBrandedHeader(doc, "Annual Report", `Financial Year ${year}`);

  let y = 48;
  y = sectionTitle(doc, "Annual Summary", y);

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
    theme: "striped",
    headStyles: headStyle,
    bodyStyles: bodyStyle,
    alternateRowStyles: altRowStyle,
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Monthly breakdown
  y = sectionTitle(doc, "Month-by-Month Breakdown", y);

  const monthlyData: (string | { content: string; styles: Record<string, unknown> })[][] = [];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const prefix = `${year}-${mm}`;
    const mTx = yearTx.filter((t) => t.date.startsWith(prefix));
    const mExp = yearExp.filter((e) => e.date.startsWith(prefix));
    const rev = mTx.reduce((s, t) => s + t.amount, 0);
    const exp = mExp.reduce((s, e) => s + e.amount, 0);
    if (rev > 0 || exp > 0) {
      const monthName = new Date(`${prefix}-01`).toLocaleDateString("en-IN", { month: "long" });
      monthlyData.push([monthName, fmt(rev), fmt(exp), fmt(rev - exp), String(mTx.length)]);
    }
  }

  if (monthlyData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Month", "Revenue", "Expenses", "Profit", "Txns"]],
      body: monthlyData,
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right", fontStyle: "bold" },
        4: { halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("No data available for this year.", 14, y + 4);
    y += 16;
  }

  // Staff
  if (staffStats.length > 0) {
    if (y > 210) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Staff Performance", y);
    autoTable(doc, {
      startY: y,
      head: [["Staff Member", "Revenue", "Transactions"]],
      body: staffStats.map((s) => [
        s.name,
        fmt(s.revenue),
        String(yearTx.filter((t) => t.staffMember === s.name).length),
      ]),
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Expenses
  if (expenseBreakdown.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Expense Breakdown", y);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount"]],
      body: [
        ...expenseBreakdown.map((e) => [e.category, fmt(e.amount)]),
        [{ content: "TOTAL", styles: { fontStyle: "bold" } }, { content: fmt(totalExpenses), styles: { fontStyle: "bold", halign: "right" as const } }],
      ],
      theme: "striped",
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: altRowStyle,
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
  }

  drawFooter(doc);
  doc.save(`FreshSaloon_Annual_${year}.pdf`);
}
