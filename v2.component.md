# Vue 组件

## 渲染组件

### 执行过程

重新调用 $mount 方法

> 解析阶段

createElement

createComponent

=> vnode 加入属性 componentOptions 和 data: { hook: {init, prepatch, insert, destroy} }

> 创建阶段

- 执行 Vue.prototype._update ---> vm.__patch__ 元素创建

- createElm - createChildren

## Vue 函数组件

createElement

createComponent

createFunctionalComponent

=> 返回虚拟 vnode

## 组件定义

```js
Vue.component(name, options);
```

关键字 **ASSET_TYPES**

> Vue.component 调用 Vue.extend 方法继承 Vue 构造组件

### 组件的生命周期

#### mounted

- patch

- invokeInsertHook

- componentVNodeHooks.insert

#### destroyed

- $destroy

- patch

- invokeDestroyHook