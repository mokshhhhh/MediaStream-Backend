MediaStream Backend API

This project delivers a robust RESTful API backend focusing on comprehensive user authentication, account management, and content-related profile features. While drawing inspiration from the user experience of platforms like YouTube, it serves as a foundational demonstration of implementing core backend services and best practices.

Technologies & Tools
Node.js: JavaScript runtime for server-side execution.

Express.js: Fast, unopinionated, minimalist web framework for Node.js, used for building the API.

MongoDB Atlas: Cloud-hosted NoSQL database for flexible and scalable data storage.

Mongoose: ODM (Object Data Modeling) library for MongoDB and Node.js, providing schema-based solutions to model application data.

Cloudinary: Cloud-based image and video management service, utilized for handling and storing user avatars and cover images.

JSON Web Tokens (JWT): Secure and compact industry-standard method for representing claims between two parties, used for user authentication and authorization.

Postman: API platform for building, testing, and documenting APIs. Essential for interacting with and demonstrating this backend.

Key Features & API Endpoints
This API provides a range of functionalities designed to manage user identities and associated data. All features have been rigorously tested using Postman.

Account & Authentication Management
User Registration: Securely register new user accounts with data persisted in MongoDB.

User Login: Authenticate users against stored credentials, issuing JWTs for subsequent authorized requests.

User Logout: Invalidate user sessions by managing JWTs.

Password Change: Allow authenticated users to update their passwords securely.

Refresh Token Management: Implement a mechanism to refresh authentication tokens without re-logging in (if you have this, otherwise you can remove).

User Profile & Content Integration
Avatar Management: Enable authenticated users to upload and change their profile avatars via Cloudinary integration.

Cover Image Management: Allow authenticated users to upload and change their profile cover images via Cloudinary.

Account Details Update: Facilitate updating user profile information (e.g., username, email).

User Channel Information: Retrieve comprehensive details about a user's channel, including subscriber count, a list of subscribers, and subscriptions. This leverages MongoDB Aggregation Pipelines for efficient data retrieval.

Watch History Management: Retrieve a user's watch history.