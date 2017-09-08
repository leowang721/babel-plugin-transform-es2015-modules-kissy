# babel-plugin-transform-es2015-modules-amd
> This plugin transforms ES2015 modules to [KISSY Modules](http://docs.kissyui.com/1.3/docs/html/api/seed/loader/add.html).

## Installation

```
npm install --save-dev babel-plugin-transform-es2015-modules-kissy
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["transform-es2015-modules-kissy"]
}
```

### Via CLI

```sh
babel --plugins transform-es2015-modules-kissy script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["transform-es2015-modules-kissy"]
});
```

### Options

See options for `babel-plugin-transform-es2015-commonjs`.

### For Kissy Module ID

each module should have a unique id, by default it would be the path of current file, we can set options like this:
```
{
  moduleIds: true,
  moduleRoot: path.resolve(__dirname, '../../../src')  // this is a absolute path, calculated from script file path
}
```

For example:

module path: `/Users/leowang/work/sampleproj/src`
file path: `/Users/leowang/work/sampleproj/src/home/view/index.es`
the calculate module name would be: `home/view/index`

### about KISSY

import KISSY first, even you won't use it, this is recommanded.

```
import 'KISSY'
// or
import {each} from 'KISSY'  // this is also ok
```

However, you can ignore the recommandation, don't import KISSY, that would make the compile progress a little bit slower.
Under these circumstances, we will add `S` automatically, you can use KISSY like this:

```
S.each(...)
```

## Examples

### Simple

`In`

```javascript
import _ from 'lodash'
export default _
```
`Out`

```javascript
KISSY.add(MODULE_NAME, function (S, _lodash) {
  'use strict';

  var exports = {};
  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _lodash2 = _interopRequireDefault(_lodash);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = _lodash2.default;
  return exports.default;
}, {
  requires: ['lodash'],
  cssRequires: []
});
```

### About css

The following code is showing how to import css:

```javascript
import 'css!somepath/some.css'
```

`In`

```javascript
import 'lodash'
import $ from 'jquery'

import 'css!abc/def.css'
import 'css!aaa.css'

$.ready(() => {
  console.log('ok')
})

export default true
```

`Out`
```javascript
KISSY.add(MODULE_NAME, function (S, _lodash, _jquery) {
  'use strict';

  var exports = {};
  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _jquery2 = _interopRequireDefault(_jquery);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  _jquery2.default.ready(() => {
    console.log('ok');
  });

  exports.default = true;
  return exports.default;
}, {
  requires: ['lodash', 'jquery'],
  cssRequires: ['abc/def.css', 'aaa.css']
});
```
