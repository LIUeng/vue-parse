# 多少天写出一个 vue mini 框架

记录自己的一个 mini vue 框架

## 第一天

### 如何解析 HTML

- 注意

* p 标签不能包含 div 等块级标签

```html
<div>
  <div></div>
</div>

<div>
  <div></div>
</div>
```

### Vue.compile 解析器

- 解析出错判断行数以及位置

```txt

```

## 第二天

### 解析 html 为 ast

### 对 ast 进行处理

得到一个父子节点的对象

- processElement

## 第三天

### 对 ast 分析生成元素

- genElement

- ast 中 events 属性值(绑定事件)
  - genData$2
  - genDirectives

### 第四天

### 生成 DOM 树