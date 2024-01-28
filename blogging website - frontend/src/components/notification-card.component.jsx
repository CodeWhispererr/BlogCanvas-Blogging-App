import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { getDay } from '../common/date';
import NotificationCommentField from './notification-comment-field.component';

const NotificationCard = ({ data, index, notificationState }) => {
    let {type,createdAt,comment,replied_on_comment,user,user:{personal_info:{fullname,username,profile_img}},blog:{_id,blog_id,title},_id:notification_id}=data;

    let [isReplying,setReplying]=useState(false);

    const handleReplyClick=()=>{
        setReplying(preVal=>!preVal)
    }

    return (
        <div className='p-6 border-b border-grey border-l-black '>
            <div className='flex gap-5 mb-3'>
                <img src={profile_img} className='w-14 h-14 flex-none rounded-full'/>
                <div className="w-full">
                    <h1 className='font-medium text-xl text-dark-grey'>
                        <span className='lg:inline-block hidden capitalize'>{fullname}</span>
                        <Link to={`/user/${username}`} className='mx-1 text-black underline'>@{username}</Link>
                        <span className='font-normal'>
                            {
                                type=='like' ? "liked your blog.":
                                type=='comment' ? "commented on" :
                                "replied on"
                            }
                        </span>
                    </h1>
                    {
                        type=='reply' ?
                        <div className='p-4 mt-4 rounded-md bg-grey '>
                        <p>{replied_on_comment.comment}</p>
                        </div>
                        : <Link to={`/blog/${blog_id}`} className='font-medium text-dark-grey hover:underline line-clamp-1'>{`"${title}"`}</Link>
                    }
                </div>
            </div>
            {
                type!=='like' ? 
                <p className='ml-14 pl-15 font-gelasio text-xl my-5 '>{comment.comment}</p>:""
            }
            <div className='ml-14 pl-5 mt-3 text-dark-grey flex gap-8'>

            <p>{getDay(createdAt)}</p>

                {
                    type!=='like' ?
                    <>
                        <button className="underline hover:text-black"
                        onClick={handleReplyClick}
                        >Reply</button>
                        <button className="underline hover:text-black">Delete</button>
                    </>:""
                }
            </div>
            {
                isReplying?
                <div className='mt-8'>
                    <NotificationCommentField _id={_id} blog_author={user} index={index} replyingTo={comment._id} setReplying={setReplying} notification_id={notification_id} notificationData={notificationState}/>
                </div>:""
            }
        </div>
    )
}

export default NotificationCard
