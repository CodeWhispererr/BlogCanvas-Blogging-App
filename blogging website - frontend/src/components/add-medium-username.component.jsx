import React, { useContext, useEffect, useState } from 'react'
import { Modal } from 'antd';
import { UserContext } from '../App';

const AddMediumUsername = ({uname,setUname,handleSubmit}) => {

    let { userAuth: { access_token } } = useContext(UserContext);
    const [open, setOpen] = useState(false);

 const handleChange = (e) => {
        setUname(e.target.value);
        console.log(uname)
    }

    const handleKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    }

   
    
    return (
        <>
            <div className='flex justify-center'>

                <button className='btn-dark border-radius-0 '
                    onClick={() => {
                        if (access_token) {
                            setOpen(true)
                        }
                        else {
                            toast.error("Please login to add")
                        }
                    }}
                >Please Add your medium username
                </button>

                <Modal
                    title="Write here"
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
                        <div className="relative h-11 w-full min-w-[200px] ">
                            <input
                                value={uname}
                                onChange={(e) => handleChange(e)}
                                onKeyDown={(e) => handleKeyDown(e)}
                                placeholder="username"
                                className="peer h-full w-[250px] border-b ml-9 border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-gray-900 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50" />
                            <i className="fi fi-rr-at input-icon pt-3"></i>
                        </div>
                        <div className="relative h-11 w-[250px] min-w-[20px]">
                            <p className='mt-1 text-red text-sm text-right'>
                                *Once set can't be modified. Be Careful!!
                            </p>
                        </div>

                    </form>

                </Modal>


            </div>
        </>
    )
}

export default AddMediumUsername
