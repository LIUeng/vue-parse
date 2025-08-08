// 期望结果
// 当数组 arr 变化 computed 以及 watch 是如何响应的
// 数组又是怎么拦截变化的

// const
let hasProto = '__proto__' in {};

// tools
function noop() {}

function isObject(o) {
  return o !== null && typeof o === 'object';
}

function isPlainObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function def(o, prop, val, enumerable) {
  Object.defineProperty(o, prop, {
    value: val,
    writable: true,
    configurable: true,
    enumerable: !!enumerable,
  });
}

function remove(arr, item) {
  let idx = arr.indexOf(item);
  if (~idx) {
    arr.splice(idx, 1);
  }
}

function parsePath(path) {
  let segments = path.split('.');
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      let segment = segments[i];
      obj = obj[segment];
    }
    return obj;
  };
}

let seenObjects = new Set();

function traverse(val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse(val, seen) {
  let i;
  let keys;
  let isA = Array.isArray(val);

  if (!isA && !isObject(val)) return;

  if (val.__ob__) {
    let depId = val.__ob__.dep.id;
    if (seen.has(depId)) return;
    seen.add(depId);
  }

  if (isA) {
    i = val.length;
    while (i--) {
      _traverse(val[i], seen);
    }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) {
      _traverse(val[keys[i]], seen);
    }
  }
}

// 数组
let arrayProto = Array.prototype;
let arrayMethods = Object.create(arrayProto);
let methodToPatch = ['pop', 'push', 'unshift', 'shift', 'splice', 'reverse', 'sort'];

methodToPatch.forEach((method) => {
  let original = arrayMethods[method];

  def(arrayMethods, method, function mutator(...args) {
    let result = original.apply(this, args);

    let inserted;
    let ob = this.__ob__;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args.slice();
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }

    if (inserted) {
      ob.observeArray(inserted);
    }

    // notify change
    ob.dep.notify();

    return result;
  });
});

let arrayKeys = Object.getOwnPropertyNames(arrayMethods);

function protoAugment(target, src) {
  target.__proto__ = src;
}

function copyAugment(target, src, keys) {
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    def(target, key, src[key]);
  }
}

// 实现如下
function Vue(options) {
  this.$options = options;
  this.init();
}

Vue.prototype.init = function init() {
  let vm = this;
  let $options = vm.$options;
  vm._watchers = [];

  // init data
  if ($options && $options.data) {
    let data = $options.data();

    vm._data = data;

    // proxy
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      proxy(vm, '_data', keys[i]);
    }

    // 响应式监听
    observe(vm._data, vm);
  }

  // init computed
  if ($options && $options.computed) {
    initComputed(vm, $options.computed);
  }

  // init watch
  if ($options && $options.watch) {
    initWatch(vm, $options.watch);
  }

  if (vm.$options.el) {
    new Watcher(
      vm,
      function updateComponent() {
        console.log('vm render');
      },
      noop
    );
  }
};

Vue.prototype.$watch = function $watch(expOrFn, cb, options) {
  let vm = this;

  let watcher = new Watcher(vm, expOrFn, cb, options);
  options = options || {};
  options.user = true;

  if (options.immediate) {
    cb.call(vm, watcher.value);
  }

  return function unwatchFn() {};
};

let computedWatcherOptions = { lazy: true };

function initComputed(vm, computed) {
  let keys = Object.keys(computed);
  var watchers = (vm._computedWatchers = Object.create(null));

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let userDef = computed[key];
    let getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (!getter) {
      console.warn('no getter for computed property: ' + key);
    }
    // isSSR
    watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions);

    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    }
  }
}

function defineComputed(target, key, userDef) {
  let shouldCache = true;

  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache ? createComputedGetter(key) : createGetterInvoker(userDef);
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get ? (shouldCache && userDef.cache !== false ? createComputedGetter(key) : createGetterInvoker(userDef.get)) : noop;
    sharedPropertyDefinition.set = userDef.set || noop;
  }

  if (sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      console.warn('warn computed set');
    };
  }

  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createComputedGetter(key) {
  return function computedGetter() {
    let watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }

      if (Dep.target) {
        watcher.depend();
      }

      return watcher.value;
    }
  };
}

function createGetterInvoker(fn) {
  return function computedGetter() {
    fn.call(this, this);
  };
}

function initWatch(vm, watch) {
  for (let key in watch) {
    let handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(vm, expOrFn, handler, options) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  // `a.b`() {}
  // methods
  if (typeof handler === 'string') {
    handler = vm[handler];
  }

  return vm.$watch(expOrFn, handler, options);
}

// Watcher
let uid$1 = 0;

function Watcher(vm, expOrFn, cb, options) {
  this.vm = vm;
  this.id = uid$1++;
  this.cb = cb;

  if (options) {
    this.lazy = !!options.lazy;
    this.deep = !!options.deep;
  } else {
    this.lazy = false;
  }

  this.dirty = this.lazy;
  this.active = true;

  this.deps = [];
  this.newDeps = [];
  this.newDepIds = new Set();
  this.depIds = new Set();

  vm._watchers.push(this);

  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
  }

  this.value = this.lazy ? undefined : this.get();
}

