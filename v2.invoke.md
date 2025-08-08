# Vue 堆栈执行

- new Vue({})

## 初始化执行

### initMixin

> initProxy

```js
vm.renderProxy = new Proxy(vm, handlers)
```

- vm._self = vm;

> initLifecycle

- vm.$parent
- vm.$root
- vm.$children
- vm.$refs

- vm._watcher = null;
- vm._inactive = null;
- vm._directInactive = false;
- vm._isMounted = false;
- vm._isDestroyed = false;
- vm._isBeingDestroyed = false;

> initEvent

- vm._events
- vm._hasHookEvent

- updateComponentListeners

// here
> initRender

- vm._vnode
- vm._staticTrees
- vm.$slots
- vm.$scopedSlots
- vm._c
- vm.$createElement

> callHook(vm, 'beforeCreate')

生命周期 beforeCreate => el

> initInjections

上下文 子子子···组件数据传递

> initState

- vm._watchers = []
- initProps
- initMethods
- initData
- initComputed
- initWatch

> initProvide

- vm._provide

> callHook(vm, 'created')

生命周期（created => el/data/props/methods/computed/watch)

#### $mount

Vue原型上定义了两个$mount方法

- Vue.prototype.$mount
- Vue.prototype.$mount

`首先执行第二处 $mount 方法`

do

> 解析模板 template 生成抽象语法树 ast

parse(praseHTML) => optimize => generate => ast(code 得到 with 块执行语句)

```md
# generate 模板解析

- genElement
- genStatic
- genOnce
- genFor
- genIf
- genChildren
- genSlot
- genComponent
- genData$2
```

=> 得到 render 方法加入到 vm.$options 对象属性中

`再执行第一处 $mount 方法`

> 挂载组件 mountComponent

=> 调用生命周期 callHook(vm, 'beforeMount')

=> 实例化 Watcher 监听

```js
// 接收五个参数 vm expOrFn cb options isRenderWatcher
new Watcher(vm, updateComponent, noop, {
  before: callHook(vm, 'beforeUpdate'),
});
```

```md
# Watcher 解析

- get
- addDep
- cleanupDeps
- update
- run
- evaluate
- depend
- teardown
```

=> 挂载完毕 callHook(vm, 'mounted')

=> 更新组件解析 callHook(vm, 'updated')

```md
# 更新解析

=> flushSchedulerQueue 刷新调度程序队列

<!-- 函数执行调用顺序 -->
<!-- 响应式 -->
defineReactive(defineProperty 监听属性的变化) => dep.notify(通知更新) => Watcher.prototype.update => queueWatcher() => nextTick(flushSchedulerQueue) => watcher.run() => Watcher.prototype.get() => this.getter(这里调用 getter 方法，就是初始化 new Watcher() 实例中参数中 updateComponent 的 vm._update ) => patch(节点的 diff 操作)
```

end

### stateMixin 实例属性

- vm.$data
- vm.$props
- vm.$set
- vm.$delete
- vm.$watch

### eventsMixin 实例事件方法

- vm.$on
- vm.$off
- vm.$once
- vm.$emit

### lifecycleMixin 实例生命周期方法

- vm._update
- vm.$forceUpdate
- vm.$destroy

### renderMixin 渲染实例方法

- vm._o(markOnce) _n(toNumber) _s(toString) _l(renderList) _t(renderSlot) _q(looseEqual) _i(looseIndexOf) _m(renderStatic) _f(resolveFilter) _k(checkKeyCodes) _b(bindObjectProps) _v(createTextNode) _e(createEmptyVNode) _u(resolveScopedSlots) _g(bindObjectListeners) _d(bindDynamicKeys) _p(prependModifier)
- vm.$nextTick
- vm._render

### initGlobalApi 全局api

- Vue.set
- Vue.delete
- Vue.nextTick
- Vue.observable
- initUse
  - Vue.use
- initMixin$1
  - Vue.mixin
- initExtend
  - Vue.extend
    - initProps$1
    - initComputed$1
- initAssetRegisters
  - Vue.component
  - Vue.directive
  - Vue.filter
- Vue.compile
