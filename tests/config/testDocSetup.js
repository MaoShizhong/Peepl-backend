const { users } = require('./test_users');
const { friendUsers } = require('./test_friends');
const { posts } = require('./test_posts');
const { comments } = require('./test_comments');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const argon2 = require('argon2');

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

    const Users = await Promise.all(
        users.map(async (user) => {
            const clonedUser = structuredClone(user); // change object reference
            clonedUser.auth.password = await argon2.hash(clonedUser.auth.password);
            return new User(clonedUser);
        })
    );
    const FriendUsers = await Promise.all(
        friendUsers.map(async (user) => {
            const clonedUser = structuredClone(user); // change object reference
            clonedUser.auth.password = await argon2.hash(clonedUser.auth.password);
            return new User(clonedUser);
        })
    );
    const Posts = posts.map((post) => new Post(post));
    const Comments = comments.map((comment) => new Comment(comment));

    await Promise.all([
        User.insertMany(Users),
        User.insertMany(FriendUsers),
        Post.insertMany(Posts),
        Comment.insertMany(Comments),
    ]);
});

afterAll(async () => {
    await mongoose.connection.close();
});
