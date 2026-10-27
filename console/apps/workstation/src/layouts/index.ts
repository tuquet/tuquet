const BasicLayout = () => import('./basic.vue');
const AuthPageLayout = () => import('./auth.vue');

const IFrameView = () => import('@tuquet/layouts').then((m) => m.IFrameView);

export { AuthPageLayout, BasicLayout, IFrameView };
