import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router=Router()
 
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    
    (req, res, next) => {
      
     console.log("✅ multer passed");
    console.log("📥 req.body:", req.body);
    console.log("📁 req.files:", req.files);
    next();
    },
    registerUser)
export default router