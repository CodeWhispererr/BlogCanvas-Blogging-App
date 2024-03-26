import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast'
const ShareButton = () => {


  const [isIconChanged, setIconChanged] = useState(false);

  const handleClick = () => {
    setIconChanged(true);

    // Revert the icon after 2 seconds
    setTimeout(() => {
      setIconChanged(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link Copied")
    handleClick();
  };

  const shareOnTwitter = () => {
    const tweetText = 'Check out this awesome blog post!';
    const tweetUrl = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
    window.open(twitterUrl, '_blank');
  };



  return (
    <div className="relative inline-block">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName="notification-toast"
      />

      <li className="relative px-1 pr-7 py-2 group md:mb-0" >
        <a className="font-semibold whitespace-no-wrap text-gray hover:text-blue-800"><i className="fi fi-rr-share text-xl hover:text-twitter"></i>
        </a>
        <ul className="absolute right-0 top-0 mt-8 p-2 w-[200px] shadow-lg bg-white z-10 hidden group-hover:block">
          <li className="p-3 whitespace-no-wrap  text-sm md:text-base link " onClick={copyToClipboard}>
            <button  className="px-2 py-1" >
              <span className="">
                {
                  isIconChanged ?
                    <>
                      <i className="fa-regular fa-circle-check text-xl mr-2" style={{ color: "#63E6BE" }}></i>
                      &nbsp; <span style={{ color: "#63E6BE" }}>Copied 😉</span>
                    </>
                    :

                    <>
                      <i className="fi fi-rr-clipboard-list text-xl hover:text-twitter mr-2"></i>
                      &nbsp; Copy Link
                    </>

                }

              </span>
            </button>
          </li>
          <li className="p-3 whitespace-no-wrap  text-sm md:text-base text-dark-gray link  hover:text-twitter">
            <button onClick={shareOnTwitter} className="px-2 py-1" href="#">
              <span> <i className='fi fi-brands-twitter text-xl hover:text-twitter mr-2 '></i>  Share on twitter</span>
            </button>
          </li>
        </ul>
      </li>




    </div>
  );
};

export default ShareButton;

