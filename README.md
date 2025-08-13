# Real-Time Asynchronous Chat Application Using WebSockets with End-to-End Encryption

## Project Description

This project is a **full-stack real-time chat application** that enables users to communicate instantly through a secure, asynchronous, two-way channel. It leverages **WebSockets** via **Django Channels** for live messaging, **Django REST Framework (DRF)** for backend APIs, and a **ReactJS frontend** for a responsive and interactive user interface.

The application is designed with **modern security and usability features**, including **end-to-end encryption**, **OTP-based user verification**, **password reset with rate-limiting**, and **offline message handling**. It combines strong **business logic** with advanced real-time communication, making it suitable as a scalable messaging platform.

---

## Key Features

### 1. Real-Time Messaging
- Full-duplex communication using WebSockets.
- Instant message delivery between users.
- Live updates for online/offline status and new messages.

### 2. End-to-End Encryption
- All messages are encrypted before being sent.
- Only the intended recipient can decrypt messages.
- Ensures privacy and security for user conversations.

### 3. User Authentication & OTP Verification
- Secure user registration with email verification via OTP.
- Password reset functionality with throttling and rate-limiting to prevent abuse.

### 4. Friend System
- Users can add friends and manage a friend list.
- Sending a friend request triggers real-time notifications using WebSockets.

### 5. Offline Message Handling
- Messages sent to offline users are stored in the database.
- Delivered automatically when the user comes online.

### 6. Scalable & Extensible
- Backend designed with Django Channels and DRF for scalability.
- ReactJS frontend allows for a modern, responsive, and interactive UI.
