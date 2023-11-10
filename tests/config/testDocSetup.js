const { users } = require('./test_users');
const { friendUsers } = require('./test_friends');
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
                posts: posts
                    .map((post) => {
                        if (post.author === user._id) {
                            return post._id;
                        }
                    })
                    .filter((id) => !!id),
            })
    );
    const FriendUsers = friendUsers.map((user) => new User(user));
    const Posts = posts.map((post) => new Post(post));
    const Comments = comments.map((comment) => new Comment(comment));

    await Promise.all([
        User.insertMany(Users),
        Wall.insertMany(Walls),
        User.insertMany(FriendUsers),
        Post.insertMany(Posts),
        Comment.insertMany(Comments),
    ]);
});

afterAll(async () => {
    await mongoose.connection.close();
});