Watcher.prototype.get = function get() {
  pushTarget(this);

  let vm = this.vm;

  let value = this.getter.call(vm, vm);

  // traverse here
  if (this.deep) {
    traverse(value);
  }

  popTarget();
  this.cleanupDeps();

  return value;
};

Watcher.prototype.addDep = function addDep(dep) {
  let id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};

Watcher.prototype.update = function update() {
  console.log('update');
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};

Watcher.prototype.run = function run() {
  if (this.active) {
    let value = this.get();
    if (value !== this.value || isObject(value) || this.deep) {
      let oldValue = this.value;
      // this.user??
      this.cb.call(this.vm, value, oldValue);
    }
  }
};

Watcher.prototype.evaluate = function evaluate() {
  this.value = this.get();
  this.dirty = false;
};

Watcher.prototype.cleanupDeps = function cleanupDeps() {
  let i = this.deps.length;
  while (i--) {
    let id = this.deps[i].id;
    if (!this.newDepIds.has(id)) {
      this.deps[i].removeSub(this);
    }
  }
  let tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

// Observer
function Observer(value) {
  this.dep = new Dep();

  this.value = value;
  this.vmCount = 0;

  def(value, '__ob__', this);

  if (Array.isArray(value)) {
    if (hasProto) {
      protoAugment(value, arrayMethods);
    } else {
      copyAugment(value, arrayMethods, arrayKeys);
    }
    this.observeArray(value);
  } else {
    this.walk(value);
  }
}

Observer.prototype.walk = function walk(obj) {
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i]);
  }
};

Observer.prototype.observeArray = function observeArray(items) {
  for (let i = 0; i < items.length; i++) {
    observe(items[i]);
  }
};

// observe
function observe(value /* , asRootData */) {
  if (!isObject(value)) return;

  let ob;

  if (Object.prototype.hasOwnProperty.call(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (isPlainObject(value) || Array.isArray(value)) {
    ob = new Observer(value);
  }

  ob.vmCount++;

  return ob;
}

// Dep
let uid = 0;

function Dep() {
  this.id = uid++;
  this.subs = [];
}

Dep.prototype.addSub = function addSub(sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub(sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend() {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify() {
  let subs = this.subs;
  for (let i = 0; i < subs.length; i++) {
    subs[i].update();
  }
};

Dep.target = null;
let targetStack = [];

function pushTarget(target) {
  targetStack.push(target);
  Dep.target = target;
}

function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}

function defineReactive(obj, key, val) {
  let dep = new Dep();

  let property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) return;

  let getter = property && property.get;
  let setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  // child ob
  let childOb = observe(val);

  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    get: function reactiveGetter() {
      let value = getter ? getter.call(obj) : val;

      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
      }

      return value;
    },
    set: function reactiveSetter(newVal) {
      let value = getter ? getter.call(obj) : val;

      if (value === newVal || (value !== value && newVal !== newVal)) return;

      if (getter && !setter) return;

      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }

      childOb = observe(newVal);
      dep.notify();
    },
  });
}

let sharedPropertyDefinition = {
  configurable: true,
  enumerable: true,
  get: noop,
  set: noop,
};

function proxy(target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key];
  };

  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val;
  };

  Object.defineProperty(target, key, sharedPropertyDefinition);
}

// micro task
let callbacks = [];
let pending = false;

function flushCallbacks() {
  pending = false;

  let copies = callbacks.slice();
  callbacks.length = 0;

  for (let i = 0; i < copies.length; i++) {
    copies[i]();
  }
}
let timerFunc;

if (typeof Promise !== 'undefined') {
  let p = Promise.resolve();

  timerFunc = function () {
    p.then(flushCallbacks);
  };
}

function nextTick(cb, ctx) {
  let _resolve;

  callbacks.push(function () {
    if (cb) {
      cb.call(ctx);
    } else if (_resolve) {
      _resolve(ctx);
    }
  });

  if (!pending) {
    pending = true;
    timerFunc();
  }

  if (!cb && typeof Promise !== 'undefined') {
    return new Promise((resolve) => {
      _resolve = resolve;
    });
  }
}

let queue = [];
let has = {};
let waiting = false;
let flushing = false;
let index = 0;

function resetSchedulerState() {
  waiting = flushing = false;
  has = {};
  index = queue.length = 0;
}

let currentFlushTimestamp = 0;
let getNow = function () {
  return performance.now();
};

function flushSchedulerQueue() {
  currentFlushTimestamp = getNow();
  flushing = true;

  // sort
  queue.sort((a, b) => a.id - b.id);

  console.log(queue.slice());

  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    let id = watcher.id;
    has[id] = null;
    watcher.run();
  }

  resetSchedulerState();
}

function queueWatcher(watcher) {
  let id = watcher.id;

  if (has[id] == null) {
    has[id] = true;

    if (!flushing) {
      queue.push(watcher);
    }

    if (!waiting) {
      waiting = true;

      nextTick(flushSchedulerQueue);
    }
  }
}
