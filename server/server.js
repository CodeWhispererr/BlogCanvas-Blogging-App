import 'dotenv/config';
import express from "express"
import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid';
import jwt from "jsonwebtoken";
import cors from "cors";
import aws from "aws-sdk";
import admin from "firebase-admin"
import serviceAccountKey from "./blogcanvas-blog-website-firebase-adminsdk-qtlrz-a6707adc16.json" assert {type: 'json'}
import { getAuth } from "firebase-admin/auth"
const app = express();


//Schema Imported ....
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";
import Notification from "./Schema/Notification.js";
import Bookmark from './Schema/Bookmark.js';
import List from './Schema/List.js';
import Comment from './Schema/Comment.js';

app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

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

app.post("/google-auth", async (req, res) => {
    let { access_token } = req.body;
    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {
            let { email, name, picture } = decodedUser;

            picture = picture.replace("s96-c", "s384-c")

            let user = await User.findOne({ "personal_info.email": email })
                .select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
                    return u || null
                })
                .catch(err => {
                    return res.status(500).json({ "error": err.message })
                })

            if (user) {
                if (!user.google_auth) {
                    return res.status(403).json({ "error": "Please login with email and the password" })
                }
            }
            else {
                let username = await generateUsername(email);
                user = new User({
                    personal_info: { fullname: name, email, username },
                    google_auth: true
                })
                await user.save().then((u) => {
                    user = u;
                })
                    .catch(err => {
                        return res.status(500).json({ "error": err.message })
                    })
            }

            return res.status(200).json(formatDatatoSend(user))

        })
        .catch(err => {
            return res.status(500).json({ "error": "Failed to authenticate you with google. Try with another account" })
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
            if (!user.google_auth) {
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
            }
            else {
                return res.status(403).json({ "error": "Account was created using Google Auth" })
            }


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
// app.get('/all-users', async (req, res) => {
//     try {
//         const users = await User.find({}, 'personal_info.username personal_info.fullname personal_info.profile_img personal_info.email');

//         res.json({ users });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


app.get('/all-users', verifyJWT, async (req, res) => {
    try {
        const loggedInUserId = req.user;
        const users = await User.find({ _id: { $ne: loggedInUserId } }, 'personal_info.username personal_info.fullname personal_info.profile_img personal_info.email');

        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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

app.post('/create-list', verifyJWT, async (req, res) => {
    try {
        const { name, description, visibility } = req.body;
        if (!name.length) {
            return res.status(403).json({ error: "You must provide a title" });
        }
        const userId = req.user;

        const user = await User.findById(userId);
        if (user.lists.length >= 3) {
            return res.status(403).json({ error: "You can only create a maximum of 3 lists" });
        }
        const newList = new List({
            name,
            description,
            owner: userId,
            visibility,
        });

        await newList.save();

        await User.findByIdAndUpdate(userId, { $push: { lists: newList._id } });

        res.status(201).json({ message: 'List created successfully', list: newList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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
        .select("blog_id title des banner content activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        })
})

app.get('/all-lists', verifyJWT, async (req, res) => {
    try {
        const allLists = await List.find({ owner: req.user })
            .populate("owner", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .populate("sharedWith", "personal_info.profile_img personal_info.username personal_info.fullname")
            .sort({ createdAt: -1 })
            .select("name visibility description")

        res.status(200).json({
            latestTwoLists: allLists
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/shared-lists', verifyJWT, async (req, res) => {
    try {
        const userId = req.user;
        const lists = await List.find({ sharedWith: userId }).populate({
            path: 'owner',
            select: 'personal_info.username personal_info.fullname personal_info.profile_img',
        });

        res.json({ lists });
    } catch (error) {
        console.error(error);
        res.status(200).status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/list/conatins-blog', async (req, res) => {
    try {
        const { blogId, listId } = req.body;

        const list = await List.findById(listId);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        const blogExists = await Blog.findById(blogId);
        if (!blogExists) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        const isBlogInList = list.blogs.some(blog => blog.equals(blogId));;

        res.status(200).json({ isBlogInList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.put('/lists/add-blog-in-list', async (req, res) => {
    try {

        const { listId, _id } = req.body;

        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        const blogExists = await Blog.findById(_id);
        if (!blogExists) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        const isBlogInTheList = list.blogs.some(blog => blog.equals(_id));
        console.log(isBlogInTheList)

        if (isBlogInTheList) {
            console.log(list.blogs)

            list.blogs = list.blogs.filter(blog => blog.toString() !== _id);
            await list.save();

        } else {
            list.blogs.push(_id);
            await list.save();
        }

        res.json({ message: 'List status updated successfully', isBlogInTheList: !isBlogInTheList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/add-user-to-list', async (req, res) => {
    const { listId, userId } = req.body;
    try {
        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        const isUserAlreadyShared = list.sharedWith.includes(userId);
        if (isUserAlreadyShared) {
            return res.status(400).json({ error: 'List is already shared with this user' });
        }
        list.sharedWith.push(userId);
        await list.save();
        res.status(200).json({ message: 'User added to the list successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/lists/shared-users', async (req, res) => {
    try {
        const { listId } = req.body;
        const list = await List.findById(listId).populate({
            path: 'sharedWith',
            select: 'personal_info.username personal_info.fullname personal_info.profile_img',
        });

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        const sharedUsers = list.sharedWith;

        res.status(200).json({ sharedUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.post("/list/blogs", async (req, res) => {
    try {
        const { listId } = req.body;
        const list = await List.findById(listId)
            .populate({
                path: "blogs",
                populate: {
                    path: "author",
                    select: "personal_info.username personal_info.email personal_info.fullname personal_info.profile_img -_id"
                },
                select: "title banner des tags blog_id activity.total_likes publishedAt -_id"
            })
            .populate({
                path: "owner",
                select: "personal_info.username personal_info.email personal_info.fullname personal_info.profile_img -_id"
            })
            .populate({
                path: "sharedWith",
                select: "personal_info.username personal_info.email personal_info.fullname personal_info.profile_img -_id"
            });

        if (!list) {
            return res.status(404).json({ message: "List not found" });
        }

        res.status(200).json({ list });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/list/remove-shared-user-from-list', async (req, res) => {
    try {
        const { listId, username } = req.body;
        const userIdToRemove = await User.findOne({ 'personal_info.username': username }, '_id');

        if (!userIdToRemove) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedList = await List.findByIdAndUpdate(
            listId,
            { $pull: { sharedWith: userIdToRemove._id } },
            { new: true }
        );

        if (!updatedList) {
            return res.status(404).json({ error: 'List not found' });
        }

        res.json({ message: 'User removed from list successfully', list: updatedList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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
    console.log(tag, page, query, author, eliminate_blog, limit);
    let findQuery;
    if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') }
    }
    else if (tag) {
        findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    }
    else if (author) {
        findQuery = { draft: false, author }
    }

    let maxLimit = limit ? limit : 5;

    Blog.find(findQuery)
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err.message })
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
});

app.post('/check-medium-username', async (req, res) => {
    try {
        const { username } = req.body;
        console.log(username)
        const user = await User.findOne({ "personal_info.username": username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMediumUsernameSet = user.personal_info.is_medium_username_set;
        res.json({ isMediumUsernameSet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/fetch-medium-username', async (req, res) => {
    try {
        const {username} = req.body;
        // Find the user by ID
        const user = await User.findOne({ "personal_info.username": username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const mediumUsername = user.personal_info.medium_username;
        
        res.json({ mediumUsername });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/add-medium-username',verifyJWT, async (req, res) => {
    try {
        const username=req.user
        const {uname} = req.body;
        console.log(username,uname)
        if (!uname.length) {
            return res.status(403).json({ error: "You must provide a username" });
        }
        const user = await User.findByIdAndUpdate(username, { 'personal_info.medium_username': uname, 'personal_info.is_medium_username_set': true }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json({ message: 'Medium username added successfully.'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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

            Notification.updateMany(findQuery, { seen: true })
                .skip(skipDocs)
                .limit(maxLimit)
                .then(() => {
                    console.log("notification seen")
                })
            return res.status(200).json({ notifications })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err.message })
        })

});

app.put('/bookmark', verifyJWT, async (req, res) => {
    try {
        const userId = req.user;
        const { _id } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const blog = await Blog.findById(_id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        const isBookmarked = user.bookmarks.some(bookmark => bookmark.equals(_id));
        console.log(isBookmarked)

        if (isBookmarked) {
            console.log(user.bookmarks)

            user.bookmarks = user.bookmarks.filter(bookmark => bookmark.toString() !== _id);
            await Bookmark.findOneAndDelete({ user: userId, blog: _id });
        } else {

            const newBookmark = new Bookmark({ user: userId, blog: _id });
            await newBookmark.save();
            user.bookmarks.push(_id);
        }
        await user.save();

        res.json({ message: 'Bookmark status updated successfully', isBookmarked: !isBookmarked });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/bookmarked-blogs", verifyJWT, async (req, res) => {
    try {
        const userId = req.user;
        const { page, query } = req.body;
        const maxLimit = 5;

        const queryObject = { user: userId };
        const bookmarks = await Bookmark.find(queryObject).populate({
            path: "blog",
            model: "blogs",
            match: { title: new RegExp(query, 'i') },
            select: "publishedAt title des author blog_id banner tags activity -_id",
            populate: {
                path: "author",
                model: "users",
                select: "personal_info.fullname personal_info.username personal_info.profile_img -_id",
            },
        })
            .sort({ "createdAt": -1 })
            .select("-user -createdAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);
        const filteredBookmarks = bookmarks.filter(entry => entry.blog !== null);

        res.status(200).json({ bookmarks: filteredBookmarks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/is-bookmarked-by-user", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;

    Bookmark.exists({ user: user_id, blog: _id })
        .then(result => {
            return res.status(200).json({ result })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
});

app.post("/user-bookmarked-blogs-count", verifyJWT, (req, res) => {
    const user_id = req.user;
    const { query } = req.body;

    Bookmark.find({ user: user_id })
        .populate({
            path: 'blog',
            model: 'blogs',
            match: { title: new RegExp(query, 'i') }
        })
        .then(bookmarks => {
            const filteredBookmarks = bookmarks.filter(bookmark => bookmark.blog);
            const count = filteredBookmarks.length;
            return res.status(200).json({ totalDocs: count });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});


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
        .select("title banner publishedAt blog_id activity des draft -_id")
        .sort({ "publishedAt": -1 })
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
});

app.post("/add-comment", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id, comment, blog_author, replying_to, notification_id } = req.body;


    if (!comment.length) {
        return res.status(403).json({ error: 'Write something to leave a comment' })
    }

    let commentObj = {
        blog_id: _id, blog_author, comment, commented_by: user_id
    }
    if (replying_to) {
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }
    new Comment(commentObj).save().then(async commentFile => {
        let { comment, commentedAt, children } = commentFile;

        Blog.findOneAndUpdate({ _id }, { $push: { "comments": commentFile._id }, $inc: { "activity.total_comments": 1, "activity.total_parent_comments": replying_to ? 0 : 1 } })
            .then(blog => {
                console.log('New Comment created')
            })

        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentFile._id
        }
        if (replying_to) {
            notificationObj.replied_on_comment = replying_to;

            await Comment.findOneAndUpdate({ _id: replying_to }, { $push: { children: commentFile._id } }).then(replyingToCommentDoc => {
                notificationObj.notification_for = replyingToCommentDoc.commented_by
            })

            if (notification_id) {
                Notification.findOneAndUpdate({ _id: notification_id }, { reply: commentFile._id })
                    .then(notification => console.log('notification updated'))
            }

        }
        new Notification(notificationObj).save().then(notification => {
            console.log("New notification created")
        })
        return res.status(200).json({
            comment, commentedAt, _id: commentFile._id, user_id, children
        })
    })

})

app.post("/get-blog-comments", (req, res) => {
    let { blog_id, skip } = req.body;

    let maxLimit = 5;
    Comment.find({ blog_id, isReply: false })
        .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
        .skip(skip)
        .limit(maxLimit)
        .sort({
            'commentedAt': -1
        })
        .then(comment => {
            return res.status(200).json(comment);
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })
        })
})

app.post("/get-replies", (req, res) => {
    let { _id, skip } = req.body;
    let maxLimit = 5;
    Comment.findOne({ _id })
        .populate({
            path: "children",
            option: {
                limit: maxLimit,
                skip: skip,
                sort: { 'commentedAt': -1 }
            },
            populate: {
                path: 'commented_by',
                select: "personal_info.profile_img personal_info.fullname personal_info.username"
            },
            select: "-blog_id -updatedAt"

        })
        .select("children")
        .then(doc => {
            return res.status(200).json({ replies: doc.children })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})


const deleteComments = (_id) => {
    Comment.findOne({ _id })
        .then(comment => {


            if (comment.parent) {
                Comment.findByIdAndUpdate({ _id: comment.parent }, { $pull: { children: _id } })
                    .then(data => {
                        console.log('comment deleted');
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }

            Notification.findOneAndDelete({ comment: _id }).then(notification => console.log('comment notification deleted'))

            Notification.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 } }).then(notification => console.log('reply notification deleted'))

            Blog.findByIdAndUpdate({ _id: comment.blog_id }, { $pull: { comments: _id }, $inc: { "activity.total_comments": -1 }, "activity.total_parent_comments": comment.parent ? 0 : -1 }).then(blog => {
                if (comment.children.length) {
                    comment.children.map(replies => {
                        deleteComments(replies)
                    })
                }
            })

        })
        .catch(err => console.log(err.message))

}


app.post("/delete-comment", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;
    Comment.findOne({ _id }).then(comment => {
        if (user_id == comment.commented_by || user_id == comment.blog_author) {
            deleteComments(_id)
            return res.status(200).json({ status: 'done' })
        }
        else {
            return res.status(403).status({ error: "You can not delete this comment" })
        }
    })
})

app.post("/delete-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { blog_id } = req.body

    Blog.findOneAndDelete({ blog_id })
        .then(blog => {
            Notification.deleteMany({ blog: blog._id }).then(data => console.log('notifications deleted'));

            Comment.deleteMany({ blog_id: blog._id }).then(data => console.log('comments deleted'));

            User.findOneAndUpdate({ _id: user_id }, { $inc: { "account_info.total_posts": -1 }, $pull: { blogs: blog._id } })
                .then(user => console.log('Blog deleted'))
                .catch(error => {
                    console.error('Error during findOneAnddelete:', error);
                    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
                });

            return res.status(200).json({ status: 'done' })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

app.listen(port, () => {
    console.log(`Blog Website Backend listening on port ${port}`)
}) 