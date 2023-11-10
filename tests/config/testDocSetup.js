const { users } = require('./test_users');
const { posts } = require('./test_posts');
const { comments } = require('./test_comments');
const User = require('../../models/User');
const Wall = require('../../models/Wall');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    mongoose.connection.on('error', async (e) => {
        if (e.message.code === 'ETIMEDOUT') {
            console.log(e);
            await mongoose.connect(mongoUri);
        }
        console.log(e);
    });

    mongoose.connection.once('open', () => {
        console.log(`MongoDB successfully connected to ${mongoUri}`);
    });

    const Users = users.map((user) => new User(user));
    const Walls = users.map(
        (user) =>
            new Wall({
                user: user,
                posts: posts.map((post) => {
                    if (post.author.valueOf() === user._id.valueOf()) {
                        return user._id;
                    }
                }),
            })
    );
    const Posts = posts.map((post) => new Post(post));
    const Comments = comments.map((comment) => new Comment(comment));

    await Promise.all([
        User.insertMany(Users),
        Wall.insertMany(Walls),
        Post.insertMany(Posts),
        Comment.insertMany(Comments),
    ]);
});

afterAll(async () => {
    await mongoose.connection.close();
});
