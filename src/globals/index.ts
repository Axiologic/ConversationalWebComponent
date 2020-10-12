import { setMode } from '@stencil/core';

export default () => setMode(element => {
  return (element as any).mode || element.getAttribute('mode') || 'default';
});
