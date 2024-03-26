import React, { useState, useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Drawer, Avatar } from 'antd';
import SearchBarDrawer from './drawer-searchbar.component';
import SearchResultsList from './search-results-list.component';
import { UserContext } from '../App';
import axios from 'axios';
import Loader from './loader.component';
import AnimationWrapper from '../common/page-animation';
import NoDataMessage from './nodata.component';

const ListCard = ({ list, isSharedList = true }) => {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [sharedUsers, setSharedUsers] = useState([]);
    let { userAuth: { access_token } } = useContext(UserContext);
    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const fetchSharedUsers = (listId) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/lists/shared-users", { listId })
            .then(({ data: { sharedUsers } }) => {
                setSharedUsers(sharedUsers)
            })
            .catch(err => {
                console.log(err)
            })
    }

    useEffect(() => {
        if (access_token) {
            fetchSharedUsers(list._id)
        }
    }, [sharedUsers])


    return (
        <>
            <ul className="max-w-full pt-4 divide-gray dark:divide-gray-700" style={{ borderBottom: "1px solid rgb(243 243 255)" }}>
                <li className="pb-3 sm:pb-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className="flex-shrink-0">
                            {/* <img className="w-8 h-8 rounded-full hover:opacity-50 cursor-pointer" src={list.owner.personal_info.profile_img} alt="Owner Image" /> */}
                            <i class="fi fi-rr-list text-2xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">

                            <p className="font-medium text-dark-gray truncate capitalize">
                                <Link to={`/lists/${list._id}`} className='text-2xl hover:underline'>{list.name}</Link>
                            </p>
                            <p className="text-sm text-gray-500 truncate dark:text-gray">
                                {list.description}
                            </p>
                        </div>
                        <div className="inline-flex items-center text-base font-semibold text-gray">
                            {
                                list.visibility === 'private' ?
                                    <i className="fi fi-sr-lock text-sm dark:text-black"></i>
                                    :
                                    <>
                                        {
                                            isSharedList && < i className="fi fi-rr-share text-xl hover:text-twitter cursor-pointer"
                                                onClick={showDrawer}
                                            ></i>
                                        }
                                    </>


                            }
                            {
                                !isSharedList && <p className="text-sm text-gray-500 truncate dark:text-gray">
                                    Owned by: <span ><Link to={`/user/${list.owner.personal_info.username}`} className='underline truncate capitalize text-sm'>{list.owner.personal_info.fullname}</Link></span> 
                                </p>
                            }
                        </div>
                    </div>
                </li>
            </ul >
            <Drawer
                title="Search user to share with"
                placement="right"
                onClose={onClose}
                open={open}
                key="right"
            >
                <div className='flex flex-col'>

                    <SearchBarDrawer setResults={setResults} />

                    <ul className="max-w-full pt-4 divide-gray dark:divide-gray-700" style={{ borderBottom: "1px solid rgb(243 243 255)" }}>
                        {results && results.length > 0 && <SearchResultsList results={results} listId={list._id} />}
                    </ul>

                    <div className='mt-6 '>
                        <div className=' p-2 flex border-b items-center'>
                            <Avatar.Group>
                                <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />
                                <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=4" />
                                <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=0" style={{ backgroundColor: '#1677ff' }} >T</Avatar>
                            </Avatar.Group>
                            &nbsp;
                            <p className="font-medium pl-2 text-dark-grey text-3xl truncate">
                                Shared users
                            </p>
                        </div>
                        <ul className="max-w-full pt-4 divide-gray" style={{ borderBottom: "1px solid rgb(243 243 255)" }}>
                            {
                                sharedUsers == null ? <Loader /> :
                                    sharedUsers.length ? <>
                                        {
                                            sharedUsers.map((user, i) => {
                                                return <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                                    <li className="pb-3 sm:pb-4 cursor-pointer">
                                                        <div
                                                            className="flex items-center space-x-4 rtl:space-x-reverse">
                                                            <div className="flex-shrink-0">
                                                                <img className="w-8 h-8 rounded-full hover:opacity-50 cursor-pointer" src={user.personal_info.profile_img} alt="Owner Image" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">

                                                                <p className="font-medium text-dark-gray truncate capitalize">
                                                                    {user.personal_info.fullname}
                                                                </p>
                                                                <p className="text-sm text-gray-500 truncate dark:text-gray">
                                                                    @{user.personal_info.username}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </li>
                                                </AnimationWrapper>;
                                            })
                                        }
                                    </>
                                        : <NoDataMessage message="No shared user found" />
                            }
                        </ul>
                    </div>

                </div>
            </Drawer>
        </>
    )
}

export default ListCard
