import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { getBlogDetails, deleteBlog } from '../../../_actions/blogs_actions';
import { Typography, Spin, Tag, Divider, message, Button, Popconfirm, Alert } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography

const BlogDetailsPage = (props) => {
    const user = useSelector(state => state.user);
    const [post, setPost] = useState('');
    const dispatch = useDispatch();
    const postId = props.match.params.id;

    if (user.userData && !user.userData.isAuth) {
        return <Alert message="You need to Login first!" type="error" />
    }

    useEffect(() => {
        dispatch(getBlogDetails(postId)).then(async res => {
            if (await res.payload.blog) {
                setPost(res.payload.blog);
            }
        });
    }, [])

    const blogDeleteHandler = (blogId) => {
        if (user.userData && !user.userData.isAuth) {
            return message.error('Please Log in first');
        }
        if (user.userData._id.toString() !== post.author._id.toString()) {
            return message.error('Access Denied!');
        }
        dispatch(deleteBlog(blogId)).then(res => {
            message.success('Blog Deleted Successfully!');
        }).catch(err => {
            message.error('Failed! ' + err.message);
        });
        props.history.push("/blogs");
    }

    if (post.author) {
        return (
            <div className="postPage" style={{ width: '80%', margin: '3rem auto' }}>
                <Title level={1}>{post.title}</Title>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>{post.author.name}`s Post</h3>
                    <h4>
                        <Popconfirm
                            placement="leftTop"
                            title='Are you sure?'
                            onConfirm={() => blogDeleteHandler(post._id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                type="danger"
                                icon={<DeleteOutlined />}
                                style={{marginRight: '10px'}}
                            />
                        </Popconfirm>
                        {post.createdAt}
                    </h4>
                </div>
                <div style={{ margin: '1rem auto' }}>
                    {post.categories.map(c => <Tag color='geekblue'>{c.name}</Tag>)}
                    {post.tags.map(t => <Tag color='volcano'>{t.name}</Tag>)}
                </div>
                <Divider />
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
        )
    } else {
        return (
            <div style={{ textAlign: 'center', margin: '3rem auto' }}><Spin size="large" /></div>
        )
    }

};

export default BlogDetailsPage;