// @ts-nocheck
'use strict';

/**
 * umd
 * parse template
 */

var jsx = `
<div class="container" @click="ok">
    <div>hello</div>
    <div>world</div>
    <input type="text" v-model="a" />
</div>
`;

/*
{
    tag: div
    children: []
}
*/

// make attrs map
function makeAttrsMap(attrs) {
  var map = {};
  for (var i = 0; i < attrs.length; i++) {
    var item = attrs[i];
    map[item.name] = item.value;
  }
  return map;
}

// make map
function makeMap(str) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return function (val) {
    return map[val];
  };
}

// extend
function extend(to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to;
}

// query
function query(el) {
  if (typeof el === 'string') {
    el = document.querySelector(el);
  }
  return el;
}

// has
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// def
function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true,
  });
}

// remove
function remove(arr, item) {
  if (arr.length) {
    var i = arr.indexOf(item);
    if (i > -1) {
      arr.splice(item, 1);
    }
  }
}

// unecessary tag
var uid$1 = 0;
var isUnaryTags = 'input';
const noop = function () {};
// var emptyObject = Object.freeze({});

(function (global, factory) {
  if (typeof global !== undefined) {
    factory(global);
  }
})(window ? window : global, function (global) {
  // plugin module
  function pluckModuleFunction(modules, key) {
    return modules
      ? modules
          .map(function (m) {
            return m[key];
          })
          .filter(function (_) {
            return _;
          })
      : [];
  }
  // create ast
  function createASTElement(tag, attrs, parent) {
    return {
      type: 1,
      tag,
      attrsList: attrs,
      attrsMap: makeAttrsMap(attrs),
      rawAttrsMap: {},
      parent,
      children: [],
    };
  }

  // transform node
  function transformNode(el, options = {}) {
    var staticClass = getAndRemoveAttr(el, 'class');
    if (staticClass) {
      el.staticClass = JSON.stringify(staticClass);
    }
  }

  // gen data
  function genData(el) {
    var data = '';
    if (el.staticClass) {
      data += 'staticClass:' + el.staticClass + ',';
    }
    return data;
  }

  // gen data II
  function genData$2(el, state) {
    var data = '{';
    var dirs = genDirectives(el, state);
    if (dirs) {
      data += dirs + ',';
    }
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }
    if (el.attrs) {
      data += 'attrs:' + genProps(el.attrs) + ',';
    }
    if (el.props) {
      data += 'domProps:' + genProps(el.props) + ',';
    }
    if (el.events) {
      data += genHandlers(el.events, false) + ',';
    }
    data = data.replace(/,$/, '') + '}';
    return data;
  }

  // gen directives
  function genDirectives(el, state) {
    var dirs = el.directives;
    if (!dirs) return;
    var res = 'directives:[';
    var hasRuntime = false;
    var i, l, dir, needRuntime;
    for (i = 0, l = dirs.length; i < l; i++) {
      dir = dirs[i];
      needRuntime = true;
      // here add props input value
      var gen = state.directives[dir.name];
      if (gen) {
        needRuntime = !!gen(el, dir);
      }
      if (needRuntime) {
        hasRuntime = true;
        res +=
          '{name:"' +
          dir.name +
          '",rawName:"' +
          dir.rawName +
          '"' +
          (dir.value
            ? ',value:(' +
              dir.value +
              '),expression:' +
              JSON.stringify(dir.value)
            : '') +
          '},';
      }
    }
    if (hasRuntime) {
      return res.slice(0, -1) + ']';
    }
  }

  // gen props
  function genProps(props) {
    var staticProps = '';
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      var value = prop.value;
      staticProps += '"' + prop.name + '":' + value + ',';
    }
    staticProps = '{' + staticProps.slice(0, -1) + '}';
    return staticProps;
  }

  // gen events
  function genHandlers(events) {
    var prefix = 'on:';
    var staticHandlers = '';
    for (var name in events) {
      var handlerCode = genHandler(events[name]);
      staticHandlers += '"' + name + '":' + handlerCode + ',';
    }
    staticHandlers = '{' + staticHandlers.slice(0, -1) + '}';
    return prefix + staticHandlers;
  }

  var simplePathRE = /^[A-Za-z_$][\w$]*$/;
  var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;
  var fnInvokeRE = /\([^)]*?\);*$/;
  // gen handle
  function genHandler(handler) {
    if (!handler) {
      return 'function(){}';
    }
    var isMethodPath = simplePathRE.test(handler.value);
    var isFunctionExpression = fnExpRE.test(handler.value);
    var isFunctionInvocation = simplePathRE.test(
      handler.value.replace(fnInvokeRE, '')
    );
    if (isMethodPath || isFunctionExpression) {
      return handler.value;
    }
    return (
      'function($event){' +
      (isFunctionInvocation ? 'return ' + handler.value : handler.value) +
      '}'
    );
  }

  // get and remove attr
  function getAndRemoveAttr(el, key) {
    var val;
    if ((val = el.attrsMap[key]) !== null) {
      var l = el.attrsList,
        i;
      for (i = 0; i < l.length; i++) {
        if (l[i].name === key) {
          l.splice(i, 1);
          break;
        }
      }
    }
    return val;
  }

  var class$1 = {
    staticKeys: ['staticClass'],
    transformNode,
    genData,
  };

  const module$1 = [class$1];

  function model(el, dir, _warn = null) {
    // here only handle input tag
    var tag = el.tag;
    var value = dir.value;

    var code = '';
    if (tag === 'input') {
      code =
        'if($event.target.composing)return;' + value + '=$event.target.value';
    }
    addProps(el, 'value', '(' + value + ')');
    addHandler(el, 'input', code);
    return true;
  }

  const directive$1 = {
    model,
  };

  var isUnaryTag = makeMap(isUnaryTags);

  var baseOptions = {
    modules: module$1,
    directives: directive$1,
    isUnaryTag,
  };

  // generate
  var CodegenState = function CodegenState(options) {
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    this.directives = options.directives;
    this.staticRenderFns = [];
    this.onceId = 0;
  };

  function generate(ast, options) {
    var state = new CodegenState(options);
    var code = ast ? genElement(ast, state) : '_c(div)';
    return {
      render: 'with(this){return ' + code + '}',
      staticRenderFns: state.staticRenderFns,
    };
  }

  // gen element
  function genElement(el, state) {
    if (el.parent) {
      el.pre = el.pre || el.parent.pre;
    }
    if (el.wait) {
      // wait
    } else {
      var code;
      // here temp
      var data;
      if (!el.plain) {
        data = genData$2(el, state);
      }
      var children = el.inlineTemplate ? null : genChildren(el, state, true);
      code =
        '_c("' +
        el.tag +
        '"' +
        (data ? ',' + data : '') +
        (children ? ',' + children : '') +
        ')';
    }
    return code;
  }

  // gen text
  function genText(text) {
    text = text.type == 2 ? text.expression : '"' + text.text + '"';
    return '_v(' + text + ')';
  }

  // gen children
  function genChildren(el, state, skip) {
    var children = el.children;
    if (children.length) {
      var gen = genNode;
      return (
        '[' +
        children
          .map(function (c) {
            return gen(c, state);
          })
          .join(',') +
        ']'
      );
    }
  }

  // gen node
  function genNode(el, state) {
    if (el.type === 1) {
      return genElement(el, state);
    } else {
      // @ts-ignore
      return genText(el, state);
    }
  }

  // parse text
  var tagReg = /\{\{((?:.|\r?\n)+?)\}\}/g;
  function parseText(text) {
    if (!tagReg.test(text)) {
      return;
    }
    var match,
      index,
      tokens = [],
      rawTokens = [],
      tokenValues;
    var lastIndex = (tagReg.lastIndex = 0);
    while ((match = tagReg.exec(text))) {
      index = match.index;
      if (index > lastIndex) {
        rawTokens.push((tokenValues = text.slice(lastIndex, index)));
        tokens.push(JSON.stringify(tokenValues));
      }
      var exp = match[1].trim();
      tokens.push('_s(' + exp + ')');
      rawTokens.push({
        '@binding': exp,
      });
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
      rawTokens.push((tokenValues = text.slice(lastIndex)));
      tokens.push(JSON.stringify(tokenValues));
    }
    // console.log(tokens.join('+'));
    return {
      expression: tokens.join('+'),
      tokens: rawTokens,
    };
  }

  var transforms;

  function parse(template, options) {
    var root,
      currentParent,
      stack = [];
    transforms = pluckModuleFunction(options.modules, 'transformNode');
    function trimEndingWhiteSpace(el) {
      if (el) {
        var lastNode;
        while (
          (lastNode = el.children[el.children.length - 1]) &&
          lastNode.type === 3 &&
          lastNode.text === ' '
        ) {
          el.children.pop();
        }
      }
    }
    function closeElement(element) {
      trimEndingWhiteSpace(element);
      element = processElement(element);
      if (currentParent) {
        currentParent.children.push(element);
        element.parent = currentParent;
      }
    }
    function warn(msg, { start, end }) {
      var spacelen = template.match(/^\s*/)[0].length,
        range = 2;
      start = start + spacelen;
      end = spacelen + end;
      var lines = template.split(/\r?\n/),
        count = 0,
        errors = [],
        diff = end - start;
      // console.log(lines, start, end);
      for (var i = 0; i < lines.length; i++) {
        count += lines[i].length + 1;
        if (count >= start) {
          for (var j = i - range; j <= i + range || end > count; j++) {
            if (j < 0 || j >= lines.length) continue;
            var lineLen = lines[j].length;
            errors.push(
              j + 1 + repeat$1(3 - String(j + 1).length, ' ') + '|  ' + lines[j]
            );
            // console.log(j, i);
            if (j === i) {
              var pad = start - (count - lineLen) + 1;
              var length = end > count ? lineLen - pad : end - start;
              errors.push(
                '   |  ' + repeat$1(pad, ' ') + repeat$1(length, '^')
              );
            } else if (j > i) {
              if (end > count) {
                var length$1 = Math.min(end - count, lineLen);
                errors.push('   |  ' + repeat$1(length$1, '^'));
              }
              count += lineLen + 1;
            }
          }
          break;
        }
      }
      // eslint-disable-next-line no-console
      console.error(msg + '\n' + errors.join('\n'));
    }
    function repeat$1(n, str) {
      var result = '';
      if (n > 0) {
        while (true) {
          // eslint-disable-line
          if (n & 1) {
            result += str;
          }
          n >>>= 1;
          if (n <= 0) {
            break;
          }
          str += str;
        }
      }
      return result;
    }
    parseHTML(template, {
      modules: options.modules,
      warn,
      isUnaryTag: options.isUnaryTag,
      char(text, start, end) {
        if (!currentParent) return;
        var children = currentParent.children;
        if (text.trim()) {
          text = text;
        } else if (!children.length) {
          text = '';
        } else {
          text = ' ';
        }
        var child;
        var res;
        if (text) {
          if (text !== ' ' && (res = parseText(text))) {
            child = {
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text: text,
            };
          } else if (
            text !== ' ' ||
            !children.length ||
            children[children.length - 1].text !== ' '
          ) {
            child = {
              type: 3,
              text: text,
            };
          }
          if (child) {
            child.start = start;
            child.end = end;
            children.push(child);
          }
        }
      },
      start(tag, attrs, _start, _end) {
        var element = createASTElement(tag, attrs, currentParent);
        element.start = _start;
        element.end = _end;
        element.rawAttrsMap = attrs.reduce((acc, attr) => {
          acc[attr.name] = attr;
          return acc;
        }, {});
        if (!root) {
          root = element;
        }
        if (!isUnaryTag(tag)) {
          currentParent = element;
          stack.push(element);
        } else {
          closeElement(element);
        }
      },
      end(tag, _start, _end) {
        var element = stack[stack.length - 1];
        stack.length -= 1;
        currentParent = stack[stack.length - 1];
        element.end = _end;
        closeElement(element);
      },
    });
    return root;
  }
  // var attributeReg = /\s*([^\s<>"'\/=]*)(\s*=)\s*(?:"([^\s<>"'`\/=]*)")\s*/;
  var attributeReg = /^\s*([^\s<>"'\\/=]+)(?:(\s*=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s<>"'`\\/=]+)))?/;
  var tagNameReg = '[a-zA-Z_][a-zA-Z_0-9]*';
  var startTagReg = new RegExp('^<(' + tagNameReg + ')');
  var startTagCloseReg = /^\s*(\/)?>/;
  var endTagReg = new RegExp('^</(' + tagNameReg + ')[^>]*>');
  var isPlainTextElement = makeMap('script,style,textarea');
  function parseHTML(template, options) {
    // stack message
    var last,
      index = 0,
      html = template.trim(),
      stack = [],
      lastTag;
    while (html) {
      last = html;
      if (!lastTag || !isPlainTextElement(lastTag)) {
        var start_i = html.indexOf('<');
        // start >
        if (start_i === 0) {
          // end </
          var endTagMatch = html.match(endTagReg);
          if (endTagMatch) {
            var curIndex = index;
            advance(endTagMatch[0].length);
            parseEndTag(endTagMatch[1], curIndex, index);
            continue;
          }

          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            handleStartTag(startTagMatch);
            continue;
          }
        }

        // char >
        var text, rest;
        if (start_i > 0) {
          rest = html.slice(start_i);
          // temp
          // while(!endTagReg.test(rest)) {
          //     // temp handle
          // }
          text = html.substring(0, start_i);
        }

        if (text) {
          advance(text.length);
        }

        // console.log(html, text, start_i);
        if (options.char) {
          options.char(text, index - text.length, index);
        }
      }
      // if(last === html) {
      //     // wait handles
      // }
    }
    // clear up
    parseEndTag();
    function parseStartTag() {
      var start = html.match(startTagReg);
      if (start) {
        var match = {
          tagName: start[1],
          attrs: [],
          start: index,
        };
        advance(start[0].length);
        var end, attr;
        while (
          !(end = html.match(startTagCloseReg)) &&
          (attr = html.match(attributeReg))
        ) {
          if (attr) {
            attr.start = index;
            advance(attr[0].length);
            attr.end = index;
            match.attrs.push(attr);
          }
        }
        if (end) {
          advance(end[0].length);
          match.end = index;
          return match;
        }
      }
    }
    function handleStartTag(match) {
      var tagName = match.tagName;
      var l = match.attrs.length;
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        var item = match.attrs[i];
        var value = item[3] || item[4] || item[5];
        attrs[i] = {
          name: item[1],
          value,
          start: item.start + item[0].match(/^\s*/).length,
          end: item.end,
        };
      }
      // cache error stack pos
      var unary = options.isUnaryTag(tagName);
      if (!unary) {
        stack.push({
          tagName,
          lowerCasedTag: tagName.toLowerCase(),
          attrs,
          start: match.start,
          end: match.end,
        });
        lastTag = tagName;
      }
      if (options.start) {
        options.start(tagName, attrs, match.start, match.end);
      }
    }
    function parseEndTag(tagName, start, end) {
      var pos, lowerCasedTagName;
      if (start === null) start = index;
      if (end === null) end = index;
      // find the closest tag same type
      if (tagName) {
        lowerCasedTagName = tagName;
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break;
          }
        }
      } else {
        pos = 0;
      }
      if (pos >= 0) {
        for (var i = stack.length - 1; i >= pos; i--) {
          if (i > pos || !tagName) {
            options.warn(
              'tag <' + stack[i].tagName + '> has no match close tag',
              { start: stack[i].start, end: stack[i].end }
            );
          }
          if (options.end) {
            options.end(stack[i].tag, start, end);
          }
        }
        stack.length = pos;
        lastTag = pos && stack[pos - 1].tag;
      }
    }
    function advance(i) {
      index += i;
      html = html.substring(i);
    }
  }

  // gen element
  var bindRE = /^:|^\.|^v-bind:/g;
  var onRE = /^@|^v-on:/;
  var dirRE = /^v-|^@|^:|^#/;
  var dynamicArgRE = /^\[.*\]$/;
  var argRE = /:(.*)$/;
  function processElement(element) {
    element.plain =
      !element.key && !element.scopedSlots && !element.attrsList.length;
    // process attrs
    var list = element.attrsList;
    var i, name, rawName, isDynamic, value;

    // transform node
    for (var j = 0; j < transforms.length; j++) {
      transforms[j](element);
    }

    for (i = 0; i < list.length; i++) {
      name = rawName = list[i].name;
      value = list[i].value;
      if (dirRE.test(name)) {
        element.hasBindings = true;
        if (bindRE.test(name)) {
          // v-bind
        } else if (onRE.test(name)) {
          // v-on
          name = name.replace(onRE, '');
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            name = name.slice(1, -1);
          }
          addHandler(element, name, value, list[i], isDynamic);
        } else {
          // normal directive
          name = name.replace(dirRE, '');
          var argMatch = name.match(argRE);
          var arg = argMatch && argMatch[1];
          isDynamic = false;
          if (arg) {
            // name = name;
          }
          addDirectives(element, name, rawName, value, arg, isDynamic, list[i]);
          if (name === 'model') {
            // v-model
          }
        }
      } else {
        addAttrs(element, name, JSON.stringify(value), isDynamic, list[i]);
      }
    }
    return element;
  }

  // add attrs
  function addAttrs(el, name, value, dynamic, range) {
    var attrs = dynamic
      ? el.dynamicAttrs || (el.dynamicAttrs = [])
      : el.attrs || (el.attrs = []);
    attrs.push(
      rangeSetItem(
        {
          name,
          value,
          dynamic,
        },
        range
      )
    );
    el.plain = false;
  }

  // add directives
  function addDirectives(el, name, rawName, value, arg, dynamic, range) {
    (el.directives || (el.directives = [])).push(
      rangeSetItem(
        {
          name,
          rawName,
          value,
          arg,
          dynamic,
        },
        range
      )
    );
    el.plain = false;
  }

  // add event handler
  function addHandler(el, name, value, range, dynamic) {
    // var modifier =
    var events;
    events = el.events || (el.events = {});
    var newHandler = rangeSetItem({ value: value.trim(), dynamic }, range);
    var handlers = events[name];
    if (!handlers) {
      events[name] = newHandler;
    }
    el.plain = false;
  }

  // add props
  function addProps(el, name, value, range, dynamic) {
    (el.props || (el.props = [])).push(
      rangeSetItem(
        {
          name,
          value,
          dynamic,
        },
        range
      )
    );
    el.plain = false;
  }

  // range set item
  function rangeSetItem(item, range) {
    if (range) {
      if (range.start !== null) {
        item.start = range.start;
      }
      if (range.end !== null) {
        item.end = range.end;
      }
    }
    return item;
  }

  // _s
  function toString(val) {
    return val == null
      ? ''
      : Array.isArray(val)
      ? JSON.stringify(val, null, 2)
      : String(val);
  }

  // observe
  function observe(value, asRootData) {
    // eslint-disable-next-line no-undef
    if (!isObject(value) || value instanceof VNode) return;
    var ob;
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
      ob = value.__ob__;
    } else {
      ob = new Observer(value);
    }
    if (asRootData && ob) {
      ob.vmCount++;
    }
    return ob;
  }
  function Observer(value) {
    this.value = value;
    this.vmCount = 0;
    this.dep = new Dep();
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      // observe array
    } else {
      this.walk(value);
    }
  }
  Observer.prototype.walk = function walk(obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  };
  function defineReactive(obj, key, val, customSetter, shallow) {
    var dep = new Dep();
    var property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
      return;
    }
    var setter = property && property.set;
    var getter = property && property.get;
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key];
    }
    var childOb = !shallow && observe(val);
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: true,
      get: function reactiveGetter() {
        var value = getter ? getter.call(obj) : val;
        if (Dep.target) {
          dep.depend();
          if (childOb) {
            // here? array???
          }
        }
        return value;
      },
      set: function reactiveSetter(newVal) {
        var value = getter ? getter.call(obj) : val;
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return;
        }
        if (customSetter) {
          customSetter();
        }
        if (getter && !setter) return;
        if (setter) {
          setter.call(obj);
        } else {
          val = newVal;
        }
        childOb = !shallow && observe(val);
        dep.notify();
      },
    });
  }
  var uid = 0;
  function Dep() {
    this.uid = ++uid;
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
    var subs = this.subs.slice();
    // sort id???
    for (var i = 0; i < subs.length; i++) {
      subs[i].update();
    }
  };
  Dep.target = null;
  var targetStack = [];
  function pushTarget(target) {
    targetStack.push(target);
    Dep.target = target;
  }

  function popTarget() {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
  }

  // render helper
  function installRenderHelpers(target) {
    target._v = createTextVNode;
    target._s = toString;
  }

  // init state
  function initState(vm) {
    if (vm.$options.data) {
      initData(vm.$options.data, vm);
    }
  }
  var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
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

  function initData(data, vm) {
    data = vm._data =
      typeof data === 'function' ? getData(data, vm) : data || {};
    var keys = Object.keys(data);
    var i = keys.length;
    while (i--) {
      var key = keys[i];
      // props
      // methods
      proxy(vm, '_data', key);
    }
    observe(data, true);
  }
  function getData(data, vm) {
    // push
    try {
      return data.call(vm, vm);
    } catch (error) {
      console.error('[init data error]', error);
      return {};
    }
    // pop
  }

  if (!global.parse) {
    global.parse = parse;
  }
  if (!global.generate) {
    global.generate = generate;
  }

  // create text vnode
  function createTextVNode(val) {
    // eslint-disable-next-line no-undef
    return new VNode(undefined, undefined, undefined, String(val));
  }
  // create empty vnode
  function createEmptyVNode(text) {
    if (text === void 0) text = '';
    // eslint-disable-next-line no-undef
    var node = new VNode();
    node.text = text;
    node.isComment = true;
    return node;
  }

  // create element
  function createElement(context, tag, data, children) {
    if (Array.isArray(data)) {
      children = data;
      data = undefined;
    }
    if (!tag) {
      return createEmptyVNode();
    }
    if (Array.isArray(children) && typeof children[0] === 'function') {
      data = data || {};
      children.length = 0;
    }
    var vnode;
    if (typeof tag === 'string') {
      if (tag !== ' ') {
        // eslint-disable-next-line no-undef
        vnode = new VNode(tag, data, children, undefined, undefined, context);
      } else {
        // eslint-disable-next-line no-undef
        vnode = new VNode(tag, data, children, undefined, undefined, context);
      }
    }
    if (Array.isArray(vnode)) {
      return vnode;
    } else if (vnode) {
      return vnode;
    } else {
      return createEmptyVNode();
    }
  }

  function Mvvm(options) {
    this.$options = options;
    this._init();
  }

  Mvvm.prototype._init = function () {
    var vm = this;
    // init proxy
    var hasProxy = typeof Proxy !== undefined ? true : false;
    if (hasProxy) {
      vm._renderProxy = new Proxy(vm, {});
    } else {
      vm._renderProxy = vm;
    }
    vm._self = vm;
    // init render
    installRenderHelpers(vm);
    // init data
    initState(vm);
    // tag, data, children, nomarlizetype, always nomarlize type
    vm._c = function (a, b, c, d) {
      return createElement(vm, a, b, c, d, false);
    };
    // init state
    vm._watchers = [];
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };

  // function initRender

  Mvvm.prototype._update = function (vnode) {
    var vm = this;
    var prevEl = vm.$el;
    var prevVnode = vm._node;
    vm._node = vnode;
    if (!prevVnode) {
      // init
      vm.$el = vm.__patch__(vm.$el, vnode, false, false);
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // HOC
    // if()
  };

  var currentRenderingInstance = null;
  Mvvm.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
    var vnode;
    try {
      currentRenderingInstance = vm;
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      console.error('[Render Error]', e);
    } finally {
      currentRenderingInstance = null;
    }
    return vnode;
  };

  var Watcher = function Watcher(vm, expOrFn, cb, options, isRenderWatcher) {
    this.vm = vm;
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);
    this.cb = cb;
    this.id = ++uid$1;
    this.active = true;
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    this.expression = expOrFn.toString();
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    }
    this.value = this.get();
  };

  Watcher.prototype.get = function get() {
    pushTarget(this);
    var value;
    var vm = this.vm;
    try {
      value = this.getter.call(vm, vm);
    } catch (e) {
      // instanbul ignore if
      console.error(e);
    } finally {
      popTarget();
      this.cleanupDeps();
    }
    return value;
  };

  Watcher.prototype.addDep = function addDep(dep) {
    var id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  };

  Watcher.prototype.cleanupDeps = function cleanupDeps() {
    var i = this.deps.length;
    while (i--) {
      var dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    var tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  };

  Watcher.prototype.update = function update() {
    queueWatcher(this);
  };

  Watcher.prototype.run = function run() {
    // this.active
    if(this.active) {
      var value = this.get();
    }
  };

  Watcher.prototype.evalute = function evalute() {
    this.value = this.get();
    this.dirty = false;
  };

  Watcher.prototype.depend = function depend() {
    var i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  };

  Watcher.prototype.teardown = function teardown() {
    // this.active
  };

  var currentFlushTimestamp = 0;
  var index = 0;
  var isUsingMicroTask = false;
  var queue = [];
  var waiting = false;
  var flushing = false;
  var has = {};
  var callbacks = [];
  var pending = false;

  function resetSchedulerState() {
    index = queue.length = 0;
    has = {};
    waiting = flushing = false;
  }

  function flushSchedulerQueue() {
    currentFlushTimestamp = Date.now();
    flushing = true;
    var watcher, id;
    // sort by id
    queue.sort((a, b) => a.id - b.id);
    for(index = 0; index < queue.length; index++) {
      // watcher before
      // before update
      watcher = queue[index];
      id = watcher.id;
      has[id] = null;
      watcher.run();
      // here handle id not null
      // infinite loop
    }
    // reset schedule state
    resetSchedulerState();
  }

  function flushCallbacks() {
    pending = false;
    var copies = callbacks.slice();
    callbacks.length = 0;
    for(var i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  var timerFunc;
  if(typeof Promise !== undefined) {
    var p = Promise.resolve();
    timerFunc = function() {
      p.then(flushCallbacks);
      isUsingMicroTask = true;
    }
  }

  function nextTick(cb, ctx) {
    var _resolve;
    callbacks.push(function() {
      if(cb) {
        try {
          cb.call(ctx);
        } catch(e) {
          // _resolve error
        }
      }
    })
    if(!pending) {
      pending = true;
      timerFunc();
    }
  }

  function queueWatcher(watcher) {
    var id = watcher.id;
    if (!has[id]) {
      has[id] = true;
      if (!flushing) {
        queue.push(watcher);
      } else {
        //
      }
      if (!waiting) {
        waiting = true;
        // flush schedule
        // async
        nextTick(flushSchedulerQueue);
      }
    }
  }

  // mount component
  function mountComponent(vm, el) {
    vm.$el = el;
    var updateComponent;
    updateComponent = function () {
      vm._update(vm._render());
    };
    // watcher
    new Watcher(vm, updateComponent, noop, {}, true);
    return vm;
  }

  // eslint-disable-next-line no-undef
  Mvvm.prototype.__patch__ = patch;
  // once
  Mvvm.prototype.$mount = function (el) {
    return mountComponent(this, el);
  };

  // create function
  function createFunction(code, errors = []) {
    // console.log('create function => ', code);
    try {
      return new Function(code);
    } catch (e) {
      console.error('new function error', e);
    }
  }

  // creat compile to function
  function createCompileToFunctionFn(compile) {
    return function compileToFunction(template, options, vm = null) {
      options = extend({}, options);
      var compiled = compile(template, options);
      var res = {};
      res.render = createFunction(compiled.render);
      return res;
    };
  }

  // create compile creator
  function createCompilerCreator(baseCompile) {
    return function createCompiler(baseOptions) {
      function compile(template, options) {
        var finalOptions = Object.create(baseOptions);
        if (options.modules) {
          finalOptions.modules = (finalOptions.modules || []).concat(
            options.modules
          );
        }
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(finalOptions.directives || null),
            finalOptions.directives
          );
        }
        for (var key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key];
          }
        }
        var compiled = baseCompile(template.trim(), finalOptions);
        return compiled;
      }
      return {
        compile,
        compiledToFunctions: createCompileToFunctionFn(compile),
      };
    };
  }

  var createCompiler = createCompilerCreator(function baseCompile(
    template,
    options
  ) {
    var ast = parse(template.trim(), options);
    console.log('test => ', ast);
    var code = generate(ast, options);
    console.log('code => ', code.render);
    return {
      ast: ast,
      render: code.render,
    };
  });

  var ref$1 = createCompiler(baseOptions); // compile
  var compileToFunctions = ref$1.compiledToFunctions;

  var mount = Mvvm.prototype.$mount;
  // twice
  Mvvm.prototype.$mount = function (el) {
    el = el && query(el);
    var options = this.$options;
    if (!options.render) {
      var template = options.template;
      if (template) {
        var ref = compileToFunctions(template, {}, this);
        var render = ref.render;
        options.render = render;
      }
    }
    return mount.call(this, el);
  };

  Mvvm.compile = compileToFunctions;

  global.Mvvm = Mvvm;

  return Mvvm;
});
