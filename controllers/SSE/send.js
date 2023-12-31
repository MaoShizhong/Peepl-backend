const { activeFriendRequestClients, activeFeedUpdateClients } = require('./subscribe');

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
