import axios from 'axios';
import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../App';
import { filterPaginationData } from '../common/filter-pagination-data';
import { Toaster } from 'react-hot-toast';
import InPageNavigation from '../components/inpage-navigation.component';
import Loader from '../components/loader.component';
import NoDataMessage from '../components/nodata.component';
import AnimationWrapper from '../common/page-animation';
import LoadMoreDataBtn from '../components/load-more.component';
import { useSearchParams } from 'react-router-dom';
import ManageBookmarkedBlogCard from '../components/manage-bookmarkedblogcard.component';
import ListCard from '../components/list-card.component';


const Library = () => {
    let { userAuth: { access_token } } = useContext(UserContext);
    const [blogs, setBlogs] = useState(null);
    const [lists, setLists] = useState(null);
    const [query, setQuery] = useState("");
    const [sharedLists,setSharedLists]=useState([])

    let activeTab = useSearchParams()[0].get("tab");

    const getBlogs = ({ page }) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/bookmarked-blogs", {
            page, query
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then(async ({ data }) => {
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.bookmarks,
                    page,
                    user: access_token,
                    countRoute: "/user-bookmarked-blogs-count",
                    data_to_send: { query }
                })
                console.log(formatedData)
                setBlogs(formatedData)
            })
            .catch(err => {
                console.log(err)
            })

    }

    const handleSearch = (e) => {
        let searchQuery = e.target.value;
        setQuery(searchQuery);

        if (e.keyCode == 13 && searchQuery.length) {
            setBlogs(null);
        }

    }
    const handleChange = (e) => {
        if (!e.target.value.length) {
            setQuery("");
            setBlogs(null);
        }
    }

    useEffect(() => {
        if (access_token) {
            if (blogs == null) {
                getBlogs({ page: 1 })
            }

            axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/all-lists", {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
                .then(({ data: { latestTwoLists } }) => {
                    setLists(latestTwoLists)
                })
                .catch(err => {
                    console.log(err)
                })
            axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/shared-lists", {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
                .then(({ data: { lists } }) => {
                    setSharedLists(lists)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    }, [access_token, blogs, query,lists])

    return (
        <>
            <h1 className='max-md:hidden'>Your Library</h1>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="notification-toast"
            />

            <div className='relative max-md:mt-5 md:mt-8 mb-10'>
                <input type="search"
                    className='w-full bg-grey p-4 rounded-full pl-12 pr-6 placeholder:text-dark-grey'
                    placeholder='Search in bookmarked blogs'
                    onChange={handleChange}
                    onKeyDown={handleSearch}
                />
                <i className='fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey'></i>
            </div>

            <InPageNavigation routes={["Bookmarks", "Your-Lists","Shared-lists"]} defaultActiveIndex={activeTab !== 'Bookmarks' ? 0 : 1}>
                {
                    blogs == null ? <Loader /> :
                        blogs.results.length ?
                            <>
                                {
                                    blogs.results.map((blog, i) => {
                                        return <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>

                                            <ManageBookmarkedBlogCard blog={{ ...blog, index: i, setStateFun: setBlogs }} index={i + 1} />

                                        </AnimationWrapper>
                                    })
                                }

                                <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs}
                                />
                            </>
                            :
                            <NoDataMessage message="No published blogs" />
                }
                {
                    
                    lists == null ? <Loader /> :
                        lists.length ?
                            <>
                                {
                                    lists.map((list, i) => {
                                        return <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                            <ListCard  key={list._id} list={list}/>

                                        </AnimationWrapper>
                                    })
                                }
                            </>
                            :
                            <NoDataMessage message="No Lists created" />
                }
                {
                    
                    sharedLists == null ? <Loader /> :
                        sharedLists.length ?
                            <>
                                {
                                    sharedLists.map((list, i) => {
                                        return <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                            <ListCard  key={list._id} list={list} isSharedList={false}/>

                                        </AnimationWrapper>
                                    })
                                }
                            </>
                            :
                            <NoDataMessage message="No shared Lists " />
                }
            </InPageNavigation>
        </>
    )
}

export default Library
