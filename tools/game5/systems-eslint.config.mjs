import base from '../../eslint.config.js';
import globals from 'globals';
export default [{
  ...base[0],
  files: ['src/game5/systems/*.mjs', 'src/game5/client/Game5Systems.jsx', 'src/game5/client/systemsTransport.mjs', 'src/pages/Game5.jsx'],
  languageOptions: {...base[0].languageOptions, globals: {...globals.browser, ...globals.node}},
}];
