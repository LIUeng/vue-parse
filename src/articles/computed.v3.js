const Vue = {};

const ITERATE_KEY = Symbol('iterate');

let activeEffect;
const queueEffectSchedulers = [];
// let shouldTrack = true;
const NOOP = () => {};

function queueJob() {
  console.log('nextTick queue job wait invoking');
}

class ReactiveEffect {
  constructor(fn, trigger, scheduler, scope) {
    this.fn = fn;
    this.trigger = trigger;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];

    this._dirtyLevel = 4;
    this._trackId = 0;
    this._runnings = 0;
    this._shouldSchedule = false;
    this._depsLength = 0;
  }
  get dirty() {
    if (this._dirtyLevel === 2 || this._dirtyLevel === 3) {
      this._dirtyLevel = 1;
      pauseTracking();
      for (let i = 0; i < this._depsLength; i++) {
        let dep = this.deps[i];
        if (dep.computed) {
          triggerComputed(dep.computed);
          if (this._dirtyLevel >= 4) {
            break;
          }
        }
      }
      if (this._dirtyLevel === 1) {
        this._dirtyLevel = 0;
      }
      resetTracking();
    }
    return this._dirtyLevel >= 4;
  }
  set dirty(v) {
    this._dirtyLevel = v ? 4 : 0;
  }
  run() {
    this._dirtyLevel = 0;
    if (!this.active) {
      return this.fn();
    }
    let lastShouldTrack = shouldTrack;
    let lastEffect = activeEffect;
    try {
      shouldTrack = true;
      activeEffect = this;
      this._runnings++;
      preCleanupEffect(this);
      return this.fn();
    } finally {
      postCleanupEffect(this);
      this._runnings--;
      activeEffect = lastEffect;
      shouldTrack = lastShouldTrack;
    }
  }
  stop() {
    if (this.active) {
      preCleanupEffect();
      postCleanupEffect();
      this.onStop && this.onStop();
      this.active = false;
    }
  }
}

function triggerComputed(computed) {
  return computed.value;
}
function preCleanupEffect(effect2) {
  effect2._trackId++;
  effect2._depsLength = 0;
}
function postCleanupEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanupDepEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
function cleanupDepEffect(dep, effect2) {
  const trackId = dep.get(effect2);
  if (trackId !== void 0 && effect2._trackId !== trackId) {
    dep.delete(effect2);
    if (dep.size === 0) {
      dep.cleanup();
    }
  }
}
function effect(fn, options) {
  if (fn.effect instanceof ReactiveEffect) {
    fn = fn.effect.fn;
  }
  const _effect = new ReactiveEffect(fn, NOOP, () => {
    if (_effect.dirty) {
      _effect.run();
    }
  });
  if (options) {
    Object.assign(_effect, options);
  }
  if (!options || !options.lazy) {
    _effect.run();
  }
  const _runner = _effect.run.bind(_effect);
  _runner.effect = _effect;
  return _runner;
}
function stop(runner) {
  runner.effect.stop();
}
let shouldTrack = true;
let pauseScheduleStack = 0;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function pauseScheduling() {
  pauseScheduleStack++;
}
function resetScheduling() {
  pauseScheduleStack--;
  while (!pauseScheduleStack && queueEffectSchedulers.length) {
    queueEffectSchedulers.shift()();
  }
}

const targetMap = new WeakMap();

function createDep(cleanup, computed) {
  const dep = new Map();
  dep.cleanup = cleanup;
  dep.computed = computed;
  return dep;
}

function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let deps = [];
  if (key !== void 0) {
    deps.push(depsMap.get(key));
    // if (type === 'set') {
    //   deps.push(depsMap.get(ITERATE_KEY));
    // }
  }
  pauseScheduling();
  for (const dep of deps) {
    if (dep) {
      triggerEffects(dep, 4);
    }
  }
  resetScheduling();
}

function trackEffect(effect2, dep, debuggerEventExtraInfo) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    const oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanupDepEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
}

function triggerEffects(dep, dirtyLevel, debuggerEventExtraInfo) {
  console.log('trigger effects');
  pauseScheduling();
  let tracking;
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < dirtyLevel && (tracking != null ? tracking : (tracking = dep.get(effect2) === effect2._trackId))) {
      effect2._shouldSchedule || (effect2._shouldSchedule = effect2._dirtyLevel === 0);
      effect2._dirtyLevel = dirtyLevel;
    }
    if (effect2._shouldSchedule && (tracking != null ? tracking : (tracking = dep.get(effect2) === effect2._trackId))) {
      effect2.trigger();
      if (!effect2._runnings && effect2._dirtyLevel !== 2) {
        effect2._shouldSchedule = false;
        if (effect2.scheduler) {
          console.log('scheduler');
          queueEffectSchedulers.push(effect2.scheduler);
        }
      }
    }
  }
  resetScheduling();
}

