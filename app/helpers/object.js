/**
 * @param {string} key
 * @param {object} obj
 */
export const countDupsBy = (key, obj) => {
    obj[key] = obj[key] ? obj[key] + 1 : 1;
};
