
const express=require("express")
const cors=require("cors")  //it is use for fetch data from database in frontend




//app config
const app=express();
const port = 7000;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})



//database connection
const mongoose = require("mongoose");
 const connectDB = async () => {
    try {
      await mongoose.connect("mongodb+srv://deepumelkani123_db_user:IXTsOS2IZeLGDVzE@cluster0.azmpnf4.mongodb.net/?appName=Cluster0");
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Error connecting to database:", error);
      process.exit(1);
    }
  };
//db connectin model
connectDB();

