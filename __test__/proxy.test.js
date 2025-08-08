const data = {
  a: 1,
  b: 2,
};

const target = new Proxy(data, {
  get(target, key, receiver) {
    console.log('proxy get');
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    console.log('proxy set');
    Reflect.set(target, key, value, receiver);
    return true;
  },
});

const ctx = {};

for (const key in data) {
  Object.defineProperty(ctx, key, {
    enumerable: true,
    configurable: true,
    set: () => {},
    get() {
      console.log('get');
      return data[key];
    },
  });
}

console.log(target.a);
console.log(ctx);
console.log(ctx.a);
