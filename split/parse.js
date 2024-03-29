'use strict';

// vue template parse

// regexp variables
let startTagReg = /^<([a-zA-Z_][\.0-9_\-a-zA-Z]*)/;
let startCloseTagReg = /^\s*(\/)?>/;
let tagReg = /([a-zA-Z_][\.0-9_\-a-zA-Z]*)/;
let endTagReg = /^<\/([a-zA-Z_][\.0-9_\-a-zA-Z]*)[^>]*>/;
let attrReg = /^\s*([^\s"'`<>=]*)(?:\s*(?:(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'`<>=])+)))?/;

function parse(template) {
  let root;

  // parse html here
  parseHTML(template.trim(), {
    start() {},
    end() {},
    chars() {},
  });

  return root;
}

function parseHTML(html, options) {
  let index = 0;
  let last;
  let lastTag;
  let stack = [];

  while (html) {
    last = html;

    // > = 0
    if (!lastTag) {
      let textEnd = html.indexOf('<');

      if (textEnd === 0) {
        // comment ignore
        // start tag
        let startTagMatch = parseStartTag();
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          console.log('start tag', startTagMatch);
          continue;
        }

        // end tag
        let endTagMatch = html.match(endTagReg);
        if (endTagMatch) {
          let curIndex = index;
          advance(endTagMatch[0].length);
          // end options
          parseEndTag(endTagMatch[1], curIndex, index);
          continue;
        }
      }

      // text match
      let text;
      let rest;
      let next;
      if (textEnd >= 0) {
        rest = html.slice(textEnd);
        while (!rest.match(startTagReg) && !rest.match(endTagReg)) {
          next = rest.indexOf('>', 1);
          if (next < 0) break;
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

      // chars options
      if (options.chars && text) {
        options.chars(text, index - text.length, index);
      }
    }
  }

  // parse start tag
  function parseStartTag() {
    let start = html.match(startTagReg);

    if (start) {
      let match = {
        tagName: start[1],
        attrs: [],
        start: index,
      };
      advance(start[0].length);

      // attr match
      let attr;
      let end;
      while ((attr = html.match(attrReg)) && !(end = html.match(startCloseTagReg))) {
        attr.start = index;
        advance(attr[0].length);
        attr.end = index;
        match.attrs.push(attr);
      }

      // end
      if (end) {
        match.unarySlash = end[1];
        advance(end[0].length);
        match.end = index;
        return match;
      }
    }
  }

  // handle start tag
  function handleStartTag(match) {
    
  }

  // parse end tag
  function parseEndTag(tag, start, end) {
    console.log(tag, start, end);
  }

  // index
  function advance(n) {
    index += n;
    html = html.substring(n);
  }
}

// __test__
parse(`
  <div a=""hello"" b = "world">hello world</div>
`);

// expect

// parse
let result = {
  tag: String,
  attrsList: [
    {
      name: String,
      value: String,
      start: Number,
      end: Number,
    },
  ],
  attrsMap: {
    [String]: [String, Number],
  },
  children: [this],
};
