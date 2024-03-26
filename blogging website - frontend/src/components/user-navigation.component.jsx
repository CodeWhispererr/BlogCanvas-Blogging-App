import React from 'react'
import { Link } from "react-router-dom";
import AnimationWrapper from '../common/page-animation'
import { UserContext } from "../App";
import { useContext } from 'react';
import { removeFromSession } from '../common/session';
const UserNavigationPanel = () => {

    const { userAuth: { username }, setUserAuth } = useContext(UserContext);

    const signOutUser = () => {
        removeFromSession("user");
        setUserAuth({ access_token: null })
    }
    return (
        <AnimationWrapper
            className="absolute right-0 z-50"
            transition={{ duration: 0.2 }}
        >
            <div className='bg-white absolute right-0 border border-grey w-60 overflow-hidden duration-200'>
                <Link to="/editor" className='flex gap-2 link md:hidden pl-8 py-4'>
                    <i className="fi fi-rr-file-edit"></i>
                    <p>Write</p>
                </Link>
                <Link to={`/user/${username}`} className='link pl-8 py-4'>
                    <svg style={{ display: "inline-block" }} width="15" height="15" viewBox="0 0 24 24" fill="none" aria-label="Profile"><circle cx="12" cy="7" r="4.5" stroke="currentColor"></circle><path d="M3.5 21.5v-4.34C3.5 15.4 7.3 14 12 14s8.5 1.41 8.5 3.16v4.34" stroke="currentColor" stroke-linecap="round"></path></svg>
                    &nbsp; Profile
                </Link>
                <Link to={`/dashboard/blogs`} className='link pl-8 py-4'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{ display: "inline-block" }} width="15" height="15" className="dashboard text-dark-gray"><rect width="151" height="151" x="73" y="73" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16" rx="33.03" ry="33.03"></rect><rect width="151" height="151" x="288" y="73" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16" rx="33.03" ry="33.03"></rect><rect width="151" height="151" x="73" y="288" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16" rx="33.03" ry="33.03"></rect><rect width="151" height="151" x="288" y="288" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16" rx="33.03" ry="33.03"></rect></svg>
                    &nbsp;  Dashboard
                </Link>
                <Link to={`/settings/edit-profile`} className='link pl-8 py-4'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" style={{ display: "inline-block" }} stroke="currentColor" viewBox="0 0 100 100" id="settings"><g><path stroke="currentColor" d="M88.9 58.8c-2.4-2.3-3.7-5.5-3.7-8.8 0-3.3 1.3-6.4 3.7-8.8.4-.4.8-.7 1.3-1.1.7-.5.9-1.4.7-2.2-.8-2.9-2-5.7-3.4-8.3-.4-.7-1.2-1.1-2-1-.7.1-1.2.1-1.7.1-6.9 0-12.5-5.6-12.5-12.4 0-.5 0-1.1.1-1.7.1-.8-.3-1.6-1-2-2.6-1.4-5.4-2.6-8.3-3.4-.8-.2-1.7.1-2.2.7-.4.5-.8 1-1.1 1.3-2.4 2.3-5.5 3.6-8.8 3.6s-6.5-1.3-8.8-3.6c-.4-.4-.7-.8-1.1-1.3-.5-.7-1.4-.9-2.2-.7-2.9.9-5.7 2-8.3 3.4-.7.4-1.1 1.2-1 2 .1.7.1 1.2.1 1.7 0 6.9-5.6 12.4-12.5 12.4-.5 0-1.1 0-1.7-.1-.8-.1-1.6.3-2 1-1.4 2.6-2.6 5.4-3.4 8.3-.2.8 0 1.7.7 2.2.6.4 1 .8 1.3 1.1 4.9 4.8 4.9 12.7 0 17.6-.4.4-.8.7-1.3 1.1-.7.5-.9 1.4-.7 2.2.9 2.9 2 5.7 3.4 8.3.4.7 1.2 1.1 2 1 .7-.1 1.2-.1 1.7-.1 6.9 0 12.5 5.6 12.5 12.4 0 .5 0 1.1-.1 1.7-.1.8.3 1.6 1 2 2.6 1.4 5.4 2.6 8.3 3.4.8.2 1.7 0 2.2-.7.4-.5.8-1 1.1-1.3 2.4-2.3 5.5-3.6 8.8-3.6s6.5 1.3 8.8 3.6c.4.4.7.8 1.1 1.3.4.5 1 .8 1.6.8.2 0 .4 0 .6-.1 2.9-.9 5.7-2 8.3-3.4.7-.4 1.1-1.2 1-2-.1-.7-.1-1.2-.1-1.7 0-6.9 5.6-12.4 12.5-12.4.5 0 1.1 0 1.7.1.8.1 1.6-.3 2-1 1.4-2.6 2.6-5.4 3.4-8.3.2-.8 0-1.7-.7-2.2-.5-.4-1-.7-1.3-1.1zm-4.3 8.5h-.9c-9.1 0-16.5 7.4-16.5 16.4v.9c-1.6.8-3.3 1.5-5.1 2.1l-.6-.6c-3.1-3.1-7.2-4.8-11.6-4.8s-8.5 1.7-11.6 4.8l-.6.6c-1.7-.6-3.4-1.3-5.1-2.1v-.9c0-9.1-7.4-16.4-16.5-16.4h-.9c-.8-1.6-1.5-3.3-2.1-5.1l.6-.6c6.4-6.4 6.4-16.8 0-23.3l-.6-.6c.6-1.7 1.3-3.4 2.1-5.1h.9c9.1 0 16.5-7.4 16.5-16.4v-.9c1.6-.8 3.3-1.5 5.1-2.1l.6.6c3.1 3.1 7.2 4.8 11.6 4.8s8.5-1.7 11.6-4.8l.6-.6c1.7.6 3.4 1.3 5.1 2.1v.9c0 9.1 7.4 16.4 16.5 16.4h.9c.8 1.6 1.5 3.3 2.1 5.1l-.6.6c-3.1 3.1-4.8 7.2-4.8 11.6s1.7 8.5 4.8 11.6l.6.6c-.6 1.9-1.3 3.6-2.1 5.2zM50 26.2c-13.1 0-23.8 10.7-23.8 23.8S36.9 73.8 50 73.8 73.8 63.1 73.8 50 63.1 26.2 50 26.2zm0 43.6c-10.9 0-19.8-8.9-19.8-19.8S39.1 30.2 50 30.2 69.8 39.1 69.8 50 60.9 69.8 50 69.8z"></path></g><g><path fill="currentColor" stroke="currentColor" d="M1644-790V894H-140V-790h1784m8-8H-148V902h1800V-798z"></path></g></svg>
                    &nbsp; Settings
                </Link>
                <span className='absolute border-t border-grey w-[100%]'>
                </span>
                <button
                    className='text-left p-4 hover:bg-grey w-full pl-8 py-4'
                    onClick={signOutUser}
                >
                        <h1 className='font-bold text-xl mg-1'>Sign Out</h1>
                        <p className='text-dark-grey'>@{username}</p>
                </button>

            </div>
        </AnimationWrapper>
    )
}

export default UserNavigationPanel