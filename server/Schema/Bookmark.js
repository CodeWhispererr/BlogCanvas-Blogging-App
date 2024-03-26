import mongoose, { Schema } from "mongoose";

const bookmarkSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: 'blogs',
        required: true,
    },
}, { timestamps: true });

export default mongoose.model("Bookmark", bookmarkSchema);
