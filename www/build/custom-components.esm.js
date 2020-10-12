import { b as bootstrapLazy } from './index-a9b4faa7.js';
import { p as patchBrowser, g as globalScripts } from './app-globals-1f1c7078.js';

patchBrowser().then(options => {
  globalScripts();
  return bootstrapLazy([["psk-conversation",[[0,"psk-conversation",{"configPath":[1,"config-path"],"context":[32],"consoleContent":[32],"visibleOptionCount":[32]},[[9,"resize","handleScroll"],[0,"needFloatingMenu","needFloatingMenu"],[0,"openHiddenOptionsMenu","openHiddenOptionsMenu"]]]]],["psk-fragment",[[4,"psk-fragment"]]],["psk-floating-button-group",[[0,"psk-floating-button-group",{"buttons":[16],"backdrop":[4],"opened":[1540]}]]]], options);
});
