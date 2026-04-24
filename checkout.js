// Mock Data
const mockData = {
  user: {
    userId: "user-001",
    userName: "Nguyễn Văn A",
  },
  course: {
    courseId: "course-123",
    courseName: "Toán học lớp 10 - Kỳ 1",
    classCode: "MATH-2025-01",
    instructorName: "Thầy Trần Văn B",
    startDate: "05/05/2025",
    endDate: "31/08/2025",
    totalSessions: 24,
    priceMonthly: 2000000,
    priceFullCourse: 5000000,
  },
  promoCodes: {
    SAVE10: {
      code: "SAVE10",
      type: "PERCENTAGE",
      value: 10,
      description: "Giảm 10%",
    },
    FLAT50K: {
      code: "FLAT50K",
      type: "FIXED",
      value: 50000,
      description: "Giảm 50,000đ",
    },
  },
  refunds: [
    {
      sessionNumber: 5,
      date: "15/04/2025",
      reason: "Trung tâm hủy",
    },
    {
      sessionNumber: 12,
      date: "20/04/2025",
      reason: "Trung tâm hủy",
    },
  ],
  dueDate: "12/05/2025",
};

// State
const state = {
  paymentType: "FULL_COURSE",
  selectedMonths: 2,
  appliedPromoCode: null,
  baseAmount: 0,
  discountAmount: 0,
  refundAmount: 0,
  finalAmount: 0,
  paymentMethod: "bank_transfer",
  termsAgreed: false,
};

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  initializePage();
  setupEventListeners();
  calculateInvoice();
});

function initializePage() {
  // Load user info
  document.getElementById("userName").textContent = mockData.user.userName;

  // Load course info
  document.getElementById("courseName").textContent =
    mockData.course.courseName;
  document.getElementById("classCode").textContent = mockData.course.classCode;
  document.getElementById("instructorName").textContent =
    mockData.course.instructorName;
  document.getElementById("duration").textContent =
    `${mockData.course.startDate} - ${mockData.course.endDate}`;
  document.getElementById("totalSessions").textContent =
    `${mockData.course.totalSessions} buổi`;

  // Load due date
  document.getElementById("dueDate").textContent = mockData.dueDate;
  calculateDaysLeft();

  // Display refunds
  if (mockData.refunds.length > 0) {
    displayRefunds();
  }
}

function setupEventListeners() {
  // Payment Type Selection
  document.querySelectorAll('input[name="paymentType"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      state.paymentType = this.value;

      // Update active class
      document.querySelectorAll(".package-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      this.closest(".package-option").classList.add("active");

      // Show/hide months section
      const monthsSection = document.getElementById("monthsSection");
      monthsSection.style.display = this.value === "MONTHLY" ? "block" : "none";

      calculateInvoice();
    });
  });

  // Month Selection
  document.querySelectorAll(".month-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const months = parseInt(this.dataset.months);
      state.selectedMonths = months;

      // Update active class
      document
        .querySelectorAll(".month-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      calculateInvoice();
    });
  });

  // Discount Code
  document
    .getElementById("applyDiscountBtn")
    .addEventListener("click", applyDiscountCode);
  document
    .getElementById("discountCode")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyDiscountCode();
      }
    });

  // Payment Method
  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      state.paymentMethod = this.value;
    });
  });

  // Terms
  document
    .getElementById("termsCheckbox")
    .addEventListener("change", function () {
      state.termsAgreed = this.checked;
      document.getElementById("termsError").style.display = "none";
    });

  // Buttons
  document.getElementById("cancelBtn").addEventListener("click", handleCancel);
  document.getElementById("submitBtn").addEventListener("click", handleSubmit);
}

