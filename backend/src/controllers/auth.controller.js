import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";


export const signup = async (req, res) => {
    try{
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
        // Create a new user instance and save it to the database
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });
        if(newUser){
            await newUser.save();
            generateToken(newUser._id,res);
           
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        }else{
            return res.status(400).json({ message: "User creation failed" });
        }
        
    }catch(err){
        console.error("Error during signup:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        generateToken(user._id,res);
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
        

    }catch(err){
        console.error("Error during login:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const logout = async (req, res) => {
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({ message: "Logged out successfully" });
    }catch(err){
        console.error("Error during logout:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req, res) => {
    try{
        const {profilePic}=req.body;
        const userId=req.user._id;
        if(!profilePic){
            return res.status(400).json({ message: "Profile picture URL is required" });
        }
        const uploadResponse=await cloudinary.uploader.upload(profilePic)
        const updatedUser=await User.findByIdAndUpdate(userId,{
            profilePic:uploadResponse.secure_url,
        },{new:true});
        res.status(200).json(updatedUser)
    }catch(err){
        console.error("Error during profile update:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const checkAuth = async (req, res) => {
    try{
        res.status(200).json(req.user)
    }catch(err){
        console.error("Error during authentication check:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
}