// check object
// eslint-disable-next-line no-unused-vars
function isObject(obj) {
  return obj !== null && typeof obj === 'object';
}

// check undefined
// eslint-disable-next-line no-unused-vars
function isUndef(value) {
  return value === undefined || value === null;
}

// check defined
// eslint-disable-next-line no-unused-vars
function isDef(value) {
  return value !== undefined && value !== null;
}