function calculateInvoice() {
  // Calculate base amount
  if (state.paymentType === "MONTHLY") {
    state.baseAmount = mockData.course.priceMonthly * state.selectedMonths;

    const calcText = `${formatCurrency(mockData.course.priceMonthly)} × ${state.selectedMonths} tháng`;
    document.querySelector(".calculation-text").textContent = calcText;
    document.getElementById("baseCalculation").style.display = "block";
  } else {
    state.baseAmount = mockData.course.priceFullCourse;
    document.getElementById("baseCalculation").style.display = "none";
  }

  // Calculate discount
  if (state.appliedPromoCode) {
    const promo = mockData.promoCodes[state.appliedPromoCode];
    if (promo.type === "PERCENTAGE") {
      state.discountAmount = state.baseAmount * (promo.value / 100);
    } else if (promo.type === "FIXED") {
      state.discountAmount = promo.value;
    }
  } else {
    state.discountAmount = 0;
  }

  // Calculate refund
  if (mockData.refunds.length > 0) {
    const refundPerSession = state.baseAmount / mockData.course.totalSessions;
    state.refundAmount = refundPerSession * mockData.refunds.length;
  } else {
    state.refundAmount = 0;
  }

  // Calculate final (cannot be negative)
  const subtotal = state.baseAmount - state.discountAmount;
  state.finalAmount = Math.max(subtotal - state.refundAmount, 0);

  updatePriceDisplay();
}

function updatePriceDisplay() {
  // Base amount
  document.getElementById("baseAmount").textContent = formatCurrency(
    state.baseAmount,
  );

  // Discount
  const discountRow = document.getElementById("discountRow");
  if (state.discountAmount > 0) {
    discountRow.classList.add("show");
    document.getElementById("discountAmount").textContent =
      `-${formatCurrency(state.discountAmount)}`;
  } else {
    discountRow.classList.remove("show");
  }

  // Refund
  if (state.refundAmount > 0) {
    document.getElementById("refundAmount").textContent =
      `-${formatCurrency(state.refundAmount)}`;
  }

  // Final total
  document.getElementById("totalAmount").textContent = formatCurrency(
    state.finalAmount,
  );

  // Special message if zero
  if (state.finalAmount === 0 && state.baseAmount > 0) {
    showMessage(
      "Số tiền hoàn vượt quá học phí. Không cần thanh toán!",
      "success",
    );
  }
}

function applyDiscountCode() {
  const input = document.getElementById("discountCode");
  const code = input.value.trim().toUpperCase();

  // Clear previous messages
  document.getElementById("discountMessage").className = "promo-message";
  input.classList.remove("error");

  // Validation
  if (!code) {
    showMessage("Vui lòng nhập mã khuyến mãi", "error");
    input.classList.add("error");
    return;
  }

  if (state.baseAmount === 0) {
    showMessage("Vui lòng chọn loại gói thanh toán trước", "error");
    input.classList.add("error");
    return;
  }

  // Check code
  const promo = mockData.promoCodes[code];

  if (!promo) {
    showMessage("❌ Mã không hợp lệ hoặc đã hết hạn", "error");
    input.classList.add("error");
    state.appliedPromoCode = null;
  } else {
    showMessage(
      `✓ Mã ${code} đã được áp dụng (${promo.description})`,
      "success",
    );
    state.appliedPromoCode = code;
  }

  calculateInvoice();
}

function showMessage(message, type) {
  const messageEl = document.getElementById("discountMessage");
  messageEl.textContent = message;
  messageEl.className = `promo-message ${type}`;
}

function displayRefunds() {
  const refundSection = document.getElementById("refundSection");
  const refundDetails = document.getElementById("refundDetails");

  refundSection.style.display = "block";

  const refundText = mockData.refunds
    .map((r) => `Buổi ${r.sessionNumber} (${r.date})`)
    .join(", ");

  refundDetails.textContent = refundText;
}

function calculateDaysLeft() {
  const dueDateStr = mockData.dueDate;
  const [day, month, year] = dueDateStr.split("/");
  const dueDate = new Date(year, month - 1, day);
  const today = new Date();

  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const countdownEl = document.getElementById("countdown");

  if (diffDays < 0) {
    countdownEl.innerHTML = `<span style="color: var(--error);">(Quá hạn ${Math.abs(diffDays)} ngày)</span>`;
  } else if (diffDays < 3) {
    countdownEl.innerHTML = `<span style="color: var(--error); font-weight: 700;">(Còn ${diffDays} ngày)</span>`;
  } else {
    countdownEl.textContent = `(Còn ${diffDays} ngày)`;
  }
}

