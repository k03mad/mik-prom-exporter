import {convertToArray} from './array.js';

/* eslint-disable no-console */
/**
 * @param {any|any[]} msg
 * @returns {void}
 */
export const log = msg => console.log(convertToArray(msg).join('\n'));

/**
 * @param {any|any[]} msg
 * @returns {void}
 */
export const logPlainError = msg => {
    console.error(`\n${convertToArray(msg).join('\n')}\n`);
};

/**
 * @param {any|any[]} msg
 * @returns {void}
 */
export const throwPlainError = msg => {
    logPlainError(msg);
    process.exit(1);
};
