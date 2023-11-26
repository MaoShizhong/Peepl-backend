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

exports.extractPublicID = (url) => {
    if (!url) return '';

    const sections = url.split('/');

    const folder = sections.at(-2);
    const id = sections.at(-1).replace('.webp', '');

    return `${folder}/${id}`;
}