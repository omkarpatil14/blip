import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

// models
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
	const { username } = req.params;

	try {
		const user = await User.findOne({ username }).select("-password");
		if (!user) return res.status(404).json({ message: "User not found" });

		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const followUnfollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString()) {
			return res.status(400).json({ error: "You can't follow/unfollow yourself" });
		}

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow the user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow the user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			// Send notification to the user
			const newNotification = new Notification({
				type: "follow",
				from: req.user._id,
				to: userToModify._id,
			});

			await newNotification.save();
            
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (error) {
		console.log("Error in followUnfollowUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};



// Function to get suggested users for the current user to follow
export const getSuggestedUsers = async (req, res) => {
	try {
		// Step 1: Retrieve the current user's ID from the request object (user is assumed to be authenticated)
		const userId = req.user._id;

		// Step 2: Find the list of users that the current user is following
		// The 'select("following")' method ensures that only the 'following' field is returned
		const usersFollowedByMe = await User.findById(userId).select("following");

		// Step 3: Use MongoDB's aggregation framework to get a random sample of 10 users
		const users = await User.aggregate([
			{
				
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				
				$sample: { size: 10 },
			},
		]);

		// Step 4: Filter out users that the current user is already following
		// The filter function checks if each user is not in the list of followed users
		const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));

		// Step 5: Select the first 4 users from the filtered list as the final suggestions
		const suggestedUsers = filteredUsers.slice(0, 4);

		// Step 6: Remove the password field from each suggested user to avoid exposing sensitive data
		suggestedUsers.forEach((user) => (user.password = null));

		// Step 7: Return the list of suggested users as a JSON response with status 200 (OK)
		res.status(200).json(suggestedUsers);
	} catch (error) {
		// Step 8: Handle any errors that occur during the process
		// Log the error message and return a 500 (Internal Server Error) status with the error message
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};


export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			// Check if a new cover image has been uploaded.
			if (user.coverImg) {
				// If the user already has a cover image, delete the existing image from Cloudinary.
				// Extract the public ID from the current cover image URL and use it to destroy (delete) the image.
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}
		
			// Upload the new cover image to Cloudinary.
			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
		
			// Update the coverImg variable with the secure URL of the newly uploaded image.
			coverImg = uploadedResponse.secure_url;
		}
		

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};
