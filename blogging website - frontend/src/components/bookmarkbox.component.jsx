import React, { useEffect, useState ,useContext} from 'react';
import { Toaster, toast } from 'react-hot-toast'
import { Modal } from 'antd';
import axios from "axios";
import LatestListCard from './latest-list-card.component';
import Loader from './loader.component';
import AnimationWrapper from '../common/page-animation';
import NoDataMessage from './nodata.component';
import { BlogContext } from '../pages/blog.page'

const listStructure = {
    name: '',
    description: ''
}

const BookmarkBox = ({ _id, access_token }) => {

    let {isBookmarked,setIsBookmarked} = useContext(BlogContext);
    
    const [open, setOpen] = useState(false);
    const [list, setList] = useState(listStructure);
    const [privateList, setPrivateList] = useState(false);
    const [latestTwoLists, setLatestTwoLists] = useState(null);


    const { name, description } = list;
    let desLimit = 100;
    let listNameLimit = 30;


    const handleVisibilityChange = () => {
        setPrivateList((prev) => !prev)
    }
    const handleNameChange = (e) => {
        let input = e.target;
        setList({ ...list, name: input.value })
    }
    const handleDesChange = (e) => {
        let input = e.target;
        setList({ ...list, description: input.value })
    }

    const handleKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.length) {
            return toast.error("List name can not be empty")
        }
        console.log(list)
        let loadingToast = toast.loading("Creating...");
        e.target.classList.add('disable');
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-list", { ...list }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then(() => {
                e.target.classList.remove('disable');
                toast.dismiss(loadingToast);
                toast.success("Created 💐");
                setList({ ...list, name: '', description: '' });

            })
            .catch(({ response }) => {
                e.target.classList.remove('disable');
                toast.dismiss(loadingToast)
                return toast.error(response.data.error);
            })

    }


    useEffect(() => {

        if (privateList) {
            setList({ ...list, visibility: 'private' })
        }
        if (access_token) {
            axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/all-lists", {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
                .then(({ data: { latestTwoLists } }) => {
                    setLatestTwoLists(latestTwoLists)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    }, [latestTwoLists, privateList])

    const handleBookmark = () => {
        if (access_token) {

            setIsBookmarked(preVal => !preVal);
            console.log(isBookmarked)

            axios.put(import.meta.env.VITE_SERVER_DOMAIN + "/bookmark", { _id }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }).then(({ data }) => {
                toast.success(`${data.isBookmarked ? "Bookmarked" : "Unbookmarked"}`)
                console.log(data);
            })
                .catch(err => {
                    toast.error("Error Bookmarking this Blog")
                    console.log(err);
                })
        }
        else {
            toast.error("Please Login/Signup to Bookmark this Blog")
        }
    }
    useEffect(() => {
        setList({ ...listStructure });
        setPrivateList(false);
    }, [open])


    return (
        <div className="relative inline-block">
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="notification-toast"
            />

            <li className="relative px-1 py-2 group" >
                <a className="font-semibold text-gray hover:text-blue-800 relative" onClick={handleBookmark} >

                    {
                        isBookmarked ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="pb"><path d="M7.5 3.75a2 2 0 0 0-2 2v14a.5.5 0 0 0 .8.4l5.7-4.4 5.7 4.4a.5.5 0 0 0 .8-.4v-14a2 2 0 0 0-2-2h-9z" fill="#000"></path></svg>
                            :
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="bi bi-bookmark-plus"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"
                                />
                                <path
                                    d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"
                                />
                            </svg>
                    }

                </a>
                <ul className="absolute bookmarkdropdown mt-9 p-2 w-[240px] shadow-lg bg-white z-10 hidden group-hover:block left-1/2 transform -translate-x-1/2">
                    <li className="p-2 whitespace-no-wrap text-sm text-black font-semibold link " >
                        <button className="px-2 py-1" >
                            <span className="">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isBookmarked}
                                        onClick={handleBookmark}
                                    />
                                </label>
                                &nbsp; <span >Reading List</span>
                            </span>
                        </button>
                    </li>

                    {
                        latestTwoLists == null ? (
                            <Loader />)
                            :
                            (
                                latestTwoLists.length ?
                                    latestTwoLists.map((list, i) => {
                                        return <AnimationWrapper
                                            key={i}
                                            transition={{
                                                duration: 1,
                                                delay: i * 0.1
                                            }}
                                        >
                                            <LatestListCard
                                                list={list}
                                                blogId={_id}
                                                access_token={access_token}
                                            />
                                        </AnimationWrapper>
                                    })
                                    :
                                    <NoDataMessage message="No Lists Created" />
                            )

                    }


                    <hr className='mt-2' />
                    <li className="p-1 pl-0 whitespace-no-wrap text-sm md:text-base text-green cursor-pointer" >

                        <div className='flex items-center justify-items-center h-full'
                            onClick={() => setOpen(true)}
                        >
                            <i className="fi fi-rr-plus-small text-2xl pt-[4px]"></i>
                            &nbsp;Create new List
                        </div>

                        <Modal
                            title="Create new list"
                            centered
                            open={open}
                            onOk={(e) => {
                                setOpen(false);
                                handleSubmit(e);
                            }}
                            onCancel={() => setOpen(false)}
                            width={1000}
                        >
                            <form className='ml-10 mr-10'>
                                <div className="relative h-11 w-full min-w-[200px]">
                                    <input
                                        value={name}
                                        onChange={handleNameChange}
                                        onKeyDown={handleKeyDown}
                                        maxLength={listNameLimit}
                                        placeholder="Give it a name"
                                        className="peer h-full w-[200px] border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-gray-900 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50" />
                                    <p className='mt-1 text-dark-grey text-sm text-right'>{name.length}/{listNameLimit}</p>
                                </div>
                                <br />
                                <div className="relative h-11 w-full min-w-[200px]">
                                    <input
                                        value={description}
                                        onChange={handleDesChange}
                                        onKeyDown={handleKeyDown}
                                        maxLength={desLimit}
                                        placeholder="Add a description"
                                        className="peer h-full w-[200px] border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-gray-900 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50" />
                                </div>
                                <p className='mt-1 text-dark-grey text-sm text-right'>{description.length}/{desLimit}</p>
                                <br />
                                <div className="px-2 py-1">
                                    <span className="flex justify-content-center">
                                        <label className='pt-[1px]'>
                                            <input
                                                type="checkbox"
                                                checked={privateList}
                                                onChange={handleVisibilityChange}
                                            />
                                        </label>
                                        &nbsp;
                                        <span className='font-bold'>Make it private</span>
                                    </span>
                                </div>

                            </form>

                        </Modal>

                    </li>
                </ul>
            </li >
        </div >
    );
};

export default BookmarkBox;

