// DEPENDENCIES
const dns = require('dns');
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
// const { MongoClient } = require('mongodb');
const User = require('./User');

// The connection string is loaded from the .env file
// Sensitive information from .env
const port = process.env.PORT || 3001;
const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());

// Establish connections
mongoose.connect(uri);
// const client = new MongoClient(uri);
// Check if the connection is successful
mongoose.connection.once("open",()=>{
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
});
mongoose.connection.on("error", (error)=>{
    console.log("MongoDB connection error:", error);
})
mongoose.connection.once("close", ()=>{
    console.log('Connection to MongoDB has closed...')
})


// Route handlers
app.post('/api/users/register',async (req,res)=>{
    try{
        const foundUser = await User.findOne({email: req.body.email});
        if(foundUser !== null){
            return res.status(400).json({message: "This user already exists"});
        }
        const newUser = await User.create(req.body);
        const payload = {_id:newUser._id, username:newUser.username};
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn:"1h"});
        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email
        };
        res.status(201).json({message:"User created successfully...", user:userResponse, token});
    }
    catch(error){
        console.error(error);
        res.status(400).json({message:error.message});
    }
})

app.post('/api/users/login', async(req,res)=>{
    try{
        const user = await User.findOne({email:req.body.email});
        if(!user){
            return res.status(400).json({message:"Incorrect email or password..."});
        }
        const correctPass = await user.isCorrectPassword(req.body.password);
        if(!correctPass){
            return res.status(400).json({message:"Incorrect email or password..."});
        }
        const payload = {_id:user._id, username:user.username};
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn:"1h"});
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email
        };
        res.status(200).json({ message: "User logged in successfully!", token, user:userResponse });
    }
    catch(error){
        console.error(error);
        res.status(400).json({ message: error.message });
    }
})

app.listen(port, ()=>{
    console.log(`Server is running at http://localhost:${port}`);
})


