import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { getBlogDetails } from '../../../_actions/blogs_actions';
import { Typography, Spin, Tag, Divider, Alert } from 'antd';

const { Title } = Typography

const BlogDetailsPage = (props) => {
    const user = useSelector(state => state.user);
    const [post, setPost] = useState('');
    const dispatch = useDispatch();
    const postId = props.match.params.id;

    useEffect(() => {
        dispatch(getBlogDetails(postId)).then(async res => {
            if (await res.payload.blog) {
                setPost(res.payload.blog);
            }
        });
    }, [])

    if (user.userData && !user.userData.isAuth) {
        return <div style={{margin: '2rem 0.5rem'}}><Alert message="You need to Login first!" type="error" /></div>
    }

    if (post.author) {
        return (
            <div className="postPage">
                <Title level={1}>{post.title}</Title>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>{post.author.name}`s Post</h3>
                    <h4>
                        {post.createdAt}
                    </h4>
                </div>
                <div style={{ margin: '1rem auto' }}>
                    {post.categories.map(c => <Tag style={{margin: '3px'}} key={c._id} color='geekblue'>{c.name}</Tag>)}
                    {post.tags.map(t => <Tag style={{margin: '3px'}}key={t._id}  color='volcano'>{t.name}</Tag>)}
                </div>
                <Divider />
                <div className="postContent" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
        )
    } else {
        return (
            <div style={{ textAlign: 'center', margin: '3rem auto' }}><Spin size="large" /></div>
        )
    }

};

export default BlogDetailsPage;