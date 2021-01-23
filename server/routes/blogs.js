const router = require("express").Router();
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const { auth, admin } = require("../middleware/auth");
const slugify = require('slugify');

router.post("/createBlog", auth, async (req, res) => {
    try {
        if (!req.body.categories.length === 0) {
            return res.send({ error: 'Atleast One Category is required!' });
        }
        if (!req.body.tags.length === 0) {
            return res.send({ error: 'Atleast One Tag is required!' });
        }
        const blog = new Blog({
            title: req.body.title,
            slug: slugify(req.body.title, { remove: /[*+~.()'"!:@]/g, lower: true }),
            content: req.body.content,
            author: req.body.userID,
            categories: req.body.categories,
            tags: req.body.tags
        });
        await blog.save();
        res.send({ success: true });
    } catch (err) {
        console.log(err);
        res.send({ error: err.message });
    }
})

router.get("/getBlogs", async (req, res) => {
    try {
        const blogs = await Blog.find({}).populate('author','_id name image');
        res.send({ blogs: blogs });
    } catch (err) {
        console.log(err);
        res.send({ error: err.message });
    }
})

router.get("/getBlog/:id", auth, async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.id })
        .populate('author','_id name')
        .populate('categories','_id name')
        .populate('tags','_id name');

        res.send({ blog: blog });
    } catch (err) {
        console.log(err);
        res.send({ error: err.message });
    }
})

router.get("/getblogbyid/:id", auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if(req.user._id.toString() !== blog.author._id.toString()){
            return res.status(400).send({ error: 'Access Denied!' });
        }

        res.send({ blog: blog });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err.message });
    }
})

router.put("/editBlog", auth, async (req,res)=>{
    try {
        const blog = await Blog.findById(req.body.id);
        if(req.user._id.toString() !== blog.author.toString()){
            return res.status(400).send({ error: 'Access Denied!' });
        }
        const data = req.body.data;
        // console.log(data);
        blog.title = data.title;
        blog.slug = slugify(data.title, { remove: /[*+~.()'"!:@]/g, lower: true });
        blog.content = data.content;
        blog.categories = data.categories;
        blog.tags = data.tags;
       
        await blog.save();
        res.send({ message: 'Blog Updated Successfully!' });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ error: err.message });
    }
})

router.delete("/removeBlog/:id", auth, async (req, res) => {
    try {
        const id = req.params.id;
        const blog = await Blog.findById(id);
        console.log(blog);
        if (req.user._id.toString() !== blog.author.toString()) {
            return res.status(400).send({ error: 'Access Denied!' });
        }
        await blog.remove();
        res.send({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err.message });
    }
})

// categories and tags

router.get('/listCategories', async (req, res) => {
    try {
        const categories = await Category.find({});
        res.send({categories: categories});
    } catch (err) {
        res.send({ error: err.message });
    }
})
router.get('/listTags', async (req, res) => {
    try {
        const tags = await Tag.find({});
        res.send({tags: tags});
    } catch (err) {
        res.send({ error: err.message });
    }
})

router.post('/addCategory', auth, admin, async (req, res) => {
    try {
        const catArr = req.body.categories.split(',');
        const categories = catArr.map(c => ({ name: c }));
        await Category.insertMany(categories);
        res.send({ message: 'Category Successfully Added!' });
    } catch (err) {
        res.send({ error: err.message });
    }
})
router.post('/addTag', auth, admin, async (req, res) => {
    try {
        const tagArr = req.body.tags.split(',');
        const tags = tagArr.map(c => ({ name: c }));
        await Tag.insertMany(tags);
        res.send({ message: 'Tag Successfully Added!' });
    } catch (err) {
        res.send({ error: err.message });
    }
})

module.exports = router;