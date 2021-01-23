import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getBlogs } from '../../../_actions/blogs_actions';
import { Card, Avatar, Col, Typography, Row, Spin, message } from 'antd';
import { PlusCircleOutlined, EditFilled, EllipsisOutlined, SettingFilled } from '@ant-design/icons';

const { Title } = Typography
const { Meta } = Card;

const BlogsPage = (props) => {
    const user = useSelector(state => state.user);
    const dispatch = useDispatch();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(getBlogs()).then(async res => {
            setLoading(true);
            if (await res.payload.blogs) {
                setBlogs(res.payload.blogs)
            }
            setLoading(false);
        });
    }, [])

    const addNewBlog = () => {
        props.history.push('/postnewblog');
    }

    const editMyBlog = (authId, blogId) => {
        if (user.userData && !user.userData.isAuth) {
            return message.error('Please Log in first');
        }
        if (user.userData._id.toString() !== authId.toString()) {
            return message.error('Access Denied!');
        }
        props.history.push({
            pathname: '/editmyblog/'+blogId,
        })
    }

    const renderCards = blogs.map((blog, index) => {
        return <Col key={index} lg={8} md={12} xs={24}>
            <Card
                hoverable
                style={{ maxWidth: 370, marginTop: 16 }}
                actions={[
                    <SettingFilled />,
                    <EditFilled onClick={() => editMyBlog(blog.author._id, blog._id)} />,
                    <Link to={{ pathname: `/blog/${blog.slug}` }}> <EllipsisOutlined style={{ fontWeight: 'bold', fontSize: '18px' }} /> </Link>,
                ]}
            >
                <Meta
                    avatar={
                        <Avatar src={blog.author.image} />
                    }
                    title={blog.author.name}
                    description="This is the description"
                />
                <div style={{ height: 150, overflowY: 'scroll', marginTop: 10 }}>
                    <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                </div>
            </Card>
        </Col>
    });

    return (
        <div style={{ width: '85%', margin: '3rem auto' }}>
            <Title level={1}> Blog Lists </Title>
            <Row gutter={[32, 16]}>
                {loading ? <div style={{ margin: '3rem' }}><Spin size="large" /></div> : renderCards}
            </Row>
            <button className="addBlog" onClick={addNewBlog}><PlusCircleOutlined style={{ fontSize: '3rem' }} /></button>
        </div>
    )
}

export default BlogsPage;