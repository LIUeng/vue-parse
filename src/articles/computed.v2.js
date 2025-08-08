// 发布订阅者模式
// Vue computed 例子
(function (exports, factory) {
  exports.Vue = factory();
})(self, function () {
  class Watcher {
    constructor(vm, fn, cb, options) {
      this.vm = vm;

      // lazy 属性用于 computed 使用
      if (options) {
        this.lazy = !!options.lazy;
      } else {
        this.lazy = false;
      }
      this.dirty = this.lazy;

      // 记录发布者
      this.deps = [];
      this.newDeps = [];
      this.depIds = new Set();
      this.newDepIds = new Set();

      // 初始执行函数
      this.fn = fn;
      this.value = this.lazy ? void 0 : this.get();
    }
    get() {
      pushTarget(this);
      let vm = this.vm;
      let value = this.fn.call(vm, vm);
      popTarget();
      this.cleanupDeps();
      return value;
    }
    addDep(dep) {
      let id = dep.id;
      if (!this.newDepIds.has(id)) {
        this.newDepIds.add(id);
        this.newDeps.push(dep);
        if (!this.depIds.has(id)) {
          // 添加订阅者
          dep.addSub(this);
        }
      }
    }
    cleanupDeps() {
      let i = this.deps.length;
      while (i--) {
        let dep = this.deps[i];
        console.log('remove sub', dep.id, !this.newDepIds.has(dep.id));
        if (!this.newDepIds.has(dep.id)) {
          dep.removeSub(this);
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
    }
    update() {
      if (this.lazy) {
        this.dirty = true;
      } else {
        this.run();
      }
    }
    run() {
      this.value = this.get();
    }
    evaluate() {
      this.value = this.get();
      this.dirty = false;
    }
    depend() {
      let i = this.deps.length;
      console.log('this.deps', this.deps);
      while (i--) {
        this.deps[i].depend();
      }
    }
    // teardown
  }

  let uid = 0;
  class Dep {
    constructor() {
      this.id = uid++;
      this.subs = [];
    }
    addSub(sub) {
      this.subs.push(sub);
    }
    removeSub(sub) {
      this.subs.splice(this.subs.indexOf(sub), 1);
    }
    depend() {
      if (Dep.target) {
        Dep.target.addDep(this);
      }
    }
    notify() {
      console.log('subs', this.subs);
      for (let i = 0; i < this.subs.length; i++) {
        this.subs[i].update();
      }
    }
  }
  Dep.target = null;
  let stack = [];
  function pushTarget(target) {
    stack.push(target);
    Dep.target = target;
  }
  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  const NOOP = function () {};
  const computedWatcherOptions = { lazy: true };
  class Vue {
    constructor(options) {
      this.$options = options;
      this.init();
    }
    init() {
      let vm = this;
      let options = this.$options;

      // data
      if (options.data) {
        let data = (vm._data = options.data.call(vm, vm));
        let keys = Object.keys(data);
        let i = keys.length;
        // 借助实例 vm._data 属性来监听实例 data 属性变化（防止 this.a = a 陷入 set get 堆栈溢出）
        while (i--) {
          let key = keys[i];
          Object.defineProperty(vm, key, {
            configurable: true,
            enumerable: true,
            get() {
              return vm._data[key];
            },
            set(value) {
              vm._data[key] = value;
            },
          });
        }
        observe(data);
      }

      // computed
      if (options.computed) {
        let computed = options.computed;
        const watchers = (vm._computeWatchers = Object.create(null));
        for (let key in computed) {
          let getter = computed[key];
          watchers[key] = new Watcher(vm, getter, NOOP, computedWatcherOptions);
          Object.defineProperty(vm, key, {
            configurable: true,
            enumerable: true,
            get() {
              let watcher = vm._computeWatchers[key];
              console.log(watcher);
              if (watcher) {
                if (watcher.dirty) {
                  watcher.evaluate();
                }
                if (Dep.target) {
                  watcher.depend();
                }
              }
              return watcher.value;
            },
            set: NOOP,
          });
        }
      }
    }
    $mount() {
      let vm = this;
      let options = this.$options;
      // 初始渲染函数
      new Watcher(vm, options.render, NOOP);
    }
  }
  function observe(value) {
    let ob = new Observer(value);
    return ob;
  }
  class Observer {
    constructor(value) {
      this.value = value;
      // 普通对象
      this.walk(value);
    }
    walk(obj) {
      let keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        defineReactive$$1(obj, keys[i]);
      }
    }
  }
  function defineReactive$$1(obj, key) {
    let dep = new Dep();
    let val = obj[key];
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: true,
      get() {
        // 获取值，发布消息
        console.log('Dep.target', Dep.target);
        if (Dep.target) {
          dep.depend();
        }
        return val;
      },
      set(newValue) {
        if (val === newValue) return;
        val = newValue;
        // 值变化了，通知更新
        dep.notify();
      },
    });
  }

  return Vue;
});

/*

渲染过程 执行 render

pushTarget(Watcher)

执行 watcher.get

收集依赖 dep.depend -> Dep.target.addDep -> dep.addSub(Watcher) -> popTarget -> cleanupDeps (deps newDeps 交换)

更新过程

按照 subs[Watcher] 顺序执行 watcher.update()

1. computed 通过 evaluate 执行 watcher.run 更新 value
  同时添加依赖等待下一次更新 dep.depend
2. render 更新方式（立即+微任务）

标题：渲染阶段

开始

实例化 watcher = new Watcher()

执行 watcher.get

pushTarget(watcher)

执行初始化函数

获取响应式数据

是 this.x

触发响应式

每一个响应式属性被定义dep = new Dep(), 触发
  - dep.depend()
  - Dep.target.addDep()
  - dep.addSub(watcher)

watcher 实例中得到 deps -> [Dep]: subs: watcher[]

否

执行函数，不触发响应式

popTarget

cleanupDeps

结束

data set

更新阶段

data set: this.x = newValue

触发响应式 dep.notify 通知更新
  初始阶段实例化 watcher 时添加的订阅者 subs: watcher[] 执行 watcher.update

执行重新渲染（微任务）
*/
