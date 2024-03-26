import axios from 'axios';
import React, { useEffect } from 'react'
import { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'

const LatestListCard = ({ list, access_token, blogId }) => {
    const [checked, setChecked] = useState(false);
    const handleCheckBlogInList = async (listId, blogId) => {
        try {
            const response = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/list/conatins-blog", { blogId, listId });
            setChecked(response.data.isBlogInList);
        } catch (error) {
            console.error('Error checking if blog is in list:', error);
        }
    };
    const handleAddBlogInList = (listId,_id) => {
        if (access_token) {

            console.log(_id, blogId)
            setChecked(preVal => !preVal);
            console.log("added in List")
            axios.put(import.meta.env.VITE_SERVER_DOMAIN + "/lists/add-blog-in-list", { listId, _id }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }).then(({ data }) => {
                toast.success(`${data.isBlogInTheList ? `Added in ${list.name}`  : `Removed from ${list.name}`}`)
            })
                .catch(err => {
                    toast.error(`Error`)
                    console.log(err);
                })
        }
        else {
            // not logged in
            toast.error("Please Login/Signup to Bookmark this Blog")
        }
    }

    useEffect(() => {
        if (access_token ) {
            handleCheckBlogInList(list._id, blogId)
        }
    }, [])


    return (
        <li className="p-2 whitespace-no-wrap text-sm text-dark-grey font-medium link " >
            <div className="px-2 py-1 flex justify-space-between">
                <div className="w-[90%]">
                    <label>
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={()=>handleAddBlogInList(list._id,blogId)}
                        />
                    </label>
                    &nbsp;
                    <span className='capitalize'>&nbsp;&nbsp;{list.name.length >  17 ? list.name.slice(0, 17) + '...' : list.name}</span>
                </div>
                {
                    list.visibility === 'private' ?
                        <i className="fi fi-sr-lock text-sm"></i>
                        : ""
                }
            </div>
        </li>
    )
}

export default LatestListCard

