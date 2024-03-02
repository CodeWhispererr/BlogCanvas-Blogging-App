import React, { useContext, useEffect, useState } from 'react'
import { BlogContext } from '../pages/blog.page'
import { Link } from 'react-router-dom'
import { UserContext } from "../App";
import { Toaster, toast } from 'react-hot-toast'
import axios from "axios";

import ShareButton from '../components/share.component'
const BlogInteraction = () => {

    let { blog,blog: { _id,title, blog_id, activity, activity: { total_likes, total_comments }, author: {
        personal_info: {
            username: author_username
        }
    } }, setBlog, islikedByUser, setLikedByUser } = useContext(BlogContext)

    let { userAuth: { username, access_token } } = useContext(UserContext);


    useEffect(()=>{
        if(access_token){
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user", {_id},{
                headers:{
                    'Authorization':`Bearer ${access_token}`
                }
            })
            .then(({data:{result}})=>{
              setLikedByUser(Boolean(result))
            })
            .catch(err=>{
                console.log(err)
            })
        }
    },[])

    const handleLike = () => {
        if (access_token) {

            setLikedByUser(preVal => !preVal);

            !islikedByUser ? total_likes++ : total_likes--;

            setBlog({...blog,activity:{...activity,total_likes}})

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/like-blog", {_id,islikedByUser},{
                headers:{
                    'Authorization': `Bearer ${access_token}`
                }
            }).then(({data})=>{
                console.log(data);
            })
            .catch(err=>{
                console.log(err);
            })
        }
        else {
            // not logged in
            toast.error("Please Login to ❤️ this Blog")
        }
    }



    return (
        <>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="notification-toast"
            />

            <hr className='border-grey my-2' />
            <div className='flex gap-6 justify-between'>

                <div className='flex gap-6 items-center'>


                    <button
                        onClick={handleLike}
                        className={'w-10 h-10 rounded-full flex items-center justify-center '+ (islikedByUser? "bg-red/20 text-red":"bg-grey/80")}>

                        <i className={'fi '+(islikedByUser? "fi-sr-heart":"fi-rr-heart")}></i>
                    </button>
                    <p className='text-xl text-dark-grey '>
                        {total_likes}
                    </p>


                    <button className='w-10 h-10 rounded-full flex items-center justify-center bg-grey/80'>

                        <i className='fi fi-rr-comment-dots'></i>
                    </button>
                    <p className='text-xl text-dark-grey '>
                        {total_comments}
                    </p>

                </div>


                <div className='flex gap-6 items-center'>

                <button aria-controls="addToCatalogBookmarkButton" aria-expanded="false" aria-label="Add to list bookmark button" class="az bz ba bb bc an bd ni ao ap aq jc nj nk hx"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="nl"><path d="M17.5 1.25a.5.5 0 0 1 1 0v2.5H21a.5.5 0 0 1 0 1h-2.5v2.5a.5.5 0 0 1-1 0v-2.5H15a.5.5 0 0 1 0-1h2.5v-2.5zm-11 4.5a1 1 0 0 1 1-1H11a.5.5 0 0 0 0-1H7.5a2 2 0 0 0-2 2v14a.5.5 0 0 0 .8.4l5.7-4.4 5.7 4.4a.5.5 0 0 0 .8-.4v-8.5a.5.5 0 0 0-1 0v7.48l-5.2-4a.5.5 0 0 0-.6 0l-5.2 4V5.75z" fill="#000"></path></svg></button>

                    {
                        username == author_username ?
                            <Link to={`/editor/${blog_id}`} className='underline hover:text-purple'>
                                Edit
                            </Link> :
                            ""
                    }
                    <ShareButton />
                </div>
            </div>

            <hr className='border-grey my-2' />
        </>
    )
}

export default BlogInteraction
