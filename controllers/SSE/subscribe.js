const activeFriendRequestClients = [];
const activeFeedUpdateClients = [];
const activeWallPostUpdateClients = [];

const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
};
const HEARTBEAT_INTERVAL = 10000;

const removeClient = (clients, idToRemove, logText) => {
    const indexOfClientToClose = clients.findIndex((client) => client._id === idToRemove);
    clients.splice(indexOfClientToClose, 1);
    console.log(`CLOSED ${logText} connection - client: ${idToRemove}`);
};

const keepAlive = (client) =>
    setInterval(() => client.response.write(`data: ping\n\n`), HEARTBEAT_INTERVAL);

exports.subscribeToFriendRequestNotifications = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    const newClient = { _id: clientID, response: res };
    activeFriendRequestClients.push(newClient);
    console.log(`OPENED friend request connection - client: ${clientID}`);

    const heartBeat = keepAlive(newClient);
    req.on('close', () => {
        removeClient(activeFriendRequestClients, clientID, 'friend request');
        clearInterval(heartBeat);
    });
};

exports.subscribeToFeedUpdates = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    const newClient = { _id: clientID, response: res };
    activeFeedUpdateClients.push(newClient);
    console.log(`OPENED feed update connection - client: ${clientID}`);

    const heartBeat = keepAlive(newClient);
    req.on('close', () => {
        removeClient(activeFeedUpdateClients, clientID, 'feed update');
        clearInterval(heartBeat);
    });
};

exports.subscribeToWallPostUpdates = (req, res) => {
    res.writeHead(200, SSE_HEADERS);

    const { _id: clientID } = req.user;
    const newClient = { _id: clientID, response: res };
    activeWallPostUpdateClients.push(newClient);
    console.log(`OPENED wall update connection - client: ${clientID}`);

    const heartBeat = keepAlive(newClient);
    req.on('close', () => {
        removeClient(activeWallPostUpdateClients, clientID, 'wall update');
        clearInterval(heartBeat);
    });
};

exports.activeFriendRequestClients = activeFriendRequestClients;
exports.activeFeedUpdateClients = activeFeedUpdateClients;
exports.activeWallPostUpdateClients = activeWallPostUpdateClients;
