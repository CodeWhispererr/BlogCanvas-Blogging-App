import React, { useContext } from 'react'
import { Link } from "react-router-dom";
import { profileContext } from '../pages/profile.page';

const MediumCard = ({ article, author }) => {
  let { description } = article;
  console.log(article)
  let { profile } = useContext(profileContext);
  return (
    <>
      <div className='w-full' >
        <div className='flex gap-2 items-center mb-4'>
          <img
             src={profile.personal_info.profile_img} 
            className='w-6  h-6 rounded-full' />
          <p className="line-clamp-1"> {article.author} <span>•</span> @{profile.personal_info.username}
          </p>
          <span>•</span>
          <p className='min-w-fit'>
            {new Date(article.pubDate).toLocaleDateString()}
          </p>

        </div>
        <h1 className='blog-title'>{article.title}</h1>
        {/* <p className='my-3 text-xl font-gelasio leading-7 max-sm:hidden md:max-[1100px]:hidden line-clamp-2' dangerouslySetInnerHTML={{ __html: description }}></p> */}


        <div className='flex gap-4 mt-7'>
          <span className='btn-light py-1 px-4'>
            {article.categories[0]}
          </span>
          <span className='btn-light py-1 px-4'>
            {article.categories[1]}
          </span>
          {/* <span className='ml-3 flex items-center gap-2 text-dark-grey'>
            <i className='fi fi-rr-heart text-xl'></i>
            {total_likes}
          </span> */}
        </div>
      </div>

      <Link
        to={article.link} target='_blank'
        className='flex gap-8 items-center boredr-b border-grey pb-5 mb-4 mt-4' style={{ borderBottom: "1px solid rgb(243 243 255)" }}>
        <span style={{ color: "green" }} className=' flex items-center gap-2 text-2xl hover:bg-grey p-2 font-medium rounded-full pl-3 pr-3'>Read More...</span>
      </Link>
    </>
  )
}

export default MediumCard
