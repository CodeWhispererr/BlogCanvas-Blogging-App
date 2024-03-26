import React from 'react'
import AnimationWrapper from '../common/page-animation';
import NoDataMessage from './nodata.component';
import { toast } from 'react-hot-toast'
import axios from 'axios';

const SearchResultsList = ({ results, listId }) => {

    const handleAddUser = (userId, listId) => {
        let loadingToast = toast.loading("Adding User...");
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/add-user-to-list", { listId, userId })
            .then(({response}) => {
                console.log(response)
                toast.dismiss(loadingToast);
                toast.success("Added 💐");

            })
            .catch(({ response }) => {
                toast.dismiss(loadingToast)
                return toast.error(response.data.error);
            })
    }

    return (
        <div className="results-list">
            {
                results == null ? <Loader /> :
                    results.length ? <>
                        {
                            results.map((result, i) => {
                                return <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                    <li
                                        
                                        className="pb-3 sm:pb-4 cursor-pointer">
                                        <div
                                        onClick={() => handleAddUser(result._id, listId)}
                                         className="flex items-center space-x-4 rtl:space-x-reverse">
                                            <div className="flex-shrink-0">
                                                <img className="w-8 h-8 rounded-full hover:opacity-50 cursor-pointer" src={result.personal_info.profile_img} alt="Owner Image" />
                                            </div>
                                            <div className="flex-1 min-w-0">

                                                <p className="font-medium text-dark-gray truncate capitalize">
                                                    {result.personal_info.fullname}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate dark:text-gray">
                                                    @{result.personal_info.username}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                </AnimationWrapper>;
                            })
                        }
                    </>
                        : <NoDataMessage message="No user found" />
            }
        </div>
    )
}

export default SearchResultsList
