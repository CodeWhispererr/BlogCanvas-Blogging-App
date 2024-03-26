import React, { useState,useContext } from 'react'
import { Link } from 'react-router-dom'
import { getDay } from '../common/date'
import { UserContext } from '../App'

const ManageBookmarkedBlogCard = ({blog}) => {
    let { blog:{banner, blog_id, title, publishedAt, activity} } = blog;
    let { userAuth: { access_token } } = useContext(UserContext);
  return (
       <>
            <div className='flex gap-10 border-b mb-6 max-md:px-4 border-grey pb-6 items-center'>
                <img src={banner} className='max-md:hidden lg-hidden xl:block w-28 h-28 flex-none bg-grey object-cover' />

                <div className='flex flex-col justify-between py-2 w-full min-w-[300px] '>
                    <div>
                        <Link to={`/blog/${blog_id}`} className='blog-title mb-4 hover:underline'>{title}</Link>
                    </div>

                    <p className='line-clamp-1'>Published on {getDay(publishedAt)}</p>
                </div>
            </div>
        </>
  )
}

export default ManageBookmarkedBlogCard;
