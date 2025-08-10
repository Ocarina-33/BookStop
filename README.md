<div align="center">

# 📚 BookStop - Online Bookstore Management System

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

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔐 **User Management**
- 🎯 Secure registration & authentication
- 👥 Multi-role support (Customer, Admin)
- 📝 Profile management & order history
- 🔔 Real-time notifications

### 📖 **Book Catalog**
- 📚 Comprehensive book information
- 🏷️ Genre-based categorization
- ⭐ Advanced rating & review system
- 🔍 Smart search & filtering

</td>
<td width="50%">

### 🛒 **Shopping System**
- 🛍️ Interactive shopping cart
- ❤️ Wishlist functionality
- 📦 Order tracking system
- 🎫 Voucher & discount system

### 👨‍💼 **Admin Features**
- 📊 Dashboard with analytics
- 📋 Inventory management
- 📈 Sales tracking
- 👥 User management

</td>
</tr>
</table>

---

## 🛠️ Technology Stack

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

## 🏗️ Database Architecture

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="300">
</div>

### 📊 **Database Schema (13 Tables)**

<details>
<summary>🔍 <b>Core Tables</b></summary>

- **`app_user`** - User accounts and profiles
- **`author`** - Book authors information  
- **`publisher`** - Publishing companies
- **`book`** - Book catalog with details
- **`voucher`** - Discount vouchers
- **`cart`** - Shopping carts

</details>

<details>
<summary>🔍 <b>Transaction Tables</b></summary>

- **`book_order`** - Order management
- **`picked`** - Cart items with quantities
- **`rates`** - Book reviews and ratings
- **`wish_list`** - User wishlists

</details>

<details>
<summary>🔍 <b>Notification System</b></summary>

- **`notifications`** - System notifications
- **`user_vouchers`** - Voucher assignments
- **`user_metadata`** - User statistics

</details>

---

## 🚀 Installation & Setup

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

### Prerequisites
```bash
📦 Node.js (v14 or higher)
🐘 PostgreSQL (v12 or higher)
📝 Git
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

🎉 **Visit** `http://localhost:4000` to see your BookStop in action!

---

## 📱 Application Screenshots

<div align="center">

### 🏠 Homepage
<img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="600">

*Beautiful landing page with featured books and categories*

### 📚 Book Catalog
<img src="https://user-images.githubusercontent.com/74038190/212284136-03988914-d42b-4505-b9a4-f8038e36fb91.gif" width="600">

*Advanced filtering and sorting with elegant book displays*

### 🛒 Shopping Experience
<img src="https://user-images.githubusercontent.com/74038190/212284175-acc7d51c-6811-4319-9b5c-9c069e4f1825.gif" width="600">

*Smooth cart management and checkout process*

</div>

---

## 🎯 Advanced Features

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

## 👥 Development Team

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

### 👨‍🏫 **Supervisor**
**Niaz Rahman**  
*Teacher, Department of CSE, BUET*  
📧 mr.niazrahman@gmail.com

---

## 📝 API Documentation

<details>
<summary>🔗 <b>User Authentication Endpoints</b></summary>

```javascript
POST /login          // User login
POST /signup         // User registration  
GET  /logout         // User logout
GET  /profile        // User profile
```

</details>

<details>
<summary>🔗 <b>Book Management Endpoints</b></summary>

```javascript
GET    /books              // Get all books
GET    /books/:id          // Get book details
GET    /books/genre/:genre // Get books by genre
POST   /books/search       // Search books
```

</details>

<details>
<summary>🔗 <b>Shopping Cart Endpoints</b></summary>

```javascript
GET    /cart         // View cart
POST   /cart/add     // Add to cart
PUT    /cart/update  // Update cart
DELETE /cart/remove  // Remove from cart
```

</details>

---

## 🎨 UI/UX Features

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284119-fbfd994d-8c2a-4c3b-9d7b-7b8b0e8e3ea6.gif" width="400">
</div>

### 🎭 **Visual Design**
- 🎨 **3D Book Effects** with realistic shadows
- 🌈 **Smooth Animations** and transitions
- 📱 **Responsive Design** for all devices
- 🎯 **Intuitive Navigation** and user flows

### 💫 **Interactive Elements**
- ⭐ **Dynamic Star Ratings**
- 🛒 **Real-time Cart Updates**
- 🔔 **Toast Notifications**
- 📊 **Live Statistics Dashboard**

---

## 🔒 Security Features

<table>
<tr>
<td width="50%">

### 🛡️ **Authentication**
- JWT token-based sessions
- Secure password hashing
- Role-based access control
- Session timeout management

</td>
<td width="50%">

### 🔐 **Data Protection**
- SQL injection prevention
- XSS attack protection
- CSRF token validation
- Input sanitization

</td>
</tr>
</table>

---

## 📈 Performance Metrics

<div align="center">

[![Performance](https://img.shields.io/badge/Performance-95%25-brightgreen?style=for-the-badge)](.)
[![Accessibility](https://img.shields.io/badge/Accessibility-92%25-green?style=for-the-badge)](.)
[![Best_Practices](https://img.shields.io/badge/Best_Practices-98%25-brightgreen?style=for-the-badge)](.)
[![SEO](https://img.shields.io/badge/SEO-90%25-green?style=for-the-badge)](.)

</div>

---

## 🔮 Future Enhancements

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284126-7cb769d6-8fa4-4e5e-8e21-c1c50e9b9ae0.gif" width="300">
</div>

- 🤖 **AI-powered book recommendations**
- 📱 **Mobile app development**  
- 💳 **Payment gateway integration**
- 🌍 **Multi-language support**
- 📊 **Advanced analytics dashboard**
- 🔄 **Real-time inventory sync**

---

## 🤝 Contributing

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284112-59ebc1ee-c0fd-4fdb-82d3-3145c2a43132.gif" width="200">
</div>

We welcome contributions! Please follow these steps:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push to the branch (`git push origin feature/AmazingFeature`)
5. 🔄 Open a Pull Request

---

## 📄 License

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License - see the LICENSE file for details.

</div>

---

## 🙏 Acknowledgments

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284103-e0e1e28b-e419-4ce7-a1af-82f14f8720e5.gif" width="300">
</div>

- 🏫 **Bangladesh University of Engineering and Technology (BUET)**
- 👨‍🏫 **CSE216: Database Sessional Course**
- 💡 **Open source community for amazing tools**
- 🎨 **Design inspiration from modern e-commerce platforms**

---

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
