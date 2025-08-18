(function (exports, factory) {
  exports.Vue = factory();
})(self, function () {
  let shouldTrack = true;
  let activeEffect;
  const NOOP = () => {};
  const trackStack = [];
  let pauseScheduleStack = 0;
  const queueEffectSchedulers = [];
  const isObject = (v) => v != null && typeof v === 'object';

  function queueJob(job) {
    console.log('nextTick wait update');
    Promise.resolve().then(() => {
      job();
    });
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

  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
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
      for (let i = effect2._depsLength; i < effect2.dep.length; i++) {
        cleanupDepEffect(effect2.deps[i], effect2);
      }
      effect2.deps.length = effect2._depsLength;
    }
  }
  class ReactiveEffect {
    constructor(fn, trigger, scheduler, scope) {
      this.fn = fn;
      this.trigger = trigger;
      this.scheduler = scheduler;
      this.active = true;
      this.deps = [];

      this._trackId = 0;
      this._dirtyLevel = 4;
      this._runnings = 0;
      this._depsLength = 0;
      this._shouldSchedule = false;
    }
    get dirty() {
      console.log('get dirty', this._dirtyLevel);
      if (this._dirtyLevel === 2 || this._dirtyLevel === 3) {
        this._dirtyLevel = 1;
        pauseTracking();
        for (let i = 0; i < this._depsLength; i++) {
          const dep = this.deps[i];
          if (dep.computed) {
            console.log('trigger computed');
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
      let lastTrack = shouldTrack;
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
        shouldTrack = lastTrack;
      }
    }
    stop() {
      if (this.active) {
        preCleanupEffect(this);
        postCleanupEffect(this);
        this.active = false;
      }
    }
  }

  function createDep(cleanup, computed) {
    const dep = new Map();
    dep.cleanup = cleanup;
    dep.computed = computed;
    return dep;
  }
  function cleanupDepEffect(dep, effect2) {
    const trackId = dep.get(effect2);
    if (trackId !== void 0 && trackId !== effect2.trackId) {
      dep.delete(effect2);
      if (dep.size === 0) {
        dep.cleanup();
      }
    }
  }
  function trackEffect(effect2, dep) {
    console.log('track effect 是否相等 =', dep.get(effect2) !== effect2._trackId);
    if (dep.get(effect2) !== effect2._trackId) {
      dep.set(effect2, effect2._trackId);
      const oldDep = effect2.deps[effect2._depsLength];
      if (oldDep !== dep) {
        // console.log('old dep', oldDep);
        if (oldDep) {
          cleanupDepEffect(oldDep, effect2);
        }
        effect2.deps[effect2._depsLength++] = dep;
      } else {
        effect2._depsLength++;
      }
    }
  }
  function triggerEffects(dep, dirtyLevel) {
    pauseScheduling();
    for (const effect2 of dep.keys()) {
      let tracking;
      if (effect2._dirtyLevel < dirtyLevel && (tracking != null ? tracking : (tracking = dep.get(effect2) === effect2._trackId))) {
        effect2._shouldSchedule || (effect2._shouldSchedule = effect2._dirtyLevel === 0);
        effect2._dirtyLevel = dirtyLevel;
      }
      if (effect2._shouldSchedule && (tracking != null ? tracking : (tracking = dep.get(effect2) === effect2._trackId))) {
        console.log('should trigger', effect2._dirtyLevel);
        effect2.trigger();
        if (!effect2._runnings && effect2._dirtyLevel !== 2) {
          console.log('trigger scheduler');
          effect2._shouldSchedule = false;
          if (effect2.scheduler) {
            queueEffectSchedulers.push(effect2.scheduler);
          }
        }
      }
    }
    resetScheduling();
  }

  function trackRefValue(ref2) {
    let _a;
    console.log('track ref value:', shouldTrack, activeEffect);
    if (shouldTrack && activeEffect) {
      _a = ref2.dep;
      if (_a != null) {
        _a = _a;
      } else {
        _a = ref2.dep = createDep(() => (ref2.dep = void 0), ref2 instanceof ComputedRefImpl ? ref2 : void 0);
      }
      trackEffect(activeEffect, _a);
    }
  }
  function triggerRefValue(ref2, dirtyLevel, newVal) {
    const dep = ref2.dep;
    if (dep) {
      triggerEffects(dep, dirtyLevel);
    }
  }

  const reactiveMap = new WeakMap();
  const targetMap = new WeakMap();

  function track(target, type, key) {
    if (shouldTrack && activeEffect) {
      let depsMap = targetMap.get(target);
      if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
      }
      let dep = depsMap.get(key);
      if (!dep) {
        depsMap.set(key, (dep = createDep(() => depsMap.delete(key))));
      }
      trackEffect(activeEffect, dep);
    }
  }
  function trigger(target, type, key, newValue, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    let deps = [];
    if (key !== void 0) {
      deps.push(depsMap.get(key));
    }
    switch (type) {
      case 'set':
        // nothing
        break;
    }
    pauseScheduling();
    for (let dep of deps) {
      if (dep) {
        triggerEffects(dep, 4);
      }
    }
    resetScheduling();
  }

  class BaseReactiveHandler {
    constructor() {}
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      // track
      // console.log('proxy get');
      track(target, 'get', key);
      return result;
    }
  }
  class MutableReactiveHandler extends BaseReactiveHandler {
    constructor() {
      super();
    }
    set(target, key, value, receiver) {
      // console.log('proxy set');
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      // add set 这里考虑 set
      if (!Object.is(oldValue, value)) {
        trigger(target, 'set', key, value, oldValue);
      }
      return result;
    }
  }

  function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      console.log('existing');
      return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function reactive(target) {
    return createReactiveObject(target, false, new MutableReactiveHandler(), {}, reactiveMap);
  }
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  class RefImpl {
    constructor(value, shallow) {
      this.dep = void 0;
      this._rawValue = value;
      this._value = toReactive(value);
      // shallow 不考虑
      // this.shallow = shallow;
    }
    get value() {
      // console.log('get');
      trackRefValue(this);
      return this._value;
    }
    set value(newVal) {
      // console.log('set', newVal, this._rawValue);
      if (Object.is(newVal, this._rawValue)) {
        return;
      }
      this._rawValue = newVal;
      this._value = toReactive(newVal);
      triggerRefValue(this, 4, newVal);
    }
  }
  function createRef(rawValue, shallow) {
    return new RefImpl(rawValue, shallow);
  }
  function ref(value) {
    return createRef(value, false);
  }

  // computed
  class ComputedRefImpl {
    constructor(getter, _setter, isReadonly) {
      this.getter = getter;
      this._setter = _setter;
      this.dep = void 0;
      this.effect = new ReactiveEffect(
        () => getter(this._value),
        () => {
          console.log('computed trigger: this.effect._dirtyLevel=', this.effect._dirtyLevel);
          triggerRefValue(this, this.effect._dirtyLevel === 2 ? 2 : 3);
        }
      );
      this.effect.computed = this;
      this.effect.active = true;
    }
    get value() {
      console.log('computed get value:', this.effect.dirty, 'this.effect._dirtyLevel=', this.effect._dirtyLevel);
      if (this.effect.dirty && !Object.is(this._value, (this._value = this.effect.run()))) {
        triggerRefValue(this, 4);
      }
      trackRefValue(this);
      if (this.effect._dirtyLevel >= 2) {
        console.log('trigger twice this.effect._dirtyLevel=', this.effect._dirtyLevel);
        triggerRefValue(this, 2);
      }
      return this._value;
    }
    set value(newVal) {
      this._setter(newVal);
    }
    get _dirty() {
      return this.effect.dirty;
    }
    set _dirty(v) {
      this.effect.dirty = v;
    }
  }
  function computed$1(getterOrOptions) {
    // only getter
    let getter = getterOrOptions;
    const cRef = new ComputedRefImpl(getter, NOOP, true);
    return cRef;
  }
  function computed(getterOrOptions) {
    const c = computed$1(getterOrOptions);
    return c;
  }

  // init
  const createApp = (options) => {
    return {
      mount() {
        if (options.setup) {
          options.setup();
        }
        const effect = new ReactiveEffect(options.render, NOOP, () => queueJob(update));
        const update = () => {
          console.log('update effect dirty value:', effect.dirty);
          if (effect.dirty) {
            effect.run();
          }
        };
        update();
      },
    };
  };

  return {
    ref,
    computed,
    createApp,
  };
});
