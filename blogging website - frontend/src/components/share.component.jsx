import React, { useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast'
const ShareButton = () => {
  const shareBoxRef = useRef(null);

  const openShareBox = () => {
    shareBoxRef.current.classList.toggle('hidden');
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link Copied")
    openShareBox(); // Close the share box after copying the link.
  };

  const shareOnTwitter = () => {
    const tweetText = 'Check out this awesome blog post!';
    const tweetUrl = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
    window.open(twitterUrl, '_blank');
    openShareBox(); // Close the share box after sharing on Twitter.
  };

  return (
    <div className="relative inline-block">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName="notification-toast"
      />



      {/* <button
        onClick={openShareBox}
        className="text-black bg-transparent px-4 rounded-full"
      >
        <i className="fi fi-rr-share text-xl hover:text-twitter"></i>
      </button>
      <div
        ref={shareBoxRef}
        className="hidden fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="bg-white rounded-lg p-3">
          <p className='text-2xl font-medium'>Share this Blog <i className="fi fi-sr-share text-xl hover:text-twitter"></i></p>
          <hr className='border-grey my-2' />

          <button
            onClick={shareOnTwitter}
            className="text-blue-400 hover:text-blue-500 mr-4 flex items-center"
          >
            <i className='fi fi-brands-twitter text-xl hover:text-twitter mr-2 '></i>
            <p className='hover:text-twitter'> Share on Twitter</p>

          </button>
          <hr className='border-grey my-2' />
          <button
            onClick={copyToClipboard}
            className="text-gray-500 hover:text-gray-600 flex items-center"
          >
            <i className="fi fi-rr-clipboard-list text-xl hover:text-twitter mr-2"></i>
            <p className='hover:text-twitter'> Copy Link</p>
          </button>
          <hr className='border-grey my-2' />
        </div>
      </div> */}




      <button id="dropdownDelayButton" data-dropdown-toggle="dropdownDelay" data-dropdown-delay="200" data-dropdown-trigger="hover" className="text-black font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center" type="button"><i className="fi fi-rr-share text-xl hover:text-twitter"></i>
      </button>

      <div id="dropdownDelay" className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDelayButton">
          <li>
            <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
          </li>
          <li>
            <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
          </li>
          <li>
            <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
          </li>
          <li>
            <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
          </li>
        </ul>
      </div>




    </div>
  );
};

export default ShareButton;

