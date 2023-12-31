const activeFriendRequestClients = [];
const activeFeedUpdateClients = [];

const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
};

exports.subscribeToFriendRequestNotifications = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    activeFriendRequestClients.push({ _id: clientID, response: res });
    console.log(`OPENED friend request connection - client: ${clientID}`);

    req.on('close', () => {
        const indexOfClientToClose = activeFriendRequestClients.findIndex(
            (client) => client._id === clientID
        );
        activeFriendRequestClients.splice(indexOfClientToClose, 1);
        console.log(`CLOSED friend request connection - client: ${clientID}`);
    });
};

exports.subscribeToFeedUpdates = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    activeFeedUpdateClients.push({ _id: clientID, response: res });
    console.log(`OPENED feed update connection - client: ${clientID}`);

    req.on('close', () => {
        const indexOfClientToClose = activeFeedUpdateClients.findIndex(
            (client) => client._id === clientID
        );
        activeFeedUpdateClients.splice(indexOfClientToClose, 1);
        console.log(`CLOSED feed update connection - client: ${clientID}`);
    });
};

exports.activeFriendRequestClients = activeFriendRequestClients;
exports.activeFeedUpdateClients = activeFeedUpdateClients;
