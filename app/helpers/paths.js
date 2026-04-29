import path from 'node:path';

/**
 * @param {string} file Import.meta.url
 * @returns {string}
 */
export const getCurrentFilename = file => path.basename(file, '.js');
