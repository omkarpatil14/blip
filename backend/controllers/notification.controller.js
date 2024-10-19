import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getNotifications = async (req, res) => {
	try {
		const userId = req.user._id;

		const notifications = await Notification.find({ to: userId }).populate({
			path: "from",
			select: "username profileImg",
		});

		await Notification.updateMany({ to: userId }, { read: true });

		res.status(200).json(notifications);
	} catch (error) {
		console.log("Error in getNotifications function", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const deleteNotifications = async (req, res) => {
	try {
		const userId = req.user._id;

		await Notification.deleteMany({ to: userId });

		res.status(200).json({ message: "Notifications deleted successfully" });
	} catch (error) {
		console.log("Error in deleteNotifications function", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const deleteOneNotification = async (req,res)=>{

	try {
		const NotificationId= req.params._id;
		const userId= req.user._id;

		const isNotification= Notification.findById({NotificationId})
		if(!isNotification){
			res.status(404).json({error:"notification not found"});

		}

		if(isNotification.to.toString()!==userId.toString()){
			res.status(403).json({error:"user not authorized"})
		}
         
		await Notification.findByIdAndDelete(NotificationId);
		res.status(200).json({message:"notification deleted sucessfully"})
	} catch (error) {
		console.log("Error in notification controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
