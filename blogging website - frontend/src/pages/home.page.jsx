import React, { useEffect } from 'react'
import AnimationWrapper from '../common/page-animation'
import InPageNavigation from '../components/inpage-navigation.component'
import axios from "axios"
import { Toaster, toast } from 'react-hot-toast'
import { useState } from 'react'
import Loader from '../components/loader.component'
import BlogPostcard from '../components/blog-post.component'
import MinimalBlogPost from '../components/nobanner-blog-post.component'
import { activeTabRef } from '../components/inpage-navigation.component'
import NoDataMessage from '../components/nodata.component'
import { filterPaginationData } from '../common/filter-pagination-data'
import LoadMoreDataBtn from '../components/load-more.component'
const HomePage = () => {

    let [blogs, setBlog] = useState(null);

    let [trendingBlogs, setTrendingBlog] = useState(null);
    let [pageState, setPageState] = useState("home")

    let categories = ["programming", "hollywood", "film making", "social media", "cooking", "wallpaper"]

    const fetchLatestBlogs = ({ page = 1 }) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs", { page })
            .then(async ({ data }) => {
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/all-latest-blogs-count"
                })
                setBlog(formatedData);
            })
            .catch(err => {
                toast.error("Error in fetching latest blogs");
            })
    }

    const fetchTrendingBlogs = (() => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
            .then(({ data }) => {
                setTrendingBlog(data.blogs)
            })
            .catch(err => {
                toast.error("Error in fetching Trending blogs");
            })
    })

    const loadBlogByCategory = (e) => {
        let category = e.target.innerText.toLowerCase();

        setBlog(null);
        if (pageState === category) {
            setPageState("home");
            return;
        }
        setPageState(category)
    }

    const fetchBlogsByCategory = ({ page = 1 }) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", { tag: pageState, page })
            .then(async ({ data }) => {
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { tag: pageState }
                })
                setBlog(formatedData);
            })
            .catch(err => {
                toast.error("Error in fetching Trending blogs");
            })
    }

    useEffect(() => {
        activeTabRef.current.click();
        if (pageState == "home") {
            fetchLatestBlogs({ page: 1 });
        } else {
            fetchBlogsByCategory({ page: 1 });
        }
        if (!trendingBlogs) {
            fetchTrendingBlogs();
        }
    }, [pageState]);



    return (
        <AnimationWrapper>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="notification-toast"
            />
            <section className='h-cover flex justify-center gap-10'>
                {/* Latest Blogs */}
                <div className='w-full'>

                    <InPageNavigation routes={[pageState, "trending blogs"]} defaultHidden={["trending blogs"]}>
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
                            <LoadMoreDataBtn state={blogs} fetchDataFun={(pageState == "home" ? fetchLatestBlogs : fetchBlogsByCategory)} />
                        </>
                        <>
                            {
                                trendingBlogs == null ?
                                    <Loader />
                                    :
                                    (
                                        trendingBlogs.length ?
                                            trendingBlogs.map((blog, i) => {
                                                return <AnimationWrapper
                                                key={i}
                                                    transition={{
                                                        duration: 1,
                                                        delay: i * 0.1
                                                    }}>
                                                    <MinimalBlogPost
                                                        blog={blog}
                                                        index={i}
                                                    />
                                                </AnimationWrapper>

                                            })
                                            :
                                            <NoDataMessage message="No trending blogs found" />
                                    )
                            }
                        </>
                    </InPageNavigation>

                </div>
                {/* filters and trending blogs */}
                <div className="min-w-[40px] lg:min-w-[400px] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-semibold text-xl mb-8 ">Explore what is important to you</h1>

                            <div className='flex gap-3 flex-wrap'>
                                {
                                    categories.map((category, i) => {
                                        return <button
                                            onClick={loadBlogByCategory}
                                            className={"tag " + (pageState === category ? "bg-black text-white " : " ")} key={i}>
                                            {category}
                                        </button>
                                    })
                                }
                            </div>

                        </div>

                        <div >
                            <h1 className='font-semibold text-xl mb-8'>Trending <i className='fi fi-rr-arrow-trend-up'></i></h1>

                            {
                                trendingBlogs == null ?
                                    <Loader /> :
                                    (
                                        trendingBlogs.length ?
                                            trendingBlogs.map((blog, i) => {
                                                return <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                                    <MinimalBlogPost blog={blog} index={i} />
                                                </AnimationWrapper>
                                            })
                                            :
                                            <NoDataMessage message="No trending blogs found" />
                                    )
                            }
                        </div>

                    </div>
                </div>
            </section>
        </AnimationWrapper>

    )
}

export default HomePage
