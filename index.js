const express = require('express');
require('dotenv').config();
const app=express();
const searchRouter=require('./route/query.js');
const cors = require('cors');
const { sessionMiddleware } = require('./middleware/user.js');




app.use(express.json());
app.use(cors({
  origin: [process.env.Allowed_Hosts, 'http://localhost:5173'], 
  credentials: true                 
}))
app.use(sessionMiddleware)


app.use('/search',searchRouter);






app.listen(3000,()=>{
    console.log("Server started on port 3000");
});