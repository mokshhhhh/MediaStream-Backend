
import dotenv from "dotenv"
import DBconnect from "./db/index.js"
dotenv.config({
    path: './.env'
})

DBconnect()
















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