function track(target, type, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep(() => dep.delete(key))));
  }
  if (shouldTrack && activeEffect) {
    console.log('track');
    trackEffect(activeEffect, dep, { target, type, key });
  }
}

function reactive(target) {
  const proxy = new Proxy(target, {
    set(target, key, value, receiver) {
      let oldValue = target[key];
      let result = Reflect.set(target, key, value, receiver);
      console.log(oldValue, value);
      if (!Object.is(value, oldValue)) {
        trigger(target, 'set', key, result, oldValue);
      }
      return result;
    },
    get(target, key, receiver) {
      console.log('get proxy data');
      const res = Reflect.get(target, key, receiver);
      track(target, 'get', key);
      return res;
    },
  });

  return proxy;
}

function triggerRefValue(ref2, dirtyLevel = 4) {
  const dep = ref2.dep;
  if (dep) {
    triggerEffects(dep, dirtyLevel);
  }
}
function trackRefValue(ref2) {
  if (shouldTrack && activeEffect) {
    trackEffect(activeEffect, ref2.dep ? ref2.dep : (ref2.dep = createDep(() => (ref2.dep = void 0), ref2 instanceof ComputedRefImpl ? ref2 : void 0)));
  }
}

class ComputedRefImpl {
  constructor(getter, _setter) {
    this.getter = getter;
    this._setter = _setter;
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => triggerRefValue(this, this.effect._dirtyLevel === 2 ? 2 : 3)
    );
    this.effect.computed = this;
    this.dep = void 0;
    this.effect.active = this._cacheable = true;
  }

  get value() {
    console.log('value');
    const self = this;
    if ((!self._cacheable || self.effect.dirty) && !Object.is(self._value, (self._value = self.effect.run()))) {
      triggerRefValue(self, 4);
    }
    trackRefValue(self);
    if (self.effect._dirtyLevel >= 2) {
      triggerRefValue(self, 2);
    }
    return self._value;
  }
  set value(newValue) {
    this._setter(newValue);
  }
  get _dirty() {
    return this.effect.dirty;
  }
  set _dirty(v) {
    this.effect.dirty = v;
  }
}

function computed$1(getterOrOptions) {
  let getter = getterOrOptions.get;
  let setter = getterOrOptions.set;
  const cRef = new ComputedRefImpl(getter, setter);
  return cRef;
}
function computed(getterOrOptions) {
  const c = computed$1(getterOrOptions);
  return c;
}

function createDevRenderContext(instance) {
  const target = {};
  Object.defineProperty(target, '_', {
    configurable: true,
    enumerable: false,
    get: () => instance,
  });
  return target;
}

let uid = 0;
const createComponentInstance = (options) => {
  const instance = {
    uid: uid++,
    type: options,
    ctx: {},
    proxy: null,
    render: null,
    effect: null,
    update: null,
  };

  instance.ctx = createDevRenderContext(instance);

  return instance;
};
const applyOptions = (instance) => {
  const options = instance.type;
  const ctx = instance.ctx;
  const publicThis = instance.proxy;
  // data
  if (options.data) {
    const data = options.data();
    instance.data = reactive(data);

    for (const key in data) {
      Object.defineProperty(ctx, key, {
        configurable: true,
        enumerable: true,
        set: NOOP,
        get: () => {
          console.log('define property get');
          return data[key];
        },
      });
    }
  }
  // computed
  if (options.computed) {
    // computed(options.computed);
    for (const key in options.computed) {
      const opt = options.computed[key];
      const c = computed({ get: opt.bind(publicThis, publicThis), set: NOOP });
      Object.defineProperty(ctx, key, {
        configurable: true,
        enumerable: true,
        get: () => c.value,
        set: (v) => {
          c.value = v;
        },
      });
    }
  }
};
Vue.createApp = function createApp(options) {
  const app = {
    mount() {
      // create component instance
      let instance = createComponentInstance(options);
      instance.proxy = new Proxy(instance.ctx, {
        get({ _: instance }, key) {
          const { ctx, data } = instance;
          if (key in data) {
            return data[key];
          }
          return ctx[key];
        },
        set({ _: instance }, key, value) {
          const { ctx, data } = instance;
          console.log('set', ctx, key, value, key in data, instance.data);
          if (key in data) {
            data[key] = value;
            return true;
          }
          ctx[key] = value;
          return true;
        },
        defineProperty(target, key, descriptor) {
          return Reflect.defineProperty(target, key, descriptor);
        },
      });

      app._instance = instance;

      // active effect
      const componentUpdateFn = () => {
        options.render.call(instance.proxy, instance.proxy);
      };
      const effect = (instance.effect = new ReactiveEffect(componentUpdateFn, NOOP, () => queueJob(update)));
      const update = (instance.update = () => {
        if (effect.dirty) {
          effect.run();
        }
      });

      // hook
      applyOptions(instance);

      update();
    },
  };
  return app;
};
