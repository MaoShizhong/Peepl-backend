const {
    activeFriendRequestClients,
    activeFeedUpdateClients,
    activeWallPostUpdateClients,
} = require('./subscribe');

exports.sendIncomingFriendRequestNotification = (recipientID, incomingDetails) => {
    activeFriendRequestClients.forEach((client) => {
        if (client._id === recipientID) {
            client.response.write(`data: ${JSON.stringify(incomingDetails)}\n\n`);
        }
    });
};

exports.sendFeedUpdate = async (friendsOfAuthor, newPost) => {
    activeFeedUpdateClients.forEach((client) => {
        if (friendsOfAuthor.find((friend) => friend.user.valueOf() === client._id)) {
            client.response.write(`data: ${JSON.stringify(newPost)}\n\n`);
        }
    });
};

exports.sendWallPostNotification = async (wallPost) => {
    activeWallPostUpdateClients.forEach((client) => {
        if (client._id === wallPost.wall.valueOf()) {
            client.response.write(`data: ${JSON.stringify(wallPost)}\n\n`);
        }
    });
};
