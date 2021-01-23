import React, { useState, useEffect } from 'react';
import QuillEditor from '../../Editor/BlogEditor';
import { useDispatch, useSelector } from "react-redux";
import { createBlog } from '../../../_actions/blogs_actions';
import Axios from 'axios';
import { Typography, Button, Form, message, Checkbox } from 'antd';

const { Title } = Typography;

const NewBlog = (props) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [bcategories, setBCategories] = useState([]);
    const [btags, setBTags] = useState([]);
    const [files, setFiles] = useState([]);
    const user = useSelector(state => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        Axios.get('/api/blog/listCategories').then(data => { setCategories(data.data.categories) });
        Axios.get('/api/blog/listTags').then(data => { setTags(data.data.tags) });
    }, [])

    const onEditorChange = (value) => {
        setContent(value)
    }
    const onFilesChange = (files) => {
        setFiles(files)
    }

    const onSubmit = (event) => {
        event.preventDefault();
        if (user.userData && !user.userData.isAuth) {
            return alert('Please Log in first');
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

        dispatch(createBlog(data)).then(res => {
            if(!res.payload){
                return message.error('Something went wrong!');
            }
            message.success('Post Created!');
            setTimeout(() => {
                props.history.push('/blogs')
            }, 1000);
        }).catch(err => {
            message.error('Failed! '+err.message);
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
                        <Checkbox onChange={(e) => catCheckBoxHandler(e, c._id)} key={c._id}> {c.name} </Checkbox>
                    )
                    }
                    <br />
                    <Title level={4}>Tags</Title>
                    {tags && tags.map(t =>
                        <Checkbox onChange={(e) => tagCheckBoxHandler(e, t._id)} key={t._id}> {t.name} </Checkbox>
                    )
                    }
                </div>
            </div>
        </div>
    );
};

export default NewBlog;