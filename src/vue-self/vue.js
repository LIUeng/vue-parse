/* eslint-disable no-useless-escape */
/* eslint-disable no-console */
(function (w, f) {
  return f(w);
})(window, function f(w) {
  // init
  function Vue(options) {
    this.$options = options;
  }

  // $mount
  Vue.prototype.$mount = function $mount(el) {
    el = el && document.querySelector(el);
    this.$el = el;
  };

  // twice $mount
  var $mount = Vue.prototype.$mount;
  Vue.prototype.$mount = function $mount(el) {
    if (this.$options.template) {
      var template = this.$options.template;
    }
  };

  // utils
  var tip;
  var warn;
  {
    tip = function tip(msg, vm) {
      return console.warn('[Vue tip]', msg);
    };

    warn = function warn(msg, vm) {
      return console.error('[Vue warn]', msg);
    };
  }
  function noop() {}
  function makeMap(str, expectsLowerCase) {
    var map = Object.create(null);
    var arr = str.split(',');
    for (var i = 0; i < arr.length; i++) {
      map[arr[i]] = true;
    }
    return expectsLowerCase
      ? function fn(val) {
          return map[val.toLowerCase()];
        }
      : function fn(val) {
          return map[val];
        };
  }
  function extend(target, source) {
    for (var key in source) {
      target[key] = source[key];
    }
    return target;
  }
  function cached(fn) {
    var cache = {};
    return function cacheFn(str) {
      var hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  }
  var emptyObject = Object.freeze({});

  // parse html
  // var attribute = /^\s*([^\s"'<>=\/]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  // var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>=\/]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var startTagOpen = /^<([a-zA-Z_][\\-\\.a-zA-Z_0-9]*)/;
  var startTagClose = /^\s*(\/)?>/;
  var endTag = /^<\/([a-zA-Z_][\\-\\.a-zA-Z_0-9]*)[^>]*>/;

  // html5 tag
  // HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
  // Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
  var isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
      'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
      'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
      'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
      'title,tr,track'
  );
  var isUnaryTag = makeMap('area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' + 'link,meta,param,source,track,wbr');
  var isPlainTextElement = makeMap('script,style,textarea', true);
  // Elements that you can, intentionally, leave open
  // (and which close themselves)
  var canBeLeftOpenTag = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source');

  // no
  function no(a, b, c) {
    return false;
  }

  function parseHTML(html, options = {}) {
    var index = 0;
    var last, lastTag;
    var isUnaryTag = options.unaryTag || no;
    var canBeLeftOpenTag = options.canBeLeftOpenTag || no;
    // stack the unary tag so as to find the error end tag stack
    var stack = [];
    while (html) {
      last = html;
      if (!lastTag || !isPlainTextElement(lastTag)) {
        var textEnd = html.indexOf('<');
        if (textEnd === 0) {
          // parse start tag
          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            // handle start tag
            handleStartTag(startTagMatch);
            continue;
          }

          // parse end tag
          var endTagMatch = html.match(endTag);
          if (endTagMatch) {
            var curIndex = index;
            advance(endTagMatch[0].length);
            parseEndTag(endTagMatch[1], curIndex, index);
            continue;
          }
        }
        // handle text type
        var text, rest, next;
        if (textEnd >= 0) {
          // start > 0
          rest = html.slice(textEnd);
          while (!endTag.test(rest) && !startTagOpen.test(rest)) {
            next = rest.indexOf('<', 1);
            if (next < 0) {
              break;
            }
            textEnd += next;
            rest = html.slice(textEnd);
          }
          text = html.substring(0, textEnd);
        }
        if (textEnd < 0) {
          text = html;
        }
        if (text) {
          advance(text.length);
        }
        if (options.chars && text) {
          options.chars(text, index - text.length, index);
        }
      } // else here ??? unknown

      // last && html
      if (last === html) {
        options.chars && options.chars(html);
        if (!stack.length && options.warn) {
          options.warn('Mal-formatted tag at end of template: "' + html + '"', { start: index + html.length });
        }
        break;
      }
    }

    // parse remaining html
    parseEndTag();

    function parseStartTag() {
      var start = html.match(startTagOpen);
      if (start) {
        var match = {
          attrs: [],
          start: index,
          tagName: start[1],
        };
        advance(start[0].length);
        var end, attr;
        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
          attr.start = index;
          advance(attr[0].length);
          attr.end = index;
          match.attrs.push(attr);
        }
        if (end) {
          // start tag close here
          match.unarySlash = end[1];
          advance(end[0].length);
          match.end = index;
          return match;
        }
      }
    }

    function handleStartTag(match) {
      var tagName = match.tagName;
      var unarySlash = match.unarySlash;

      // expect html???
      // p 标签中不能包含块级元素 只能包含行内元素
      if (options.expectHTML) {
        if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
          parseEndTag(tagName);
        }
        if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
          parseEndTag(tagName);
        }
      }

      var unary = isUnaryTag(tagName) || !!unarySlash;

      var l = match.attrs.length;
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        var attr = match.attrs[i];
        var value = attr[3] || attr[4] || attr[5];
        attrs[i] = {
          name: attr[1],
          value: value,
        };
        if (options.outputSourceRange) {
          attrs[i].start = attr.start;
          attrs[i].end = attr.end;
        }
      }

      if (!unary) {
        // stack
        stack.push({
          tag: tagName,
          lowerCasedTag: tagName.toLowerCase(),
          attrs: attrs,
          start: match.start,
          end: match.end,
        });
        lastTag = tagName;
      }

      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
      }
    }

    function parseEndTag(tagName, start, end) {
      // check unary tag here
      var pos, lowerCasedTagName;
      if (start == null) {
        start = index;
      }
      if (end == null) {
        end = index;
      }
      // find the closest tag to the end
      if (tagName) {
        lowerCasedTagName = tagName.toLowerCase();
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].tag === lowerCasedTagName) {
            break;
          }
        }
      } else {
        pos = 0;
      }
      // warn the unclosed tag
      if (pos >= 0) {
        for (var i = stack.length - 1; i >= pos; i--) {
          if ((i > pos || !tagName) && options.warn) {
            options.warn('tag <' + stack[i].tag + '> has no matching end tag.', {
              start: stack[i].start,
              end: stack[i].end,
            });
          }
          if (options.end) {
            options.end(stack[i].tag, start, end);
          }
        }

        // 消消乐：此处消掉对子
        stack.length = pos;
        lastTag = pos && stack[pos - 1].tag;
      }

      // else if: p & br tag
    }

    // advance html
    function advance(length) {
      index += length;
      html = html.substring(length);
    }
  }

  function rangeSetItem(item, range) {
    if (range) {
      if (range.start != null) {
        item.start = range.start;
      }
      if (range.end != null) {
        item.end = range.end;
      }
    }
    return item;
  }

  // add op
  function addProp(el, name, value, range, dynamic) {
    (el.props || (el.props = [])).push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }
  function addHandler(el, name, value, modifiers, important, warn, range, dynamic) {
    modifiers = modifiers || emptyObject;
    var newHandler = rangeSetItem({ value: value.trim(), dynamic: dynamic }, range);
    var events = el.events || (el.events = {});
    events[name] = newHandler;
    el.plain = false;
  }
  function addDirective(el, name, rawName, value, arg, isDynamicArg, modifiers, range) {
    (el.directives || (el.directives = [])).push(
      rangeSetItem(
        {
          name: name,
          rawName: rawName,
          value: value,
          arg: arg,
          isDynamicArg: isDynamicArg,
          modifiers: modifiers,
        },
        range
      )
    );
    el.plain = false;
  }
  function addAttr(el, name, value, range, dynamic) {
    var attrs = dynamic ? el.dynamicAttrs || (el.dynamicAttrs = []) : el.attrs || (el.attrs = []);
    attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  // process
  function preTransformNode(el) {
    if (el.tag === 'input') {
      var map = el.attrsMap;
      if (!map['v-model']) {
        return;
      }
      // type binding
    }
  }

  var len, index$1;
  // parse model
  function parseModel(val) {
    val = val.trim();
    len = val.length;
    if (val.indexOf('[') < 0 && val.lastIndexOf(']') < len - 1) {
      index$1 = val.lastIndexOf('.');
      if (index$1 > -1) {
        // obj.a.b
      } else {
        return {
          key: null,
          exp: val,
        };
      }
    }
  }

  // gen assignment code
  function genAssignmentCode(value, assignment) {
    var res = parseModel(value);
    if (res.key === null) {
      return value + '=' + assignment;
    }
  }

  // model
  function genDefaultModel(el, value, modifiers) {
    var type = el.attrsMap.type;

    var ref = modifiers || {};
    var number = ref.number;
    var trim = ref.trim;
    var lazy = ref.lazy;
    var needCompositionGuard = !lazy && type !== 'range';
    var event = lazy ? 'change' : 'input';

    var valueExpression = '$event.target.value';
    if (trim) {
      valueExpression = '$event.target.value.trim()';
    }
    if (number) {
      valueExpression = '_n(' + valueExpression + ')';
    }
    var code = genAssignmentCode(value, valueExpression);
    if (needCompositionGuard) {
      code = 'if($event.target.composing)return;' + code;
    }

    addProp(el, 'value', '(' + value + ')');
    addHandler(el, event, code, null, true);
    if (trim || number) {
      // addHandler(el, 'blur', '$forceUpdate()');
    }
  }

  var warn$1;

  function model(el, dir, _warn) {
    warn$1 = _warn;
    var value = dir.value;
    var tag = el.tag;
    var modifiers = el.modifiers;
    var type = el.attrsMap.type;
    if (tag === 'input' || tag === 'textarea') {
      genDefaultModel(el, value, modifiers);
    }
  }

  function transformNode(el, options) {
    var staticClass = getAndRemoveAttr(el, 'class');
    if (staticClass) {
      var res = parseText(staticClass);
      if (res) {
        console.warn('CLASS ERROR');
      }
    }
    if (staticClass) {
      el.staticClass = JSON.stringify(staticClass);
    }
    // temp not handle class binding
  }

  function genData(el) {
    var data = '';
    if (el.staticClass) {
      data += 'staticClass:' + el.staticClass + ',';
    }
    // temp not handle class binding
    return data;
  }

  var klass$1 = {
    staticKeys: ['staticClass'],
    transformNode: transformNode,
    genData: genData,
  };

  function transformNode$1(el, options) {
    var staticStyle = getAndRemoveAttr(el, 'style');
    if (staticStyle) {
      var res = parseText(staticStyle);
      if (res) {
        console.warn('STYLE ERROR');
      }
    }
    if (staticStyle) {
      el.staticStyle = JSON.stringify(staticStyle);
    }
    // temp not handle style binding
  }

  function genData$1(el) {
    var data = '';
    if (el.staticStyle) {
      data += 'staticStyle:' + el.staticStyle + ',';
    }
    // temp not handle class binding
    return data;
  }

  var style$1 = {
    staticKeys: ['staticStyle'],
    transformNode: transformNode$1,
    genData: genData$1,
  };

  var model$1 = {
    preTransformNode: preTransformNode,
  };

  var modules$1 = [klass$1, style$1, model$1];

  var directives$1 = {
    model: model,
  };

  var warn$2;
  var transforms;
  var preTransforms;
  var postTransforms;

  var decoder;
  var he = {
    decode: function decode(text) {
      decoder = decoder || document.createElement('div');
      decoder.innerHTML = text;
      return decoder.textContent;
    },
  };
  var decodeHTMLCached = cached(he.decode);
  var baseOptions = {
    expectHTML: true,
    outputSourceRange: true,
    unaryTag: isUnaryTag,
    modules: modules$1,
    directives: directives$1,
    canBeLeftOpenTag: canBeLeftOpenTag,
  };

  function makeAttrsMap(attrs) {
    var map = {};
    for (var i = 0; i < attrs.length; i++) {
      if (map[attrs[i].name]) {
        warn$2('duplicate attribute: ' + attrs[i].name, attrs[i]);
      }
      map[attrs[i].name] = attrs[i].value;
    }
    return map;
  }

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  var dirRE = /^@|^:|^#|^v-/;
  var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;
  var onRE = /^v-on:|^@/;
  var dynamicArgRE = /^\[.*\]$/;
  var argRE = /^:(.*)$/;

  // parse text
  function parseText(text) {
    var tagRE = defaultTagRE;
    if (!tagRE.test(text)) {
      return;
    }
    var tokens = [];
    var rawTokens = [];
    var match;
    var lastIndex = (tagRE.lastIndex = 0);
    var index;
    var tokenValue;
    while ((match = tagRE.exec(text))) {
      index = match.index;
      if (index > lastIndex) {
        // ' '
        rawTokens.push((tokenValue = text.slice(lastIndex, index)));
        tokens.push(JSON.stringify(tokenValue));
      }
      var exp = match[1].trim();
      tokens.push('_s(' + exp + ')');
      rawTokens.push({ '@bindings': exp });
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
      rawTokens.push((tokenValue = text.slice(lastIndex)));
      tokens.push(JSON.stringify(tokenValue));
    }
    return {
      expression: tokens.join('+'),
      tokens: rawTokens,
    };
  }
  function parseModifiers(str) {
    var match = str.match(modifierRE);
    var ret = {};
    if (match) {
      match.forEach(function (m) {
        ret[m.slice(1)] = true;
      });
      return ret;
    }
  }

  function getAndRemoveAttr(el, name, removeFromMap) {
    var val;
    if ((val = el.attrsMap[name]) != null) {
      var list = el.attrsList;
      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i].name === name) {
          list.splice(i, 1);
          break;
        }
      }
    }
    if (removeFromMap) {
      delete el.attrsMap[name];
    }
    return val;
  }
  function addIfCondition(el, condition) {
    if (!el.ifConditions) {
      el.ifConditions = [];
    }
    el.ifConditions.push(condition);
  }
  function findPrevElement(el, children) {
    for (var i = 0, l = children.length; i < l; i++) {
      if (el === children[i]) {
        break;
      }
    }
  }

  function pluckModuleFunction(modules, key) {
    return modules
      .map(function (m) {
        return m[key];
      })
      .filter(function (_) {
        return _;
      });
  }

  // create ast element
  function createASTElement(tag, attrs, parent) {
    return {
      type: 1,
      tag: tag,
      attrsList: attrs,
      attrsMap: makeAttrsMap(attrs),
      rawAttrsMap: {},
      parent: parent,
      children: [],
    };
  }

  // process here
  function processElement(element, options) {
    element.plain = !element.key && !element.attrsList.length && !element.scopeSlots;
    // class style
    for (var i = 0, l = transforms.length; i < l; i++) {
      transforms[i](element, options);
    }
    // process attrs
    processAttrs(element);
    return element;
  }
  function processAttrs(el) {
    var list = el.attrsList;
    var i, l, rawName, name, value, modifiers;
    for (i = 0, l = list.length; i < l; i++) {
      name = rawName = list[i].name;
      value = list[i].value;
      if (dirRE.test(name)) {
        el.hasBindinds = true;
        modifiers = parseModifiers(name.replace(dirRE, ''));
        if (modifiers) {
          name = name.replace(modifierRE, '');
        }
        // v-on
        if (onRE.test(name)) {
          name = name.replace(onRE, '');
          var isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            name = name.slice(1, -1);
          }
          addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
        } else {
          // normal directives
          name = name.replace(dirRE, '');
          var argMatch = name.match(argRE);
          var arg = argMatch && argMatch(1);
          isDynamic = false;
          if (arg) {
            name = name.slice(0, -(arg.length + 1));
            if (dynamicArgRE.test(arg)) {
              arg = arg.slice(1, -1);
              isDynamic = true;
            }
          }
          addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
        }
      } else {
        // normal attr
        addAttr(el, name, JSON.stringify(value), list[i]);
      }
    }
  }
  function processIf(el) {
    var exp = getAndRemoveAttr(el, 'v-if');
    if (exp) {
      el.if = exp;
      addIfCondition(el, {
        exp: exp,
        block: el,
      });
    } else {
      if (getAndRemoveAttr(el, 'v-else') != null) {
        el.else = true;
      }
      var elseif = getAndRemoveAttr(el, 'v-else-if');
      if (elseif) {
        el.elseif = elseif;
      }
    }
  }
  function processIfConditions(el, parent) {
    var prev = findPrevElement(el, parent.children);
    if (prev && prev.if) {
      addIfCondition(prev, {
        exp: el.elseif,
        block: el,
      });
    } else {
      // warn
    }
  }

  // parse with parseHTML
  function parse(template, options = {}) {
    var root;
    var currentParent;
    var stack = [];
    var preserveWhitespace = options.preserveWhitespace !== false;
    var warned = false;

    warn$2 = options.warn || baseWarn;

    // transform
    transforms = pluckModuleFunction(options.modules, 'transformNode');
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
    postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

    // warn once
    function warnOnce(msg, range) {
      if (!warned) {
        warned = true;
        warn$2(msg, range);
      }
    }

    // close element
    function closeElement(element) {
      trimEndingWhitespace(element);
      if (!element.processed) {
        element = processElement(element, options);
      }
      if (currentParent) {
        if (element.elseif || element.else) {
          // else if
          processIfConditions(element, currentParent);
        } else {
          if (element.slotScope) {
            // slot scope
          }
          currentParent.children.push(element);
          element.parent = currentParent;
        }
      }
      trimEndingWhitespace(element);
      // check pre/v-pre
      // apply post transforms
      // apply pre-transforms
      for (var i = 0; i < postTransforms.length; i++) {
        element = postTransforms[i](element, options) || element;
      }
    }

    // trim ending whitespace
    function trimEndingWhitespace(el) {
      var lastNode;
      while ((lastNode = el.children[el.children.length - 1]) && lastNode.type === 3 && lastNode.text === ' ') {
        el.children.pop();
      }
    }

    parseHTML(template, {
      unaryTag: options.unaryTag,
      warn: options.warn || noop,
      outputSourceRange: true,
      start: function start(tag, attrs, unary, start$1, end) {
        var element = createASTElement(tag, attrs, currentParent);
        {
          if (options.outputSourceRange) {
            element.start = start$1;
            element.end = end;
            element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
              cumulated[attr.name] = attr.value;
              return cumulated;
            }, {});
          }
        }

        // apply pre-transforms
        for (var i = 0; i < preTransforms.length; i++) {
          element = preTransforms[i](element, options) || element;
        }

        if (!element.processed) {
          processIf(element);
          // processFor(element);
        }

        if (!root) {
          root = element;
          {
            // check constraint root
          }
        }

        if (!unary) {
          currentParent = element;
          stack.push(element);
        } else {
          closeElement(element);
        }
      },
      end: function end(tag, start, end$1) {
        var element = stack[stack.length - 1];
        stack.length -= 1;
        currentParent = stack[stack.length - 1];
        if (options.outputSourceRange) {
          element.end = end$1;
        }
        closeElement(element);
      },
      chars: function chars(text, start, end) {
        if (!currentParent) {
          {
            if (text === template) {
              warnOnce('Component template requires a root element, rather than just text.', { start: start });
            } else if ((text = text.trim())) {
              warnOnce('text "' + text + '" outside root element will be ignored.', { start: start });
            }
          }
          return;
        }
        var children = currentParent.children;
        if (text.trim()) {
          text = decodeHTMLCached(text);
        } else if (!children.length) {
          text = '';
        } else {
          text = preserveWhitespace ? ' ' : '';
        }
        if (text) {
          var res;
          var child;
          if (text !== ' ' && (res = parseText(text))) {
            child = {
              type: 2,
              tokens: res.tokens,
              expression: res.expression,
              text: text,
            };
          } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
            child = {
              type: 3,
              text: text,
            };
          }
          if (child) {
            if (options.outputSourceRange) {
              child.start = start;
              child.end = end;
            }
            children.push(child);
          }
        }
      },
    });

    return root;
  }

  // base warn
  function baseWarn(msg) {
    console.error('[Vue compile]', msg);
  }

  var baseDirectives = {
    // on: on,
  };

  // codegen state
  var CodegenState = function CodegenState(options) {
    this.options = options;
    this.warn = options.warn || baseWarn;
    this.pre = false;
    this.staticRenderFns = [];
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    this.directives = extend(extend({}, baseDirectives), options.directives);
  };

  // generate
  function generate(ast, options) {
    // render, staticRenderFns
    var state = new CodegenState(options);
    var code = ast ? genElement(ast, state) : "_c('div')";
    console.log('code ======', code);
    return {
      render: 'with(this){ return ' + code + '; }',
      staticRenderFns: state.staticRenderFns,
    };
  }

  // gen element
  function genElement(el, state) {
    if (el.parent) {
      el = el.pre || el.parent.pre;
    }
    if (el.if && !el.ifProcessed) {
      // if
    } else {
      // gen el
      var code;
      if (el.component) {
        // maybe component
      } else {
        var data;
        if (!el.plain) {
          // gen data
          data = genData$2(el, state);
          var children = el.inlineTemplate ? null : genChildren(el, state, true);
          code = "_c('" + el.tag + "'" + (data ? ',' + data : '') + (children ? ',' + children : '') + ')';
        }
      }
      return code;
    }
  }

  // gen data $2
  function genData$2(el, state) {
    // init
    var data = '{';
    var dirs = genDirectives(el, state);

    // directives
    if (dirs) {
      data += dirs;
    }

    // data gen fns
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }

    // attributes
    if (el.attrs) {
      data += 'attrs:' + genProps(el.attrs) + ',';
    }
    // props
    if (el.props) {
      data += 'domProps:' + genProps(el.props) + ',';
    }
    // events
    if (el.events) {
      data += genHandlers(el.events, false) + ',';
    }

    // result
    data = data.replace(/,$/, '') + '}';

    return data;
  }

  // directives
  function genDirectives(el, state) {
    var dirs = el.directives;
    if (!dirs) {
      return;
    }
    var res = 'directives:[';
    var hasRuntime = false;
    var needRuntime;
    for (var i = 0, l = dirs.length; i < l; i++) {
      var dir = dirs[i];
      needRuntime = true;
      var gen = state.directives[dir.name];
      if (gen) {
        needRuntime = !!gen(el, dir, state.dir);
      }
      if (needRuntime) {
        hasRuntime = true;
        res +=
          '{name:"' +
          dir.name +
          '",rawName:"' +
          dir.rawName +
          '"' +
          (dir.value ? ',value:(' + dir.value + '),expression:' + JSON.stringify(dir.value) : '') +
          (dir.arg ? ',arg:' + (dir.isDynamicArg ? dir.arg : '"' + dir.arg + '"') : '') +
          (dir.modifiers ? ',modifiers:' + JSON.stringify(dir.modifiers) : '') +
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
    for (var i = 0, l = props.length; i < l; i++) {
      var prop = props[i];
      if (prop.dynamic) {
        // dynamic attr
      } else {
        staticProps += '"' + prop.name + '":' + prop.value + ',';
      }
    }
    staticProps = '{' + staticProps.slice(0, -1) + '}';
    return staticProps;
  }

  // function events handle
  var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;
  var fnInvokeRE = /\([^)]*?\);*$/;
  var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

  // gen handlers
  function genHandlers(events, isNative) {
    var prefix = isNative ? 'nativeOn:' : 'on:';
    var staticHandlers = '';
    for (var name in events) {
      var handlerCode = genHandler(events[name]);
      if (events[name] && events[name].dynamic) {
        // dynamic
      } else {
        staticHandlers += '"' + name + '":' + handlerCode + ',';
      }
    }
    staticHandlers = '{' + staticHandlers.slice(0, -1) + '}';
    return prefix + staticHandlers;
  }
  function genHandler(handler) {
    if (!handler) {
      return 'function() {}';
    }
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));
    if (!handler.modifiers) {
      return 'function($event){' + (isFunctionInvocation ? 'return ' + handler.value : handler.value) + '}'; // inline statement
    }
  }

  // gen children recursive
  function genChildren() {}

  // generate code frame
  var range = 2;
  function generateCodeFrame(str, start, end) {
    if (start === void 0) start = 0;
    if (end === void 0) end = str.length;
    var lines = str.split('\n');
    var count = 0;
    var res = [];
    for (var i = 0, l = lines.length; i < l; i++) {
      var line = lines[i];
      count += line.length + 1;
      // 先找到错误行 再进行分析上下几行为了完整性
      if (count >= start) {
        for (var j = i - range; j < i + range || end > count; j++) {
          if (j < 0 || j > lines.length) continue;
          res.push('' + (j + 1) + repeat$1(' ', 3 - String(j + 1).length) + '|  ' + lines[j]);
          var lineLength = lines[j].length;
          // push underline
          // 其他行 当前错误行
          if (j === i) {
            var pad = start - (count - lineLength) + 1;
            var length = end > count ? lineLength - pad : end - start;
            res.push('   |  ' + repeat$1(' ', pad) + repeat$1('^', length));
          } else if (j > i) {
            if (end > count) {
              var length$1 = Math.min(end - count, lineLength);
              res.push('   |  ' + repeat$1('^', length$1));
            }
            count += lineLength + 1;
          }
        }
        break;
      }
    }
    return res.join('\n');
  }

  // string pad
  function repeat$1(str, n) {
    var result = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (n & 1) {
        result += str;
      }
      n >>>= 1;
      if (n <= 0) {
        break;
      }
      str += str;
    }
    return result;
  }

  // create function
  function createFunction(code, errors) {
    try {
      return new Function(code);
    } catch (e) {
      errors.push({ err: e, code: code });
      return noop;
    }
  }

  // create compile to functions
  function createCompileToFunctionFn(compile) {
    var cache = Object.create(null);
    return function compileToFunctions(template, options, vm) {
      options = extend({}, options);
      var warn$1 = options.warn || warn;
      delete options.warn;
      var key = template;
      if (cache[key]) {
        return cache[key];
      }
      // compile
      var compiled = compile(template, options);
      // check compilation errors/tips
      {
        if (compiled.errors && compiled.errors.length) {
          if (options.outputSourceRange) {
            compiled.errors.forEach(function (e) {
              warn$1('Error compiling template:\n\n' + e.msg + '\n\n' + generateCodeFrame(template, e.start, e.end), vm);
            });
          } else {
            warn$1(
              'Error compiling template:\n\n' +
                template +
                '\n\n' +
                compiled.errors
                  .map(function (e) {
                    return '- ' + e;
                  })
                  .join('\n') +
                '\n',
              vm
            );
          }
        }
        if (compiled.tips && compiled.tips.length) {
          if (options.outputSourceRange) {
            compiled.tips.forEach(function (e) {
              return tip(e.msg, vm);
            });
          } else {
            compiled.tips.forEach(function (msg) {
              return tip(msg, vm);
            });
          }
        }
      }

      // turn code into functions
      var res = {};
      var fnGenErrors = [];
      res.render = createFunction(compiled.render, fnGenErrors);
      res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
        return createFunction(code, fnGenErrors);
      });

      // check function generation errors.
      // this should only happen if there is a bug in the compiler itself.
      // mostly for codegen development use
      /* istanbul ignore if */
      {
        if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
          warn$1(
            'Failed to generate render function:\n\n' +
              fnGenErrors
                .map(function (ref) {
                  var err = ref.err;
                  var code = ref.code;

                  return err.toString() + ' in\n\n' + code + '\n';
                })
                .join('\n'),
            vm
          );
        }
      }

      return (cache[key] = res);
    };
  }

  // create compiler creator
  function createCompilerCreator(baseCompile) {
    return function createCompiler(baseOptions) {
      function compile(template, options) {
        var finalOptions = Object.create(baseOptions);
        var errors = [];
        var tips = [];
        var warn = function warn(msg, range, tip) {
          (tip ? tips : errors).push(msg);
        };
        if (options) {
          if (options.outputSourceRange) {
            var leadingSpaceLength = template.match(/^\s*/)[0].length;
            warn = function warn(msg, range, tip) {
              var data = { msg: msg };
              if (range.start) {
                data.start = range.start + leadingSpaceLength;
              }
              if (range.end) {
                data.end = range.end + leadingSpaceLength;
              }
              (tip ? tips : errors).push(data);
            };
          }

          // merge custom modules
          if (options.modules) {
            finalOptions.modules = (baseOptions.modules || []).concat(options.modules);
          }

          // merge custom directives
          if (options.directives) {
            finalOptions.directives = extend(Object.create(baseOptions.directives || null), options.directives);
          }

          // merge options
          for (var key in options) {
            if (key !== 'modules' && key !== 'directives') {
              finalOptions[key] = options[key];
            }
          }
        }

        // warn
        finalOptions.warn = warn;
        var compiled = baseCompile(template.trim(), finalOptions);
        // detected error???
        {
          // here what do
        }
        compiled.errors = errors;
        compiled.tips = tips;
        return compiled;
      }
      return {
        compile: compile,
        compileToFunctions: createCompileToFunctionFn(compile),
      };
    };
  }
  var createCompiler = createCompilerCreator(function baseCompile(template, options) {
    var ast = parse(template, options);
    console.log('ast ==> ', ast);
    // optimize wait print tag
    var code = generate(ast, options);
    return {
      ast: ast,
      render: code.render,
      staticRenderFns: code.staticRenderFns,
    };
  });

  var ref$1 = createCompiler(baseOptions);
  var compileToFunctions = ref$1.compileToFunctions;

  // compile
  Vue.compile = compileToFunctions;

  // export window
  w.Vue = Vue;
});
