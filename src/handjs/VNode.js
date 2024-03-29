/* eslint-disable no-undef */
'use strict';

// create vnode
function VNode(tag, data, children, text, elm, context) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.elm = elm;
  this.context = context;
  this.text = text;
  this.isComment = false;
  this.isCloned = false;
  this.parent = undefined;
}

// clone node
function cloneVNode(vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context
  );
  cloned.isCloned = true;
  cloned.isComment = false;
  return cloned;
}

// node handles here
function createElement$1(tagName, vnode = null) {
  var elm = document.createElement(tagName);
  return elm;
}

function createTextNode(text) {
  return document.createTextNode(text);
}

function createComment(text) {
  return document.createComment(text);
}

function insertBefore(parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode);
}

function removeChild(node, child) {
  node.removeChild(child);
}

function appendChild(node, child) {
  node.appendChild(child);
}

function parentNode(node) {
  return node.parentNode;
}

function nextSibling(node) {
  return node.nextSibling;
}

function tagName(node) {
  return node.tagName;
}

function setTextContent(node, text) {
  node.textContent = text;
}

function setStyleScope(node, scopeId) {
  node.setAttribute(scopeId, '');
}

// patch node
var nodeOps = Object.freeze({
  __proto__: null,
  createElement: createElement$1,
  createTextNode,
  createComment,
  insertBefore,
  removeChild,
  appendChild,
  parentNode,
  nextSibling,
  tagName,
  setTextContent,
  setStyleScope,
});

var emptyNode = new VNode('', {}, []);
var hooks = ['create', 'update'];

var baseModules = [];

var directives = {
  update: updateDirectives,
  create: updateDirectives,
  destroy: function unbindDirectives(vnode) {
    updateDirectives(vnode, emptyNode);
  },
};

var emptyModifiers = Object.create(null);

function normalizeDirectives$1(dirs, vm) {
  var res = Object.create(null);
  if (!dirs) {
    return res;
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  return res;
}

function resolveAsset() {}

function getRawDirName(dir) {
  return (
    dir.rawName || dir.name + '.' + Object.keys(dir.modifiers || {}).join('.')
  );
}

function updateDirectives(oldVnode, vnode) {
  if (oldVnode.data.directives || vnode.directives) {
    _update(oldVnode, vnode);
  }
}

function _update(oldVnode, vnode) {
  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  var oldDirs = normalizeDirectives$1(
    oldVnode.data.directives,
    oldVnode.context
  );
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);
}

var attrs = {
  create: updateAttrs,
  update: updateAttrs,
};

function updateAttrs(oldVnode, vnode) {
  var key, cur, old;
  var elm = vnode.elm;
  var attrs = vnode.data.attrs || {};
  var oldAttrs = oldVnode.data.attrs || {};
  if (attrs.__ob__) {
    // here comment
  }
  // cur attrs
  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (cur !== old) {
      setAttr(elm, key, cur);
    }
  }
  // old attrs
  // ignore ie/edge
  for (key in oldAttrs) {
    if (!attrs[key]) {
      elm.removeAttribute(key);
    }
  }
}

function setAttr(elm, key, value) {
  // wait
  elm.setAttribute(key, value);
}

var domProps = {
  create: updateDOMProps,
  update: updateDOMProps,
};

function updateDOMProps(oldVnode, vnode) {
  var key, cur;
  var elm = vnode.elm;
  var oldProps = oldVnode.data.domProps || {};
  var props = vnode.data.domProps || {};
  for (key in oldProps) {
    if (!(key in props)) {
      elm[key] = '';
    }
  }
  for (key in props) {
    cur = props[key];
    if (cur !== oldProps[key]) {
      try {
        elm[key] = cur;
      } catch (e) {
        // ignore if
      }
    }
  }
}

var events = {
  create: updateDOMListeners,
  update: updateDOMListeners,
};

var target$1;

function updateDOMListeners(oldVnode, vnode) {
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  updateListeners(on, oldOn, add$1, remove$2, null, vnode.context);
  target$1 = undefined;
}

function updateListeners(on, oldOn, add, remove, once, vm) {
  var name, cur, old, event, def;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    if (!cur) {
      // warn
    } else if (!old) {
      add(name, cur, false, false, false);
    } else if (cur !== old) {
      // compare
      old.fns = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) {
    // remove events
  }
}

