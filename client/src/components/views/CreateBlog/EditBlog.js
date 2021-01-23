import React, { useState, useEffect } from 'react';
import QuillEditor from '../../Editor/BlogEditor';
import { useDispatch, useSelector } from "react-redux";
import { getBlogById, editBlog } from '../../../_actions/blogs_actions';
import Axios from 'axios';
import { Typography, Button, Spin, message, Checkbox } from 'antd';

const { Title } = Typography;

const EditBlogPage = (props) => {
    const blogId = props.match.params.blogId;
    const [myBlog, setMyBlog] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [bcategories, setBCategories] = useState([]);
    const [btags, setBTags] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        Axios.get('/api/blog/listCategories').then(data => { setCategories(data.data.categories) });
        Axios.get('/api/blog/listTags').then(data => { setTags(data.data.tags) });
    }, [])

    useEffect(() => {
        dispatch(getBlogById(blogId)).then(async res => {
            console.log(res);
            setLoading(true);
            if (!res.payload) {
                setLoading(false);
                return message.error('Something went wrong!');
            }
            if (await res.payload.blog) {
                setMyBlog(res.payload.blog);
                setTitle(res.payload.blog.title)
                setContent(res.payload.blog.content)
                setBCategories(res.payload.blog.categories)
                setBTags(res.payload.blog.tags)
            }
            setLoading(false);
        });
    }, [dispatch])

    const onEditorChange = (value) => {
        setContent(value)
        console.log(content)
    }
    const onFilesChange = (files) => {
        setFiles(files)
    }

    const onSubmit = (event) => {
        event.preventDefault();
        if (user.userData && !user.userData.isAuth) {
            return message.error('Please Log in first');
        }
        if (user.userData._id.toString() !== myBlog.author.toString()) {
            return message.error('Access Denied!');
        }

        const data = {
            title: title,
            content: content,
            categories: bcategories,
            tags: btags,
            userID: user.userData._id
        }
        setContent("");
        setTitle("");
        setBCategories([]);
        setBTags([]);
        console.log(data);
        dispatch(editBlog(blogId, data)).then(res => {
            if(!res.payload){
                return message.error('Something went wrong!');
            }
            message.success('Post Updated!');
            setTimeout(() => {
                props.history.push('/blog/'+myBlog.slug);
            }, 1000);
        }).catch(err => {
            message.error('Failed! ' + err.message);
            console.log(err.message)
        });
    }

    const catCheckBoxHandler = (e, value) => {
        if (e.target.checked) {
            setBCategories(prevState => prevState.concat(value));
        } else {
            setBCategories(prevState => prevState.filter(c => c !== value));
        }
    }
    const tagCheckBoxHandler = (e, value) => {
        if (e.target.checked) {
            setBTags(prevState => prevState.concat(value));
        } else {
            setBTags(prevState => prevState.filter(t => t !== value));
        }
    }

    return (
        <div style={{ margin: '2rem' }}>
            {loading ? <div style={{ margin: '3rem' }}><Spin size="large" /></div> : <React.Fragment>
                <div style={{ textAlign: 'center' }}>
                    <Title level={1} > Add a New Blog </Title>
                </div>
                <div className="layout">
                    <div className="editor-form">
                        <div style={{ marginBottom: '0.5rem' }}>
                            <Title level={3} > Title </Title>
                            <input type="text" className="titleIP" placeholder="Title of Blog" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <QuillEditor
                            placeholder={"Start Posting Something"}
                            myHTML={content?content:""}
                            onEditorChange={onEditorChange}
                            onFilesChange={onFilesChange}
                        />

                        <form onSubmit={onSubmit}>
                            <div style={{ textAlign: 'center', margin: '2rem', }}>
                                <Button size="large" htmlType="submit" onSubmit={onSubmit}>
                                    Submit
                            </Button>
                            </div>
                        </form>
                    </div>

                    <div className="cattags">
                        <Title level={4}>Categories</Title>
                        {categories && categories.map(c =>
                            <Checkbox defaultChecked={bcategories.find(bc=>bc==c._id)} onChange={(e) => catCheckBoxHandler(e, c._id)} key={c._id}> {c.name} </Checkbox>
                        )
                        }
                        <br />
                        <Title level={4}>Tags</Title>
                        {tags && tags.map(t =>
                            <Checkbox defaultChecked={btags.find(bt=>bt==t._id)} onChange={(e) => tagCheckBoxHandler(e, t._id)} key={t._id}> {t.name} </Checkbox>
                        )
                        }
                    </div>
                </div>
            </React.Fragment>}
        </div>
    );
};

export default EditBlogPage;