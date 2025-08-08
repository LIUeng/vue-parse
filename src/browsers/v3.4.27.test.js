const { ref, setup, createApp, onUpdated, onMounted } = Vue;

const app = createApp({
  setup() {
    const count = ref(0);
    onUpdated(() => {
      console.trace();
      console.log('app render update');
    });
    onMounted(() => {
      console.log('app render');
      setTimeout(() => {
        count.value++;
      }, 2e3);
    });
    return {
      count,
    };
  },
  template: '<div>{{ count }}<App1 /><App2 /></div>',
});

app.component('App1', {
  setup() {
    const text = ref('App1');
    onUpdated(() => {
      console.log('App1 render update');
    });
    return {
      text,
    };
  },
  template: `<button>{{ text }}</button>`,
});

app.component('App2', {
  setup() {
    const text = ref('App2');
    onUpdated(() => {
      console.log('App2 render update');
    });
    return {
      text,
    };
  },
  template: `<button>{{ text }}</button>`,
});

app.mount(document.getElementById('app'));
