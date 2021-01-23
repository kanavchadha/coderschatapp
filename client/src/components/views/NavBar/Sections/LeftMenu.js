import React from 'react';
import { NavLink} from "react-router-dom";
import { Menu } from 'antd';
const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

function LeftMenu(props) {
  return (
    <Menu mode={props.mode}>
    <Menu.Item key="mail">
      <NavLink to="/">Home</NavLink>
    </Menu.Item>
    <Menu.Item key="chat">
      <NavLink to="/chat">Chat</NavLink>
    </Menu.Item>
    <SubMenu title={<span>Blogs</span>}>
        <Menu.Item key="setting:1"><NavLink to="/blogs">All Blogs</NavLink></Menu.Item>
        <Menu.Item key="setting:2"><NavLink to="/postnewblog">Write a Blog</NavLink></Menu.Item>
    </SubMenu>
  </Menu>
  )
}

export default LeftMenu