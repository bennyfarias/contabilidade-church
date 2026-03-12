# 💰 Financial Management SaaS for Non-Profits

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=flat&logo=firebase)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

> A robust, real-time financial management platform designed for churches and non-profit organizations. It features budget planning, expense tracking, receipt management, and legal-grade PDF reporting.

---

## 📸 Screenshots

| Dashboard Overview | Financial Reports |
|:------------------:|:-----------------:|
| ![Dashboard](https://placehold.co/600x400?text=Dashboard+Screenshot) | ![Reports](https://placehold.co/600x400?text=Reports+Screenshot) |

---

## 🚀 Key Features

* **Real-time Dashboard:** Instant visualization of cash flow, balances, and financial health using **Firebase Firestore** listeners.
* **Transaction Management:** Full CRUD system for revenues and expenses with category mapping.
* **🧾 Digital Receipt Storage:** Integrated with **Cloudinary** for optimized, secure, and cost-effective image storage (receipts/invoices) linked to transactions.
* **Budget Planning:** Compare "Budgeted vs. Realized" values in real-time to track financial goals.
* **📄 Legal PDF Generation:** Generates official "Cash Book" (Livro Caixa) reports using `html2pdf.js`, automatically appending attached receipts at the end of the document for auditing purposes.
* **Authentication:** Secure login system using Firebase Auth.
* **Responsive Design:** Fully responsive UI built with **Tailwind CSS**, accessible on desktop and mobile.

---

## 🛠️ Tech Stack & Architecture

This project was built using a **Service-Oriented Architecture** on the frontend to ensure scalability and maintainability.

### Core Stack
* **Frontend:** React 18, TypeScript, Vite (or CRA).
* **Styling:** Tailwind CSS, Lucide React (Icons).
* **State Management:** React Context API (Global State) + Custom Hooks (Business Logic).
* **Backend / Database:** Firebase Authentication, Firestore (NoSQL).
* **Object Storage:** Cloudinary (Unsigned Uploads).
* **Utilities:** Recharts (Data Viz), date-fns (Time manipulation), html2pdf.js.

### Architectural Decisions
1.  **Service Layer Pattern:**
    * I decoupled the UI from the database logic. Components do not call Firebase directly; they call `TransactionService` or `BudgetService`.
    * *Benefit:* Makes it easier to swap the backend in the future or write unit tests.
2.  **Custom Hooks for Business Logic:**
    * Complex calculations (e.g., balances, budget variances) are isolated in hooks like `useCalculations` and `useCashBook`.
    * *Benefit:* Cleaner UI components and reusable logic.
3.  **Context API for Real-time Data:**
    * Implemented a `FirebaseDataContext` to listen to Firestore changes and broadcast updates to the entire app instantly without prop drilling.

---

## 💡 Challenges & Solutions

### 1. PDF Generation with External Images (CORS)
**Challenge:** Generating a PDF client-side that includes images hosted on Cloudinary resulted in blank spaces due to Cross-Origin Resource Sharing (CORS) security policies.
**Solution:**
* Configured the `html2canvas` options within the PDF generator to use `useCORS: true`.
* Added the `crossOrigin="anonymous"` attribute to image tags.
* Ensured Cloudinary delivery settings allowed cross-origin fetching.

### 2. Timezone Consistency
**Challenge:** Users in different timezones (e.g., UTC-4) experienced dates shifting to the previous day when saving transactions.
**Solution:**
* Implemented a normalization strategy in the `TransactionService`, ensuring all dates are stored and retrieved with a fixed time reference (T12:00:00), guaranteeing consistency regardless of the user's local machine time.

---

## 🏁 Getting Started

To run this project locally, follow these steps:

### Prerequisites
* Node.js (v16 or higher)
* npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/church-finance-saas.git](https://github.com/your-username/church-finance-saas.git)
    cd church-finance-saas
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory and add your Firebase and Cloudinary credentials:
    ```env
    REACT_APP_FIREBASE_API_KEY=your_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    REACT_APP_FIREBASE_PROJECT_ID=your_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    REACT_APP_FIREBASE_APP_ID=your_app_id
    
    # Cloudinary Config is handled in the Service Layer, 
    # but strictly secure keys should be here.
    ```

4.  **Run the application**
    ```bash
    npm start
    ```

---

## 🔮 Future Improvements (Roadmap)

* [ ] **Multi-tenancy:** Refactor Firestore structure to support multiple organizations (SaaS model).
* [ ] **Unit Testing:** Implement Jest/Vitest for the `useCalculations` hook.
* [ ] **i18n:** Add support for multiple languages (English/Portuguese) using `react-i18next`.
* [ ] **Dark Mode:** Leverage Tailwind's dark mode capabilities.

---

## 🤝 Contact

**Your Name** *Full Stack Developer* [LinkedIn](https://linkedin.com/in/seu-linkedin) | [Portfolio](https://seu-portfolio.com)

---
