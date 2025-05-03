import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js"

import { getReceiverSocketId ,io} from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try{
        const loggedInUserId = req.user._id;
         // Assuming you have the user ID in req.user
         const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

         res.status(200).json(filteredUsers);
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getMessages = async (req, res) => {
    try{
        const { id :userToChatId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId:  myId, receiverId:  userToChatId},
                { senderId: userToChatId, receiverId:  myId}
            ]
        }).populate("senderId", "-password").populate("receiverId", "-password");

        res.status(200).json(messages);
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const sendMessage = async (req, res) => {
    try{
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        const { text, image } = req.body;

        let imageUrl ;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        });
        await newMessage.save();
// todo: add socket io to send message to receiver
        const receiverScokerId=getReceiverSocketId(receiverId)
        if(receiverScokerId){
            io.to(receiverScokerId).emit("newMessage",newMessage)
        }

        res.status(201).json(newMessage);
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}