function add$1(name, handler, a, b, c) {
  target$1.addEventListener(name, handler, false);
}

function remove$2() {}

var platformModules = [
  attrs,
  // klass,
  events,
  domProps,
  // style,
];
var modules = platformModules.concat(baseModules);

function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag && isDef(a.data) === isDef(b.data);
}

/// start
var patch = createPatchFunction({ nodeOps, modules });
function createPatchFunction(backend) {
  var i, j;
  var cbs = {};

  var nodeOps = backend.nodeOps;
  var modules = backend.modules;

  for (i = 0; i < hooks.length; i++) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; j++) {
      if (modules[j][hooks[i]]) {
        cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
  }

  // console.log(cbs);

  function invokeCreateHooks(vnode, insertedVnodeQueue) {
    for (var i$1 = 0; i$1 < cbs.create.length; i$1++) {
      cbs.create[i$1](emptyNode, vnode);
    }
  }

  function emptyNodeAt(elm) {
    return new VNode(elm.tagName, {}, [], undefined, elm);
  }

  function insert(parent, elm, ref) {
    if (parent) {
      if (ref) {
        if (nodeOps.parentNode(ref) === parent) {
          nodeOps.insertBefore(parent, elm, ref);
        }
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  function createChildren(vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        createElm(
          children[i],
          insertedVnodeQueue,
          vnode.elm,
          null,
          true,
          children,
          i
        );
      }
    } else if (vnode.text) {
      nodeOps.appendChild(
        vnode.elm,
        nodeOps.createTextNode(String(vnode.text))
      );
    }
  }

  function createElm(
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
    if (vnode.elm && Array.isArray(ownerArray)) {
      vnode = ownerArray[index] = cloneVNode(vnode);
    }
    // console.log(123);
    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (tag) {
      // handle tag
      vnode.elm = nodeOps.createElement(tag);
      // create children
      {
        createChildren(vnode, children, insertedVnodeQueue);
        if (data) {
          invokeCreateHooks(vnode, insertedVnodeQueue);
        }
        insert(parentElm, vnode.elm, refElm);
      }
    } else {
      // text node
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }
  }

  function updateChildren(elm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    var oldStartIdx = 0;
    var newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[oldStartIdx];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[newStartIdx];
    var newEndVnode = newCh[newEndIdx];
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        // move to left
        oldStartVnode = oldCh[oldStartIdx++];
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(
          oldStartVnode,
          newStartVnode,
          insertedVnodeQueue,
          newCh,
          newStartIdx
        );
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndIdx, oldStartIdx, insertedVnodeQueue, newCh, newEndIdx);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else {
        // here wait
      }
    }
  }

  function patchVnode(
    oldVnode,
    vnode,
    insertedVnodeQueue,
    ownerArray,
    index,
    removeOnly
  ) {
    if (oldVnode === vnode) return;
    var elm = (vnode.elm = oldVnode.elm);
    var i;
    var data = vnode.data;
    var oldCh = oldVnode.children;
    var ch = vnode.children;
    // eslint-disable-next-line no-undef
    if (isDef(data) && isDef(vnode.tag)) {
      for (i = 0; i < cbs.update.length; i++) {
        cbs.update[i](oldVnode, vnode);
      }
    }
    // eslint-disable-next-line no-undef
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) {
          updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
        }
      } else if (isDef(ch)) {
        // add vnodes
      } else if (isDef(oldCh)) {
        // remove vnodes
      } else if (isDef(oldVnode.text)) {
        nodeOps.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      nodeOps.setTextContent(elm, vnode.text);
    }
  }

  return function patch(oldVnode, vnode, hydrating, removeOnly) {
    var isInitialPatch = false;
    var insertedVnodeQueue = [];
    if (oldVnode === undefined) {
      // here handle
      isInitialPatch = true;
      createElm(oldVnode, insertedVnodeQueue);
    } else {
      // diff
      // debugger;
      var isRealElement = !!oldVnode.nodeType;
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patchVnode
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
      } else {
        // create elm
        if (isRealElement) {
          oldVnode = emptyNodeAt(oldVnode);
        }
        var oldElm = oldVnode.elm;
        var parentElm = nodeOps.parentNode(oldElm);
        // sayHello();
        createElm(
          vnode,
          insertedVnodeQueue,
          parentElm,
          nodeOps.nextSibling(oldElm)
        );
      }
    }
    return vnode.elm;
  };
}
