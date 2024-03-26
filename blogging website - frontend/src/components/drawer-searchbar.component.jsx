import axios from 'axios';
import React, { useState,useContext } from 'react'
import { UserContext } from '../App';

const SearchBarDrawer = ({ setResults }) => {

    const [input, setInput] = useState("");
    let { userAuth: { access_token } } = useContext(UserContext);

    const fetchData = (value) => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/all-users",{
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then((response) => {
                const users = response.data.users; 
                const results = users.filter((user) => (
                    value && user.personal_info && user.personal_info.username &&
                    user.personal_info.username.toLowerCase().includes(value.toLowerCase()) || value && user.personal_info && user.personal_info.fullname &&
                    user.personal_info.fullname.toLowerCase().includes(value.toLowerCase())
                ));

                setResults(results);
            })
            .catch((error) => {
                console.error("Error fetching users:", error);
            });


    };

    const handleChange = (value) => {
        setInput(value);
        fetchData(value);
    };
    return (
        <div className='h-[50%]' >
            <div className={"bg-white relative w-full md:w-auto md:show "}>
                <input
                    type="text"
                    placeholder="Search user @username"
                    className="w-full bg-grey p-4 pr-[12%] placeholder:text-dark-grey md:pl-12"
                    onChange={(e) => handleChange(e.target.value)}
                />
                <i className="fi fi-rr-search absolute right-[5%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
            </div>
        </div>
    )
}

export default SearchBarDrawer
