import mongoose, { Schema } from "mongoose";

const listSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    blogs: [
        {
            type: Schema.Types.ObjectId,
            ref: 'blogs',
        },
    ],
    sharedWith: [
        {
            type: Schema.Types.ObjectId,
            ref: 'users',
        },
    ],
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
    },
}, { timestamps: true });

export default mongoose.model("List", listSchema);
