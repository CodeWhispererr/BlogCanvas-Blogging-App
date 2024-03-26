import React, { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import AnimationWrapper from '../common/page-animation'
import Loader from '../components/loader.component'
import { UserContext } from '../App'
import AboutUser from '../components/about.component'
import InPageNavigation from '../components/inpage-navigation.component'
import BlogPostcard from '../components/blog-post.component'
import NoDataMessage from '../components/nodata.component'
import PageNotFound from './404.page'
import ListOwner from '../components/list-owner.component'
import { Avatar } from 'antd';
import { Toaster, toast } from 'react-hot-toast'
import SharedUser from '../components/shared-users.component'

export const profileDataStructure = {


    name: "My List 1",
    owner: {
        personal_info: {
            fullname: "",
            email: "",
            username: "",
            profile_img: ""
        }
    },
    description: "",
    blogs: [],
    sharedWith: [],
    visibility: ""
}

const ListBlogs = () => {

    let { id: listId } = useParams();
    let [loading, setLoading] = useState(true);
    let [blogs, setBlogs] = useState(null);
    let [list, setList] = useState(null);
    let [sharedWith, setSharedWith] = useState(null);
    let [profileLoaded, setProfileLoaded] = useState("");

    let { userAuth: { username } } = useContext(UserContext);

    const fetchList = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/list/blogs", {
            listId
        })
            .then(({ data: { list } }) => {

                setList(list);
                setBlogs(list.blogs)
                setSharedWith(list.sharedWith)
                setLoading(false);
            })
            .catch(err => {
                console.log(err)
            })
    }

    const handleRemoveUser = (username, listId) => {
        let loadingToast = toast.loading("Removing...");
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/list/remove-shared-user-from-list", {
            listId,
            username
        })
            .then(({ data }) => {
                fetchList()
                toast.dismiss(loadingToast);
                toast.success("Removed");
            })
            .catch(err => {
                console.log(err)
            })
    }

    useEffect(() => {
        fetchList();
    }, [])


    const resetStates = () => {
        setProfileLoaded("")
        setLoading(true)
    }

    return (
        <AnimationWrapper>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="notification-toast"
            />
            {
                loading ? <Loader /> :
                    list !== null ?
                        <section className='h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12'>
                            <div className='flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-1 md:border-grey md:top-[100px]  md:py-10'>

                                <h1 className='font-medium pl-2 text-dark-grey text-3xl truncate border'><i className="fi fi-rr-ballot text-2xl"></i> {list.name}</h1>
                                <div className='flex items-center justify-items-center'>
                                    <p className='text-xl capitalize pr-3'>List Owner is {list.owner.personal_info.fullname} </p>
                                    <img src={list.owner.personal_info.profile_img} className='w-6 h-6 bg-grey rounded-full' />
                                </div>


                                <div className='flex flex-col'>

                                    <p className='pr-3 font-medium'>Description:</p>
                                    <p className='pr-3'>{list.description} </p>
                                </div>
                                <div className='flex flex-col gap-4 mt-2'>
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
                                    <div>
                                        {
                                            sharedWith.length ?
                                                sharedWith.map((user, i) => {
                                                    return <AnimationWrapper
                                                        key={i}
                                                        transition={{
                                                            duration: 1,
                                                            delay: i * 0.1
                                                        }}
                                                    >
                                                        <SharedUser user={user} loggedin_user={username} listId={listId} handleRemoveUser={handleRemoveUser} owner={list.owner.personal_info.username} />
                                                    </AnimationWrapper>
                                                })
                                                :
                                                <NoDataMessage message="No Shared Users" />
                                        }
                                    </div>

                                </div>
                            </div>

                            <div className='max-md:mt-12 w-full'>
                                <InPageNavigation routes={[`${list.name} Blogs`, "List Description"]} defaultHidden={["List Description"]}>
                                    <>
                                        {
                                            blogs == null ? (
                                                <Loader />)
                                                :
                                                (
                                                    blogs.length ?
                                                        blogs.map((blog, i) => {
                                                            return <AnimationWrapper
                                                                key={i}
                                                                transition={{
                                                                    duration: 1,
                                                                    delay: i * 0.1
                                                                }}
                                                            >
                                                                <BlogPostcard
                                                                    content={blog}
                                                                    author={
                                                                        blog.author.personal_info
                                                                    }
                                                                />
                                                            </AnimationWrapper>
                                                        })
                                                        :
                                                        <NoDataMessage message="No Blogs Added to the List" />
                                                )

                                        }
                                        {/* <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} /> */}
                                    </>
                                    <ListOwner />

                                </InPageNavigation>
                            </div>
                        </section>
                        :
                        <PageNotFound />

            }
        </AnimationWrapper>

    )
}

export default ListBlogs;
