import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"})) 
app.use(express.urlencoded({extended:true,lmit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes

import router from '../routes/user.routes.js';

//routes declaration
app.use("/api/v1/users",router)
//https://localhost:8000/api/v1/users/register

// // Global error handler(chatgpt soln for postman error [object object])
// app.use((err, req, res, next) => {
//   console.error("Error Handler Triggered:", err);

//   const statusCode = err.statusCode || 500;

//   res.status(statusCode).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//     errors: err.errors || [],
//     stack: process.env.NODE_ENV === "development" ? err.stack : undefined
//   });
// });


export { app }