
import dotenv from "dotenv"
import DBconnect from "./db/index.js"
import {app} from "./app.js"
//console.log("App instance imported in index.js:", app === global.myAppInstanceCheck); // Add this
dotenv.config({
    path: './env'
})

DBconnect()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO Db connection failed",err);
})
















/* 
IFFY approach
const app=exress()
  
( async()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR:",error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`app is listening from ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR",error)
        throw error
    }
})()*/