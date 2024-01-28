import React, { useContext, useState } from 'react'
import {Toaster,toast} from "react-hot-toast"
import { UserContext } from '../App';
const NotificationCommentField = ({_id, blog_author,index=undefined, replyingTo=undefined, setReplying,notification_id, notificationData}) => {
  let [comment,setComment]=useState('');

  let {_id:user_id}=blog_author;
  let {userAuth:{access_token}}=useContext(UserContext);
  let {notifications,notifications:{results},setNotifications}=notificationData;
  
  const handleComment=()=>{
    
  }

  
  return (
    <>
      <Toaster/>
      <textarea value={comment}
      onChange={(e)=>setComment(e.target.value)}
      placeholder='Leave a reply...'
      className='input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto'
      ></textarea>
      <button className='btn-dark mt-5 px-10 '
      onClick={handleComment}>Reply</button>
    </>
  )
}

export default NotificationCommentField
