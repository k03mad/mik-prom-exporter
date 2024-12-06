/**
 * @param {string} ip
 */
export const isLocalIp = ip => ip.startsWith('0')
    || ip.startsWith('255.')
    || ip.startsWith('127.')
    || ip.startsWith('10.')
    || ip.startsWith('172.16.')
    || ip.startsWith('192.168.');
