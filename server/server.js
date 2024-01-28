import 'dotenv/config';
import express from "express"
import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid';
import jwt from "jsonwebtoken";
import cors from "cors";
import aws from "aws-sdk";

const app = express();


//Schema Imported
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";
import Notification from "./Schema/Notification.js";

app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password


const mongoURI = process.env.MONGO_URL;
const connectToMongo = () => {
    mongoose.connect(mongoURI, {
        autoIndex: true
    }).then(() => console.log("Connected to Mongo Successfully")).catch((err) => console.log(err));

};
mongoose.set('strictQuery', true);
connectToMongo();


//setting up s3 Bucket
const s3 = new aws.S3({
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) {
        return res.status(401).json({ error: "No access token" });
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Access token is invalid" });
        }

        // Set user ID on the request object
        req.user = user.id;
        // Call the next middleware or route handler
        next();
    });
};


const generateUploadURL = async () => {
    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`
    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'blogging-website-bucket',
        Key: imageName,
        Expires: 7000,
        ContentType: "image/jpeg"
    })
}

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)


    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}

const generateUsername = async (email) => {
    let username = email.split("@")[0];
    let isUsernameNotUnique = await User.exists({ "personal_info.username": username }).then((result) => result)
    isUsernameNotUnique ? username += nanoid().substring(0, 4) : "";
    return username;
}

//upload image url route
app.get('/get-upload-url', (req, res) => {
    generateUploadURL()
        .then(url => res.status(200).json({ uploadURL: url }))
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })
        })
})

app.post("/signup", (req, res) => {
    console.log(req.body)
    let { fullname, email, password } = req.body;

    if (fullname.length < 3) {
        return res.status(403).json({ "error": "Fullname must be at least 3 letters long" })
    }
    if (!email.length) {
        return res.status(403).json({ "error": "Enter Email" })
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Email is invalid" })
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
    }
    bcrypt.hash(password, 10, async (err, hashed_password) => {
        let username = await generateUsername(email);
        let user = new User({
            personal_info: { fullname, email, password: hashed_password, username }
        })
        user.save().then((u) => {
            return res.status(200).json(formatDatatoSend(user))
        }).catch(err => {

            if (err.code = 11000) {
                return res.status(500).json({ "error": "Email already exists" })
            }
            return res.status(500).json({ "error": err.message })
        })
    })
})

app.post("/signin", (req, res) => {
    let { email, password } = req.body;

    if (!email.length) {
        return res.status(403).json({ "error": "Enter Email" })
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Email is invalid" })
    }
    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({ "error": "Email not found" });
            }
            bcrypt.compare(password, user.personal_info.password, (err, result) => {
                if (err) {
                    return res.status(403).json({ "error": "Error occured while login please try again" });
                }
                if (!result) {
                    return res.status(403).json({ "error": "Incorrect Password" });
                } else {
                    return res.status(200).json(formatDatatoSend(user))
                }


            })

        }).catch(err => {
            console.log(err.message);
            return res.status(500).json({ "error": err.message })
        })

})

app.post("/search-users", (req, res) => {
    let { query } = req.body;
    User.find({ "personal_info.username": new RegExp(query, 'i') })
        .limit(50)
        .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
        .then(users => {
            return res.status(200).json({ users });
        })
        .catch(err => {
            return res.status(500).json({ error: message })
        })
})

app.post("/update-profile-img", verifyJWT, (req, res) => {
    let { url } = req.body;
    User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
        .then(() => {
            return res.status(200).json({ profile_img: url })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

app.post("/update-profile", verifyJWT, (req, res) => {
    let bioLimit = 150;
    let { username, bio, social_links } = req.body;
    if (username.length < 3) {
        return res.status(403).json({ error: "Username should be atleast 3 letters long" })
    }
    if (bio.length > bioLimit) {
        return res.status(403).json(`Bio should not be more than ${bioLimit}`)
    }
    let socialLinksArr = Object.keys(social_links);
    try {

        for (let i = 0; i < socialLinksArr.length; i++) {
            if (social_links[socialLinksArr[i]].length) {
                let hostname = new URL(social_links[socialLinksArr[i]]).hostname;

                if (!hostname.includes(`${socialLinksArr[i]}.com`) && socialLinksArr[i] !== 'website') {
                    return res.status(403).json({ error: `${socialLinksArr[i]} link is invalid. You must enter a full link` })
                }
            }
        }
    }
    catch (err) {
        return res.status(500).json({ error: "You must provide full social links with http(s) included" })
    }

    let updateObj = {
        "personal_info.username": username,
        "personal_info.bio": bio,
        social_links
    }

    User.findOneAndUpdate({ _id: req.user }, updateObj, {
        runValidators: true
    })
        .then(() => {
            return res.status(200).json({ username })
        })
        .catch(err => {
            if (err.code === 11000) {

                return res.status(409).json({ error: "Username already exists " })
            }
            return res.status(500).json({ error: err.message })
        })
})


app.post('/create-blog', verifyJWT, (req, res) => {
    let authorId = req.user;
    let { title, des, banner, tags, content, draft, id } = req.body;


    if (!title.length) {
        return res.status(403).Json({ error: "You must provide a title" });
    }

    if (!draft) {

        if (!des.length || des.length > 200) {
            return res.status(403).json({ error: "You must provide blog description under 200 characters" });
        }
        if (!banner.length) {
            return res.status(403).json({ error: "You must provide blog banner to publish it" })
        }
        if (!content.blocks.length) {
            return res.status(403).json({ error: "There must be some blog content to publish it" })
        }
        if (!tags.length || tags.length > 5) {
            return res.status(403).json({ error: "Provide tags in order to publish the blog, maximum 10" })
        }
    }



    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = id || title.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, "-").trim() + nanoid();


    if (id) {

        Blog.findOneAndUpdate({ blog_id }, { title, des, banner, content, tags, draft: draft ? draft : false })
            .then(() => {
                return res.status(200).json({ id: blog_id })
            })
            .catch(err => {
                return res.status(500).json({ error: "Failes to update total posts number" })
            })
    } else {
        let blog = new Blog({
            title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft)
        })

        blog.save().then(blog => {
            let incrementVal = draft ? 0 : 1;
            User.findOneAndUpdate({ _id: authorId }, {
                $inc: { "account_info.total_posts": incrementVal }, $push: { "blogs": blog._id }
            }).then(user => {
                return res.status(200).json({ id: blog.blog_id });
            })
                .catch(err => {
                    return res.status(500).json({ error: "Failed to Update total posts number" })
                })
        })
            .catch(err => {
                return res.status(500).json({ error: err.message });
            })
    }


})

app.post("/change-password", verifyJWT, (req, res) => {
    let { currentPassword, newPassword } = req.body;

    if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
        return res.status(403).json({ error: "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" });
    }
    User.findOne({ _id: req.user })
        .then((user) => {
            bcrypt.compare(currentPassword, user.personal_info.password, (err, result) => {

                if (err) {
                    return res.status(500).json({
                        error: "Some error occured while changing the password,Please try again later"
                    })

                }

                if (!result) {
                    return res.status(403).json({ error: "Incorrect current Password" })
                }

                bcrypt.hash(newPassword, 10, (err, hashed_password) => {
                    User.findOneAndUpdate({ _id: req.user }, { "personal_info.password": hashed_password })
                        .then((u) => {
                            return res.status(200).json({ status: "Password Changed" })
                        })
                        .catch(err => {
                            return res.status(500).json({ error: "Some error occured while saving new password, please try again later" })
                        })
                })
            })

        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "User not found" })
        })



})

app.post('/latest-blogs', (req, res) => {
    let { page } = req.body;
    let maxLimit = 5;
    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        })
})

app.get("/trending-blogs", (req, res) => {
    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "activity.total_reads": -1, "activity.total_likes": -1, "publishedAt": -1 })
        .select("blog_id title publishedAt -_id")
        .limit(5)
        .then(blogs => {
            return res.status(200).json({ blogs });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

app.post("/search-blogs", (req, res) => {

    let { tag, page, query, author, eliminate_blog, limit } = req.body;
    let findQuery;


    if (tag) {
        findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') }
    }
    else if (author) {
        findQuery = { draft: false, author }
    }

    let maxLimit = limit ? limit : 2;

    Blog.find(findQuery)
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
})

app.post("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({ draft: false })
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })
        })
})

app.post("/search-blogs-count", (req, res) => {
    let { tag, query, author } = req.body;
    let findQuery;

    if (tag) {
        findQuery = { tags: tag, draft: false };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') }
    }
    else if (author) {
        findQuery = { draft: false, author }
    }

    Blog.countDocuments(findQuery)
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })
        })
})

app.post("/get-profile", (req, res) => {
    let { username } = req.body;
    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updatedAt -blogs")
        .then(user => {
            return res.status(200).json(user);
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err.message })
        })
})

app.post("/get-blog", (req, res) => {
    let { blog_id, draft, mode } = req.body;

    let incrementVal = mode !== 'edit' ? 1 : 0;
    Blog.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_reads": incrementVal } })
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .select("title des content banner activity publishedAt blog_id tags")
        .then(blog => {

            User.findOneAndUpdate({ "personal_info.username": blog.author.personal_info.username }, {
                $inc: { "account_info.total_reads": incrementVal }
            })
                .catch(err => {
                    return res.status(500).json({ error: err.message })
                })

            if (blog.draft && !draft) {
                return res.status(500).json({ error: "You can not access draft blog" })
            }

            return res.status(200).json({ blog });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        })
})

app.post("/like-blog", verifyJWT, (req, res) => {

    let user_id = req.user;
    let { _id, islikedByUser } = req.body;

    let incrementVal = !islikedByUser ? 1 : -1;

    Blog.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
        .then(blog => {
            if (!islikedByUser) {
                let like = new Notification({
                    type: "like",
                    blog: _id,
                    notification_for: blog.author,
                    user: user_id
                })
                like.save().then(notification => {
                    return res.status(200).json({ liked_by_user: true })
                })
            }
            else {
                Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" })
                    .then(data => {
                        return res.status(200).json({ liked_by_user: false })
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err.message })
                    })
            }
        })
})

app.post("/isliked-by-user", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;
    Notification.exists({ user: user_id, type: "like", blog: _id })
        .then(result => {
            return res.status(200).json({ result })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

app.get("/new-notification", verifyJWT, (req, res) => {
    let user_id = req.user;

    Notification.exists({ notification_for: user_id, seen: false, user: { $ne: user_id } })
        .then(result => {
            if (result) {
                return res.status(200).json({ new_notification_available: true })
            }
            else {
                return res.status(200).json({ new_notification_available: false })
            }
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err.message })
        })
})

app.post("/notifications", verifyJWT, (req, res) => {
    let user_id = req.user;

    let { page, filter, deletedDocCount } = req.body;

    let maxLimit = 10;

    let findQuery = { notification_for: user_id, user: { $ne: user_id } };

    let skipDocs = (page - 1) * maxLimit;

    if (filter !== 'all') {
        findQuery.type = filter;
    }

    if (deletedDocCount) {
        skipDocs -= deletedDocCount;
    }

    Notification.find(findQuery)
        .skip(skipDocs)
        .limit(maxLimit)
        .populate("blog", "title blog_id")
        .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
        .populate("comment", "comment")
        .populate("replied_on_comment", "comment")
        .populate("reply", "comment")
        .sort({ createdAt: -1 })
        .select("createdAt type seen reply")
        .then(notifications => {
            return res.status(200).json({ notifications })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err.message })
        })

})

app.post("/all-notifications-count", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { filter } = req.body;
    let findQuery = {
        notification_for: user_id,
        user: { $ne: user_id }
    }

    if (filter !== 'all') {
        findQuery.type = filter;
    }

    Notification.countDocuments(findQuery)
        .then(count => {

            return res.status(200).json({ totalDocs: count });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

app.post("/user-written-blogs", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { page, draft, query, deletedDocCount } = req.body;

    let maxLimit = 5;
    let skipDocs = (page - 1) * maxLimit;

    if (deletedDocCount) {
        skipDocs -= deletedDocCount;
    }
    Blog.find({ author: user_id, draft, title: new RegExp(query, 'i') })
        .skip(skipDocs)
        .limit(maxLimit)
        .sort("title banner publishedAt blog_id activity des draft -_id")
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

app.post("/user-written-blogs-count", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { draft, query } = req.body;
    Blog.countDocuments({ author: user_id, draft, title: new RegExp(query, 'i') })
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        })
})

app.post("/delete-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { blog_id } = req.body

    Blog.findOneAndDelete({ blog_id })
        .then(blog => {
            Notification.deleteMany({ blog: blog._id }).then(data => console.log('notifications deleted'));

            // Comment.deleteMany({ blog_id: blog._id }).then(data => console.log('comments deleted'));

            User.findOneAndUpdate({ _id: user_id }, { $pull: { blog: blog._id }, $inc: { "account_info.total_posts": -1 }})
            .then(user=>console.log('Blog deleted'));
            return res.status(200).json({status:'done'})
        })
        .catch(err=>{
            return res.status(500).json({error:err.message})
        })
})

app.listen(port, () => {
    console.log(`Blog Website Backend listening on port ${port}`)
}) 