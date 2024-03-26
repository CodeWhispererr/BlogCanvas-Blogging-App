// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider,getAuth, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "blogcanvas-blog-website.firebaseapp.com",
  projectId: "blogcanvas-blog-website",
  storageBucket: "blogcanvas-blog-website.appspot.com",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


//googleAuth
const provider=new GoogleAuthProvider();

const auth=getAuth()

export const authWithGoogle=async ()=>{
    let user=null;
    await signInWithPopup(auth,provider)
    .then((result)=>{
        user=result.user
    })
    .catch((err)=>{
        console.log(err)
    })

    return user;
}
