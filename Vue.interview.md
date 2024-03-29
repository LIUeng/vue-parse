# Vue 面试

## Vue key

:::tip Vue 原文
key 的特殊 attribute 主要用在 Vue 的虚拟 DOM 算法，在新旧 nodes 对比时辨识 VNodes。如果不使用 key，Vue 会使用一种最大限度减少动态元素并且尽可能的尝试就地修改/复用相同类型元素的算法。而使用 key 时，它会基于 key 的变化重新排列元素顺序，并且会移除 key 不存在的元素

有相同父元素的子元素必须有独特的 key，重复的 key 会造成渲染错误
:::

> v-for

- 不使用 key 时，最大限度减少动态元素的重新创建，尽可能的修改/复用相同类型元素
- 使用 key 时，Vue diff 算法中会根据 key 的变化重新排列元素顺序，并且会移除 key 不存在的元素

> 使用在组件或者元素中

```vue
<transition>
  <span :key="text">{{ text }}</span>
</transition>
```

- 完整触发组件的生命周期
- 触发过渡

## Vue 批处理更新

- 同一批响应式数据 data 更新 => Vue 采用微任务方式进行更新
- timerFunc => Promise - MutationObserver - setImmediate - setTimeout
- - 更新方式采用兼容的方式依次判断

```js
// 任务队列
console.log(1);
var p = Promise.resolve();
p.then(() => {
  console.log(2);
  console.log(3);
});
console.log(4);
console.log(5);
// 打印顺序为 1 4 5 2 3
```

## Vue 数组更新

## Vue 优化

- 函数式组件
- 子组件拆分/使用计算属性 computed
- 局部变量

```vue
<script>
export default {
  computed: {
    // local variables
    hello({...}) {}
  }
}
</script>
```

- v-show
- keepAlive
- 延迟加载（渲染很多节点时）
- 时间分片（远程数据加载时）
- 非响应式数据（对象嵌套层时，可以考虑对子属性设置 configurable 为 false）
- 虚拟列表（计算可视区域位移）

## 响应式数据

```js
new Vue({
  data() {},
});
```

### initProps

- proxy 代理

vm.\_props

### initMethods

- bind

### initData

函数调用链

- proxy(vm, '\_data', key) 代理每一项取值

- observe(data, true /_ asRootData _/) 监听 \_data 属性 key 变化
  - 实例化 ob = new Watcher

### initComputed

加入实例属性 vm.\_computedWatchers = Object.create(null)

```js
// computed 定义方式
({
  computed: {
    hello() {
      return '????';
    },
    hello: {
      get() {},
      set() {},
    },
  },
});
```

- 每个 computed 属性 key 加入 vm ==== 实例化 new Watcher(vm, expOrFn, cb, options = { lazy: true })
- 调用 defineComputed 方法，缓存结果调用 createComputedGetter，并且加入监听 Object.defineProperty
  - createComputedGetter 闭包 = watcher[key] === 调用相关的 watcher 方法 watcher.evaluate?depend? = watcher.value

### initWatch

```js
// watch 定义方法
({
  watch: {
    // 函数
    hello(n, v) {},
    // 对象
    hello: {
      deep: true, // 嵌套观察 数组不需要
      immediate: true, // 立即调用一次 handler
      handler: function () {},
    },
    // 字符串
    'hello.a'() {}, // 这里调用实例vm的定义的字符串方法
    // 数组
    hello: [
      // 函数or对象
    ],
  },
});
```

- createWatcher === 调用 vm.$watch(属性名, 处理方法, 配置)
- Vue.prototype.$watch
  - 把 watch 中定义的属性实例化 new Watcher(vm, expOrFn /_ watch key _/, cb, options = { user: true })
  - 返回一个方法调用 watcher.teardown

## Watcher 类

接收 5 个参数 vm, expOrFn, cb, options, isRenderWatcher

- 初始化

  - 实例属性加入 \_watchers 和 isRenderWatch ? \_watcher
  - options 参数 === deep lazy user sync before
  - 实例化属性有：cb id dirty active = lazy deps = [] newDeps = [] depIds/newDepIds = new Set() expression value = this.lazy ? undefined : this.get() getter

- Watcher.prototype.get
  - pushTarget(this)
  - 调用 getter 方法
  - popTarget cleanupDeps

## 响应式原理

### 发布订阅者模式

- 初始化属性 initProps

- 初始化数据 initData

  1. 实例化监听 Obserser 类，同时订阅 dep = new Dep，并且定义 \_\_ob\_\_ 属性用于与子属性联系起来
  2. 使用 Object.defineProperty 监听每一项属性(数组特殊处理)
  3. defineReactive 方法注入发布 dep = new Dep 使得响应式更新串联起来

- 初始化计算属性 initComputed

  1. 计算属性的每一项属性都加入监听 Object.defineProperty
  2. 计算属性的每一个属性都实例化得到一个 watcher 类用于更新值 new Watcher
  3. 实例化 Watcher 选项参数为 lazy 为 true，这里不加入更新队列 queueWatcher，内部自身更新值

- 初始化变化属性 initWatch

  1. 解析 watch 对象的属性，触发 initData 时定义响应式数据的 get 方法，不断发布变化 dep = new Dep ==== dep.depend
  2. dep === dep.depend === Watcher.addDep === Dep.addSubs 实则是添加订阅 subs 数组(watcher 对象)
  3. 遍历 subs，加入更新队列，监听变化时通知变化 dep.notify，触发 watcher.update，调用 queueWatcher 方法（微任务更新方式）

:::warning 为什么能确定 watch 属性值的变化了
data 或者 props 响应式数据更新之后，触发 dep.depend 添加 watcher 到更新队列中
:::

### 队列执行

`queueWatcher`

1. 定义微任务执行 timerFunc

Promise.then === MutationObserver === setTimeout === setImmediate 依次向下兼容（按照顺序支持哪个就用哪个）

2. 队列中的更新处理

更新队列 queue 中加入要更新的 watcher，直到微任务执行一次，还有任务继续加入队列中，微任务执行（一个周期）
