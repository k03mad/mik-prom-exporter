/**
 * @param {string} key
 * @param {object} obj
 * @param {number} count
 */
export const countDupsBy = (key, obj, count = 1) => {
    obj[key] = obj[key] ? obj[key] + count : count;
};
