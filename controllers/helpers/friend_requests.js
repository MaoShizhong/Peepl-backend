const asyncHandler = require('express-async-handler');

exports.acceptFriendRequest = asyncHandler(async (self, target) => {
    const incoming = self.friends.find(
        (fr) => fr.user.valueOf() === target._id.valueOf() && fr.status === 'incoming'
    );
    const outgoing = target.friends.find(
        (fr) => fr.user.valueOf() === self._id.valueOf() && fr.status === 'requested'
    );

    // triggered if friend request with provided details does not exist
    if (!incoming || !outgoing) return false;

    incoming.status = 'accepted';
    outgoing.status = 'accepted';

    await Promise.all([self.save(), target.save()]);
    return true;
});

exports.rejectFriendRequest = asyncHandler(async (self, target) => {
    const indexOfIncoming = self.friends.findIndex(
        (fr) => fr.user.valueOf() === target._id.valueOf() && fr.status === 'incoming'
    );
    const indexOfOutgoing = target.friends.findIndex(
        (fr) => fr.user.valueOf() === self._id.valueOf() && fr.status === 'requested'
    );

    // triggered if friend request with provided details does not exist
    if (indexOfIncoming === -1 || indexOfOutgoing === -1) return false;

    self.friends.splice(indexOfIncoming, 1);
    target.friends.splice(indexOfOutgoing, 1);

    await Promise.all([self.save(), target.save()]);
    return true;
});
