/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Menu, message, Avatar, Image } from 'antd';
import axios from 'axios';
import { USER_SERVER } from '../../../Config';
import { NavLink, withRouter } from 'react-router-dom';
import { useSelector } from "react-redux";

function RightMenu(props) {
  const user = useSelector(state => state.user)

  const logoutHandler = () => {
    axios.get(`${USER_SERVER}/logout`).then(response => {
      if (response.status === 200) {
        props.history.push("/login");
      } else {
        message.error('Log Out Failed')
      }
    });
  };

  const myProfile = () => {
    props.history.push("/myProfile");
  };

  if (user.userData && !user.userData.isAuth) {
    return (
      <Menu mode={props.mode}>
        <Menu.Item key="mail">
          <NavLink to="/login">Signin</NavLink>
        </Menu.Item>
        <Menu.Item key="app">
          <NavLink to="/register">Signup</NavLink>
        </Menu.Item>
      </Menu>
    )
  } else {
    return (
      <Menu mode={props.mode}>
        <Menu.Item key="profile">
          <a onClick={myProfile}> <Avatar src={user.userData && user.userData.image} /> {user.userData && user.userData.name} </a>
        </Menu.Item>
        <Menu.Item key="logout">
          <a onClick={logoutHandler}>Logout</a>
        </Menu.Item>
      </Menu>
    )
  }
}

export default withRouter(RightMenu);

