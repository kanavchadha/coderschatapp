import React from 'react';
import { NavLink, withRouter } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu, message } from 'antd';
const SubMenu = Menu.SubMenu;

function LeftMenu(props) {
  const user = useSelector(state => state.user);

  const myChats = () => {
    if (user.userData && !user.userData.isAuth) {
      message.error('Please Login First!');
      props.history.push('/login');
    }else{
      props.history.push("/chat");
    }
  }

  return (
    <Menu mode={props.mode}>
      <Menu.Item key="mail">
        <NavLink to="/">Home</NavLink>
      </Menu.Item>
      <Menu.Item key="chat">
        <a onClick={myChats}>Chat</a>
      </Menu.Item>
      <SubMenu title={<span>Blogs</span>}>
        <Menu.Item key="setting:1"><NavLink to="/blogs">All Blogs</NavLink></Menu.Item>
        <Menu.Item key="setting:2"><NavLink to="/postnewblog">Write a Blog</NavLink></Menu.Item>
      </SubMenu>
    </Menu>
  )
}

export default withRouter(LeftMenu);