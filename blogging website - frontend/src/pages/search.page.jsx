import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import InPageNavigation from '../components/inpage-navigation.component';
import Loader from '../components/loader.component';
import AnimationWrapper from '../common/page-animation';
import BlogPostcard from '../components/blog-post.component';
import LoadMoreDataBtn from '../components/load-more.component';
import axios from 'axios';
import { filterPaginationData } from '../common/filter-pagination-data';
import NoDataMessage from '../components/nodata.component';
import UserCard from '../components/usercard.component';
const SearchPage = () => {
    let { query } = useParams();
    let [blogs, setBlog] = useState(null)
    let [users, setUsers] = useState(null)


    const SearchBlogs = ({ page = 1, create_new_arr = false }) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", { query, page })
            .then(async ({ data }) => {
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: {
                        query
                    },
                    create_new_arr
                })
                setBlog(formatedData);
            })
            .catch(err => {
                toast.error("Error in Searching");
            })
    }

    const fetchUsers = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-users", { query })
            .then(({ data: { users } }) => {
                setUsers(users)
            })
    }

    useEffect(() => {
        resetState();
        SearchBlogs({ page: 1, create_new_arr: true })
        fetchUsers();
    }, [query])


    const resetState = () => {
        setBlog(null);
        setUsers(null);
    }

    const UserCardWrapper = () => {
        return (
            <>
                {
                    users == null ? <Loader /> :
                        users.length ?
                            users.map((user, i) => {
                                return <AnimationWrapper
                                    key={i}
                                    transition={{ duration: 1, delay: i * 0.08 }}
                                >
                                    <UserCard user={user}/>
                                </AnimationWrapper>
                            })
                            :
                            <NoDataMessage message="No Users Found" />

                }
            </>
        )
    }

    return (
        <section className='h-cover flex justify-center gap-10 '>

            <div className='w-full'>
                <InPageNavigation routes={[`Search Results from "${query}"`, "Accounts Matched"]} defaultHidden={["Accounts Matched"]}>
                    <>
                        {
                            blogs == null ? (
                                <Loader />)
                                :
                                (
                                    blogs.results.length ?
                                        blogs.results.map((blog, i) => {
                                            return <AnimationWrapper
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
                        <LoadMoreDataBtn state={blogs} fetchDataFun={SearchBlogs} />
                    </>

                    <UserCardWrapper />
                </InPageNavigation>
            </div>

            <div className='min-w-[40%] lg:min-w-[350px] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden'>
                    
                    <h1 className='font-medium text-xl mb-8 '>User Related To Search <i className='fi fi-rr-user mt-1'></i> </h1>
                    <UserCardWrapper />
            </div>

        </section>
    )
}

export default SearchPage;