function handleCancel() {
  if (confirm("Bạn có chắc muốn hủy thanh toán?")) {
    window.location.href = "/";
  }
}

function handleSubmit() {
  // Validation
  if (!validateForm()) {
    return;
  }

  // Show loading
  showLoading(true);

  // Disable button
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;

  // Simulate payment processing
  setTimeout(() => {
    processPayment();
  }, 2000);
}

function validateForm() {
  const errors = [];

  // Check terms
  if (!state.termsAgreed) {
    errors.push("terms");
    document.getElementById("termsError").style.display = "block";

    // Scroll to error
    document.getElementById("termsCheckbox").scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  // Check payment method
  if (!state.paymentMethod) {
    errors.push("paymentMethod");
    alert("Vui lòng chọn phương thức thanh toán");
  }

  // Check amount
  if (state.baseAmount === 0) {
    errors.push("amount");
    alert("Vui lòng chọn gói thanh toán");
  }

  return errors.length === 0;
}

function processPayment() {
  const invoiceData = {
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    userId: mockData.user.userId,
    userName: mockData.user.userName,
    courseId: mockData.course.courseId,
    courseName: mockData.course.courseName,
    classCode: mockData.course.classCode,
    paymentType: state.paymentType,
    selectedMonths: state.selectedMonths,
    baseAmount: state.baseAmount,
    promoCode: state.appliedPromoCode,
    discountAmount: state.discountAmount,
    refundAmount: state.refundAmount,
    finalAmount: state.finalAmount,
    paymentMethod: state.paymentMethod,
    paymentDate: new Date().toISOString(),
    status: "completed",
  };

  console.log("✅ Payment Successful!");
  console.log("Invoice Data:", invoiceData);
  console.log("JSON:", JSON.stringify(invoiceData, null, 2));

  // Hide loading
  showLoading(false);

  // Show success modal
  showSuccessModal(invoiceData);
}

function showSuccessModal(invoiceData) {
  const modal = document.getElementById("successModal");

  document.getElementById("successInvoiceNumber").textContent =
    invoiceData.invoiceNumber;
  document.getElementById("successAmount").textContent = formatCurrency(
    invoiceData.finalAmount,
  );
  document.getElementById("successDate").textContent =
    new Date().toLocaleDateString("vi-VN");

  modal.classList.add("show");
}

function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (show) {
    overlay.classList.add("show");
  } else {
    overlay.classList.remove("show");
  }
}

function formatCurrency(amount) {
  return (
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
    }).format(amount) + " đ"
  );
}

// Data retrieval functions
function getInvoiceData() {
  return {
    user: mockData.user,
    course: mockData.course,
    paymentType: state.paymentType,
    selectedMonths: state.selectedMonths,
    baseAmount: state.baseAmount,
    appliedPromoCode: state.appliedPromoCode,
    discountAmount: state.discountAmount,
    refundAmount: state.refundAmount,
    finalAmount: state.finalAmount,
    paymentMethod: state.paymentMethod,
    refunds: mockData.refunds,
  };
}

function exportInvoiceJSON() {
  const data = getInvoiceData();
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log("Invoice exported!");
}

// Expose to global
window.getInvoiceData = getInvoiceData;
window.exportInvoiceJSON = exportInvoiceJSON;
window.mockData = mockData;
window.state = state;

// Console info
console.log(
  "%c🎓 GENX PK STORY - Checkout",
  "color: #667eea; font-size: 20px; font-weight: bold;",
);
console.log("%c💡 Available functions:", "color: #764ba2; font-weight: bold;");
console.log("  getInvoiceData()     - Get current data");
console.log("  exportInvoiceJSON()  - Download JSON");
console.log("  mockData            - View mock data");
console.log("  state               - View current state");
console.log("\n%c🎁 Test promo codes:", "color: #10b981; font-weight: bold;");
console.log("  SAVE10   → Giảm 10%");
console.log("  FLAT50K  → Giảm 50,000đ");
