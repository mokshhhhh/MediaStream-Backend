
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
// console.log("App instance created in app.js:", app === global.myAppInstanceCheck); // Add this
// global.myAppInstanceCheck = app; // Temporarily assign to global for comparison

import router from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",router)
//https://localhost:8000/api/v1/users/register


export { app }