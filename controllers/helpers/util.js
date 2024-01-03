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
};

exports.censorUserEmail = (email) => {
    const atSymbol = email.indexOf('@');

    const firstHalf = email.slice(0, atSymbol);
    const secondHalf = email.slice(atSymbol);

    let censoredFirstHalf;
    switch (firstHalf.length) {
        case 1:
            censoredFirstHalf = '*';
            break;
        case 2:
            censoredFirstHalf = `${firstHalf[0]}*`;
            break;
        case 3:
            censoredFirstHalf = `${firstHalf[0]}**`;
            break;
        case 4:
            censoredFirstHalf = `${firstHalf[0]}**${firstHalf.at(-1)}`;
            break;
        default:
            censoredFirstHalf = `${firstHalf.slice(0, 2)}${'*'.repeat(
                firstHalf.length - 3
            )}${firstHalf.at(-1)}`;
    }

    return `${censoredFirstHalf}${secondHalf}`;
};

exports.getName = ({ name, fallbackName }) => {
    if (!name) {
        const halfLength = fallbackName.length / 2;
        return [fallbackName.slice(0, halfLength), fallbackName.slice(halfLength)];
    } else if (name.includes(' ')) {
        return name.split(' ');
    } else {
        const halfLength = name.length / 2;
        return [name.slice(0, halfLength), name.slice(halfLength)];
    }
};
