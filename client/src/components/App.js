import React, { Suspense } from 'react';
import { Route, Switch, withRouter } from "react-router-dom";
import Auth from "../hoc/auth";
// pages for this product
import LandingPage from "./views/LandingPage/LandingPage.js";
import LoginPage from "./views/LoginPage/LoginPage.js";
import RegisterPage from "./views/RegisterPage/RegisterPage.js";
import ChatPage from "./views/ChatPage/ChatPage";
import CreateBlogPage from "./views/CreateBlog/NewBlog";
import EditBlogPage from "./views/CreateBlog/EditBlog";
import BlogsPage from "./views/BlogsPages/Blogs";
import BlogDetailsPage from "./views/BlogsPages/BlogDetails";
import NavBar from "./views/NavBar/NavBar";
import Footer from "./views/Footer/Footer"
import UserProfile from './views/Profile/userProfile';

function App(props) {
  const currRoute = props.location.pathname;
  return (
    <Suspense fallback={(<div>Loading...</div>)}>
      { currRoute!=='/chat' && <NavBar />}
      <div className="content_wrapper" style={{ paddingTop: `${currRoute!=='/chat'?'45px':'0px'}`, minHeight: `${currRoute!=='/chat'&&'calc(100vh - 80px)'}` }}>
        <Switch>
          <Route exact path="/" component={Auth(LandingPage, null)} />
          <Route exact path="/chat" component={Auth(ChatPage, null)} />
          <Route exact path="/postnewblog" component={Auth(CreateBlogPage, null)} />
          <Route exact path="/editmyblog/:blogId" component={Auth(EditBlogPage, null)} />
          <Route exact path="/blogs" component={Auth(BlogsPage, null)} />
          <Route exact path="/blog/:id" component={Auth(BlogDetailsPage, null)} />
          <Route exact path="/myProfile" component={Auth(UserProfile, null)} />
          <Route exact path="/login" component={Auth(LoginPage, false)} />
          <Route exact path="/register" component={Auth(RegisterPage, false)} />
        </Switch>
      </div>
      {/* <Footer /> */}
    </Suspense>
  );
}

export default withRouter(App);
