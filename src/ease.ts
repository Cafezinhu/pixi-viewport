import Penner from 'penner';

/**
 * Returns correct Penner equation using string or Function.
 *
 * @internal
 * @ignore
 * @param {(function|string)} [ease]
 * @param {defaults} default penner equation to use if none is provided
 */
// eslint-disable-next-line consistent-return
export default function ease(ease: any, defaults?: any): any
{
    if (!ease)
    {
        //@ts-ignore
        return Penner[defaults];
    }
    else if (typeof ease === 'function')
    {
        return ease;
    }
    else if (typeof ease === 'string')
    {
        //@ts-ignore
        return Penner[ease];
    }
}
