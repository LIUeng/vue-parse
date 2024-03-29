# vue 生命周期

vue 生命周期执行过程

## beforeCreate

- start

- initProxy Proxy 代理

- initLifecycle => 初始化实例初始值对象（$parent, $root, $children, $refs, \_watcher, \_inactive, \_directInactive, \_isMounted, \_isDestroyed, \_isBeingDestroyed)

- initEvent => 初始化实例事件对象（\_events, \_hasHookEvent）

- initRender => 初始化实例对象（\_vnode, \_staticTrees, $slots, $scopedSlots, \_c, \$createElement）

  - 响应式数据对象 defineReactive （$attrs, $listeners）

- end(执行 beforeCreate 生命周期)

## created

- start

- initInjections(vm.\$options.inject) 注入上下文

  - 加入响应式 defineReactive

- initState 初始数据 => (\_watchers)

  - 初始配置 props methods data
  - computed watch
  - 加入响应式（props, data） defineReactive

- initProvide => vm.\$options.provide 得到上下文 vm.\_provided

- end(执行 created 生命周期)

## beforeMount

`vue 中定义了两个 $mount 方法`

- start

- $mount(第二个定义调用第一个) => mountComponent => vm.$el => vm.\$options.render??

- vm.$el 初始化元素

- end(执行 beforeMount 生命周期)

## mounted

- start

- updateComponent -> vm._update

- new Watcher(vm, updateComponent, noop, {before: 'beforeUpdate' // beforeUpdate 生命周期})

- _isMounted = true

- end(执行 mounted 生命周期)

## beforeUpdate

发布通知监听（观察）者模式

`这里涉及 vue update 的更新过程`

[vue 更新过程](./Vue.update.md)

- start

- 响应式数据更新 dep = new Dep() -> dep.notify 通知更新

- 这里调用 mounted 中实例中 Watcher 对象的配置 before

- end(执行 beforeUpdate 生命周期)

## updated

## beforeDestroy

## destroyed

## activated

keep-alive 包裹组件的执行声明周期，进入

## deactivated

keep-alive 包裹组件的执行声明周期，离开

## errorCaptured

## serverPrefetch

## 父组件与子组件生命周期执行顺序

- parent before create
- parent created
- parent before mount
- child before create
- child created
- child before mount
- child mounted
- parent mounted

- parent before update
- child before update
- child updated
- parent updated

- parent before destroy
- child before destroy
- child destroyed
- parent destroyed
