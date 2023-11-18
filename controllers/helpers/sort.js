exports.sortByEndDescendingThenStartDescending = (entryA, entryB) => {
    // take null date to mean "present" = only end date can be null
    const sortByEndDateLatestFirst =
        new Date(entryB.end ?? Date.now()) - new Date(entryA.end ?? Date.now());

    if (!sortByEndDateLatestFirst) {
        const sortByStartDateLatestFirst = new Date(entryB.start) - new Date(entryA.start);

        return sortByStartDateLatestFirst;
    } else {
        return sortByEndDateLatestFirst;
    }
};
