# vue

## vue 工具方法

### 函数

// 基本类型：Undefined, Null, String, Number, Boolean, Sysmbol
// 引用类型：Object, Function

- isUndef => undefined
- isDef => 非undefined
- isTrue => 真
- isFalse => 假
- isPrimitive => 基本类型 typeof
- isObject => 非null的对象 typeof

- toRawType => 转化引用类型 [object Object] => Array, Function, RegExp, Map, Set, WeakMap, WeakSet
- isPlainObject => 纯对象 [object Object]
- isRegExp => 正则对象

- isValidArrayIndex => 检查数组下标是否有效
- isPromise => 是否为Promise对象
- toString => 转化为字符串
- toNumber => 转化为数字

- makeMap => (str, expectsLowerCase) => 返回一个函数，对象中是否含有str中的key
- remove => 数组中删除一个数

- hasOwn => 对象中是否含有key
- cached => 返回一个缓存的对象 函数 如果缓存中有，直接读取缓存

- camelize/capitalize/hyphenate => 驼峰/首字母大写/-线
- 正则 => /-(\w)/ => /\B([A-Z])/

- polyfillBind/nativeBind => bind兼容
- toArray => 类数组转为数组
- extends => (to, from) => to => 对象to继承from对象中的值
- toObject =>（arr) => 返回一个对象，去重了数组中存在相同对象key项的值，保留后一个

- noop => 空函数
- no => false
- identity => _ => _ 返回相同的值

- genStaticKeys => modules => 返回一个字符串 (reduce compiler moudles)
- looseEqual => (a, b) => 浅相等
  ```js
  // a === b
  // 判断 a, b 是否为对象
    // 判断 a, b 是否为数组 length 以及比较每一项的值
    // a instanceof Date && b instanceof Date
    // 比较两个对象
  // String(a) String(b)
  ```
- looseIndexOf => (arr, val) => 返回arr中每项第一次与val值相等的下标
- once => fn => 函数只执行一次

### 常量变量

SSR_ATTR = 'data-server-rendered';

ASSET_TYPES = ['component', 'directive',  'filter'];

LIFECYCLE_HOOKS = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'Updated', 'beforeDestroy', 'destroyed', 'activated', 'deactivated', 'errorCaptured', 'serverPrefetch'];
