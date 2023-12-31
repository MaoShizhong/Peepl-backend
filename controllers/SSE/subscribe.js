const activeFriendRequestClients = [];
const activeFeedUpdateClients = [];
const activeWallPostUpdateClients = [];

const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
};

const removeClient = (clients, idToRemove, logText) => {
    const indexOfClientToClose = clients.findIndex((client) => client._id === idToRemove);
    clients.splice(indexOfClientToClose, 1);
    console.log(`CLOSED ${logText} connection - client: ${idToRemove}`);
};

exports.subscribeToFriendRequestNotifications = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    activeFriendRequestClients.push({ _id: clientID, response: res });
    console.log(`OPENED friend request connection - client: ${clientID}`);

    req.on('close', () => {
        removeClient(activeFriendRequestClients, clientID, 'friend request');
    });
};

exports.subscribeToFeedUpdates = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    activeFeedUpdateClients.push({ _id: clientID, response: res });
    console.log(`OPENED feed update connection - client: ${clientID}`);

    req.on('close', () => {
        removeClient(activeFeedUpdateClients, clientID, 'feed update');
    });
};

exports.subscribeToWallPostUpdates = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    activeWallPostUpdateClients.push({ _id: clientID, response: res });
    console.log(`OPENED wall update connection - client: ${clientID}`);

    req.on('close', () => {
        removeClient(activeWallPostUpdateClients, clientID, 'wall update');
    });
};

exports.activeFriendRequestClients = activeFriendRequestClients;
exports.activeFeedUpdateClients = activeFeedUpdateClients;
exports.activeWallPostUpdateClients = activeWallPostUpdateClients;
