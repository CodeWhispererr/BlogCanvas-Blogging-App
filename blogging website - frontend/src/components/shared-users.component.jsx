import axios from 'axios'
import React, { useContext } from 'react'
import { Toaster, toast } from 'react-hot-toast'
const SharedUser = ({ user, loggedin_user, owner, listId, handleRemoveUser }) => {

    return (
        <div className='relative p-2 mt-2 mr-2 px-5 w-full inline-block hover:bg-opacity-50 pr-10 border'>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="notification-toast"
            />
            <p className='outline-none capitalize'
            >{user.personal_info.fullname} <span className='text-sm text-dark-grey'>@{user.personal_info.username}</span>
            </p>
            <button className='mt-[2px] absolute right-3 top-1/2 -translate-y-1/2'
                onClick={() => handleRemoveUser(user.personal_info.username, listId)}
            >
                {
                    loggedin_user === owner ?
                        <i className='fi fi-br-cross text-sm pointer-events-none'></i>
                        :
                        ""
                }

            </button>
        </div>

    )
}

export default SharedUser
