/**
 * @param {string} ip
 */
export const isValidIPv4 = ip => {
    const regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)){3}$/;
    return regex.test(ip);
};
