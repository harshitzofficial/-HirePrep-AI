const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ], // 👈 This automatically creates an index! takes O(log n) to search
        required: true,
    },
    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],// 👈 This automatically creates an index!
        required: true,
    },
    password: {
        type: String,
        required: true
    }
})
const userModel = mongoose.model("users", userSchema)
module.exports = userModel