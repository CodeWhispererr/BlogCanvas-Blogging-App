import React, { useContext, useEffect, useState, createContext } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import AnimationWrapper from '../common/page-animation'
import Loader from '../components/loader.component'
import { UserContext } from '../App'
import AboutUser from '../components/about.component'
import { filterPaginationData } from '../common/filter-pagination-data'
import InPageNavigation from '../components/inpage-navigation.component'
import BlogPostcard from '../components/blog-post.component'
import NoDataMessage from '../components/nodata.component'
import LoadMoreDataBtn from '../components/load-more.component'
import PageNotFound from './404.page'
import MediumCard from '../medium_article/mediumcard.component'
import AddMediumUsername from '../components/add-medium-username.component'
import { Toaster, toast } from 'react-hot-toast'

export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: ""
    },
    account_info: {
        total_reads: 0,
        total_posts: 0
    },
    social_links: {},
    joinedAt: " "
}
export const profileContext = createContext({});

const ProfilePage = () => {
    const [articles, setArticles] = useState([]);
    let { id: profileId } = useParams();
    let [profile, setProfile] = useState(profileDataStructure);
    let [loading, setLoading] = useState(true);
    let [blogs, setBlogs] = useState(null);
    let [profileLoaded, setProfileLoaded] = useState("");
    let [isMediumUsernamePresent, setIsMediumUsernamePresent] = useState(false);
    const [uname, setUname] = useState("");

    let { personal_info: { fullname, username: profile_username, profile_img, bio }, account_info: {
        total_posts, total_reads
    }, social_links, joinedAt } = profile;


    let { userAuth: { username, access_token } } = useContext(UserContext);


    const getBlogs = ({ page = 1, user_id }) => {
        user_id = user_id == undefined ? blogs.user_id : user_id;
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
            author: user_id,
            page
        })
            .then(async ({ data }) => {
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: {
                        author: user_id
                    }
                })
                formatedData.user_id = user_id;
                setBlogs(formatedData)
            })
    }


    const fetchUserProfile = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
            username: profileId
        })
            .then(({ data: user }) => {
                if (user !== null) {
                    setProfile(user)
                }
                setProfileLoaded(profileId)
                getBlogs({ user_id: user._id })
                setLoading(false);
            })
            .catch(err => {
                console.log(err)
                setLoading(false)
            })

    }

    const handleSubmit = (e) => {
        if (access_token) {
            e.preventDefault();
            if (!uname.length) {
                return toast.error("username can not be empty")
            }
            let loadingToast = toast.loading("Adding...");
            e.target.classList.add('disable');
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/add-medium-username", { uname }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
                .then(({ data }) => {
                    e.target.classList.remove('disable');
                    toast.dismiss(loadingToast);
                    toast.success(data.message);
                    setUname("");
                    fetchMediumBlogs();
                })
                .catch(({ response }) => {
                    e.target.classList.remove('disable');
                    toast.dismiss(loadingToast)
                    return toast.error(response.data.error);
                })

        }


    }

    const fetchMediumBlogs = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/check-medium-username", {
            username: profileId
        })
            .then(({ data: { isMediumUsernameSet } }) => {
                if (isMediumUsernameSet) {
                    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/fetch-medium-username", {
                        username: profileId
                    })
                        .then(({ data: { mediumUsername } }) => {
                            fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${mediumUsername}`)
                                .then(res => res.json())
                                .then(data => {
                                    setArticles(data.items)
                                    setIsMediumUsernamePresent(true);
                                });
                        })
                        .catch(err => {
                            console.log(err);
                        })

                }
            })
            .catch(err => {

                console.log(err)
            })
    }

    useEffect(() => {
fetchMediumBlogs();
    }, []);


    useEffect(() => {
        if (profileId !== profileLoaded) {
            setBlogs(null);
        }
        if (blogs == null) {
            resetStates();
            fetchUserProfile();
        }
    }, [profileId, blogs])


    const resetStates = () => {
        setProfile(profileDataStructure);
        setProfileLoaded("")
        setLoading(true)
    }

    return (
        <profileContext.Provider value={{ profile }}>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="notification-toast"
            />
            <AnimationWrapper>
                {
                    loading ? <Loader /> :
                        profile_username.length ?
                            <section className='h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12'>

                                <div className='flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-1 md:border-grey md:top-[100px]  md:py-10'>

                                    <img src={profile_img} className='w-48 h-48 bg-grey rounded-full md:w-32 md:h-32' />

                                    <h1 className='text-2xl font-medium'>@{profile_username}</h1>

                                    <p className='text-xl capitalize h-6'>{fullname} </p>

                                    <p >{total_posts.toLocaleString()} Blogs- {total_reads.toLocaleString()} Reads</p>

                                    <div className='flex gap-4 mt-2'>

                                        {
                                            profileId == username ?
                                                <Link to="/settings/edit-profile"
                                                    className='btn-light rounded-md'
                                                >Edit Profile</Link> :
                                                " "
                                        }


                                    </div>

                                    <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} className="max-md:hidden" />
                                </div>

                                <div className='max-md:mt-12 w-full'>
                                    <InPageNavigation routes={["Blogs Published", "Medium Blogs", "About"]} defaultHidden={["About"]}>
                                        <>
                                            {
                                                blogs == null ? (
                                                    <Loader />)
                                                    :
                                                    (
                                                        blogs.results.length ?
                                                            blogs.results.map((blog, i) => {
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
                                                            <NoDataMessage message="No Blogs Published" />
                                                    )

                                            }
                                            <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} />
                                        </>
                                        <>

                                            {
                                                isMediumUsernamePresent ?
                                                    (articles == null ? (
                                                        <NoDataMessage message="No Blogs Published" />)
                                                        :
                                                        (
                                                            articles.length ?
                                                                articles.map((article, i) => {
                                                                    return <AnimationWrapper
                                                                        key={i}
                                                                        transition={{
                                                                            duration: 1,
                                                                            delay: i * 0.1
                                                                        }}
                                                                    >
                                                                        <MediumCard article={article}

                                                                        />
                                                                    </AnimationWrapper>
                                                                })
                                                                :
                                                                <NoDataMessage message="No Blogs Published" />
                                                        )) :

                                                    (

                                                        profileId == username ?
                                                            <AddMediumUsername uname={uname} setUname={setUname} handleSubmit={handleSubmit} />
                                                            :
                                                            <NoDataMessage message="The user did not provide their Medium username" />

                                                    )


                                            }
                                        </>
                                        <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />
                                    </InPageNavigation>

                                </div>

                            </section>
                            :
                            <PageNotFound />

                }
            </AnimationWrapper>
        </profileContext.Provider>
    )
}

export default ProfilePage
