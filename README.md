<div align="center">

#  BookStop - Online Bookstore Management System

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=8B4513&center=true&vCenter=true&width=600&lines=Welcome+to+BookStop!;Your+Digital+Bookstore;Built+with+Love+%26+Code" alt="Typing SVG" />

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">

</div>

---

## Project Overview

**BookStop** is a comprehensive full-stack e-commerce web application designed for the modern digital bookstore experience. Built as part of CSE216: Database Sessional, this platform seamlessly integrates customer-facing features with powerful administrative tools.

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/229223263-cf2e4b07-2615-4f87-9c38-e37600f8381a.gif" width="400">
</div>

---

##  Key Features

<table>
<tr>
<td width="50%">

###  **User Management**
-  Secure registration & authentication
-  Multi-role support (Customer, Admin)
-  Profile management & order history
-  Real-time notifications

### 📖 **Book Catalog**
-  Comprehensive book information
-  Genre-based categorization
-  Advanced rating & review system
-  Smart search & filtering

</td>
<td width="50%">

### 🛒 **Shopping System**
-  Interactive shopping cart
-  Wishlist functionality
-  Order tracking system
-  Voucher & discount system

### **Admin Features**
-  Dashboard with analytics
-  Inventory management
-  Sales tracking
-  User management

</td>
</tr>
</table>

---

##  Technology Stack

<div align="center">

### Backend Technologies
<img src="https://skillicons.dev/icons?i=nodejs,express,postgres" />

### Frontend Technologies  
<img src="https://skillicons.dev/icons?i=html,css,js,bootstrap" />

### Development Tools
<img src="https://skillicons.dev/icons?i=git,github,vscode,npm" />

</div>

<table>
<tr>
<td align="center"><img src="https://user-images.githubusercontent.com/74038190/212257454-16e3712e-945a-4ca2-b238-408ad0bf87e6.gif" width="100"><br><b>Backend</b></td>
<td>
• <b>Node.js</b> - Runtime environment<br>
• <b>Express.js</b> - Web framework<br>
• <b>PostgreSQL</b> - Database system<br>
• <b>JWT</b> - Authentication<br>
• <b>bcrypt</b> - Password hashing
</td>
</tr>
<tr>
<td align="center"><img src="https://user-images.githubusercontent.com/74038190/212257468-1e9a91f1-b626-4baa-b15d-5c385dfa7ed2.gif" width="100"><br><b>Frontend</b></td>
<td>
• <b>EJS</b> - Template engine<br>
• <b>Bootstrap 5</b> - CSS framework<br>
• <b>JavaScript</b> - Client-side logic<br>
• <b>CSS3</b> - Custom styling<br>
• <b>Font Awesome</b> - Icons
</td>
</tr>
</table>

---

##  Database Architecture

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="300">
</div>

###  **Database Schema (13 Tables)**

<details>
<summary> <b>Core Tables</b></summary>

- **`app_user`** - User accounts and profiles
- **`author`** - Book authors information  
- **`publisher`** - Publishing companies
- **`book`** - Book catalog with details
- **`voucher`** - Discount vouchers
- **`cart`** - Shopping carts

</details>

<details>
<summary> <b>Transaction Tables</b></summary>

- **`book_order`** - Order management
- **`picked`** - Cart items with quantities
- **`rates`** - Book reviews and ratings
- **`wish_list`** - User wishlists

</details>

<details>
<summary> <b>Notification System</b></summary>

- **`notifications`** - System notifications
- **`user_vouchers`** - Voucher assignments
- **`user_metadata`** - User statistics

</details>

---

##  Installation & Setup

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

### Prerequisites
```bash
 Node.js (v14 or higher)
 PostgreSQL (v12 or higher)
 Git
```

### Quick Start

1️⃣ **Clone the repository**
```bash
git clone https://github.com/Ocarina-33/BookStop.git
cd BookStop
```

2️⃣ **Install dependencies**
```bash
npm install
```

3️⃣ **Setup environment variables**
```bash
# Create .env file
PORT=4000
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=bookstore_db
PGPORT=5432
APP_SECRET=your_secret_key
```

4️⃣ **Setup database**
```bash
# Create database and run schema
psql -U postgres -c "CREATE DATABASE bookstore_db;"
psql -U postgres -d bookstore_db -f sql/CREATE_TABLES.sql
```

5️⃣ **Start the application**
```bash
npm start
```

 **Visit** `http://localhost:4000` to see your BookStop in action!

---

##  Advanced Features

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284145-bf2c01a8-c448-4f1a-b911-996024c84606.gif" width="300">
</div>

### 🏆 **Business Logic**
- **Stored Procedures** for complex operations
- **Database Triggers** for automatic calculations
- **Real-time stock management**
- **Automated rating calculations**

### 🔧 **System Architecture**
- **RESTful API design**
- **MVC pattern implementation**  
- **Session-based authentication**
- **Responsive design principles**

### 📊 **Performance Features**
- **Database indexing** for fast queries
- **Pagination** for large datasets
- **Image optimization**
- **Caching strategies**

---

##  Development Team

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284094-e50ceae7-de85-4f21-8d8e-9586e1c19334.gif" width="200">
</div>

<table align="center">
<tr>
<td align="center">
<img src="https://github.com/Ocarina-33.png" width="100px;" alt="Humaira"/>
<br />
<sub><b>Humaira Ali Shuvra</b></sub>
<br />
<sub>Student ID: 2205126</sub>
<br />
<a href="https://github.com/Ocarina-33">🔗 GitHub</a>
</td>
<td align="center">
<img src="https://github.com/Mahjabin-Porshi.png" width="100px;" alt="Mahjabin"/>
<br />
<sub><b>Mahjabin Porshi</b></sub>
<br />
<sub>Student ID: 2205127</sub>
<br />
<a href="https://github.com/Mahjabin-Porshi">🔗 GitHub</a>
</td>
</tr>
</table>

###  **Supervisor**
**Niaz Rahman**  
*Teacher, Department of CSE, BUET*  
📧 mr.niazrahman@gmail.com



<div align="center">

### 💖 Made with Love by Team BookStop

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="600">

**⭐ Star this repository if you found it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/Ocarina-33/BookStop?style=social)](https://github.com/Ocarina-33/BookStop/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Ocarina-33/BookStop?style=social)](https://github.com/Ocarina-33/BookStop/network)
[![GitHub watchers](https://img.shields.io/github/watchers/Ocarina-33/BookStop?style=social)](https://github.com/Ocarina-33/BookStop/watchers)

</div>

---

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=8B4513&height=100&section=footer" width="100%">
</div>
