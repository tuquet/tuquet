<script setup lang="ts">
import { computed, useId } from 'vue';

import { VbenAvatar } from '../avatar';

interface Props {
  /**
   * Whether text is collapsed; layout state, hides text when sidebar collapses.
   */
  collapsed?: boolean;
  /**
   * Logo image fit mode
   */
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /**
   * Logo height, effective only when logoMode=full
   */
  fullLogoHeight?: number | string;
  /**
   * Logo target URL
   */
  href?: string;
  /**
   * Logo display mode: icon mode or full mode filling logo area
   */
  logoMode?: 'full' | 'icon';
  /**
   * Logo image size
   */
  logoSize?: number;
  /**
   * Whether logo displays text
   */
  showText?: boolean;
  /**
   * Logo icon
   */
  src?: string;
  /**
   * Dark theme Logo icon (optional, defaults to src if omitted)
   */
  srcDark?: string;

  /**
   * Logo text
   */
  text: string;

  /**
   * Logo theme
   */
  theme?: string;
}

defineOptions({
  name: 'VbenLogo',
});

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  href: 'javascript:void 0',
  logoMode: 'icon',
  logoSize: 32,
  fullLogoHeight: 42,
  src: '',
  srcDark: '',
  theme: 'light',
  fit: 'cover',
  showText: true,
});

const logoUid = useId();

/**
 * Choose appropriate logo icon based on theme
 */
const logoSrc = computed(() => {
  // If dark theme and srcDark is provided, use dark theme logo
  if (props.theme === 'dark' && props.srcDark) {
    return props.srcDark;
  }
  // Otherwise use default src
  return props.src;
});

/**
 * Whether to render the inline theme-reactive SVG logo
 */
const isBuiltinSpecterLogo = computed(() => {
  const s = logoSrc.value.trim();
  return (
    !s ||
    s === '/logo.svg' ||
    s === '/logo-app.svg' ||
    s.endsWith('/logo.svg') ||
    s.endsWith('/logo-app.svg')
  );
});

/**
 * Whether to fill container to display logo
 */
const shouldUseFullLogo = computed(() => {
  return props.logoMode === 'full' && !props.collapsed;
});

/**
 * Display logo text according to configuration
 */
const shouldShowText = computed(() => {
  return (
    props.showText &&
    !props.collapsed &&
    !shouldUseFullLogo.value &&
    !!props.text
  );
});

/**
 * Logo styles under full mode
 */
const fullLogoStyle = computed(() => ({
  height:
    typeof props.fullLogoHeight === 'number'
      ? `${props.fullLogoHeight}px`
      : props.fullLogoHeight,
  objectFit: props.fit,
}));
</script>

<template>
  <div :class="theme" class="flex h-full items-center text-lg">
    <a
      :class="[
        $attrs.class,
        shouldShowText
          ? 'gap-2 px-3 justify-start'
          : 'w-full p-0 justify-center',
      ]"
      :href="href"
      class="flex h-full items-center overflow-hidden text-lg leading-normal transition-all duration-500"
    >
      <svg
        v-if="isBuiltinSpecterLogo"
        :aria-label="text"
        :height="logoSize"
        :width="logoSize"
        class="shrink-0 transition-transform duration-300"
        data-specter-logo="true"
        fill="none"
        role="img"
        viewBox="0 0 400 402"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g :filter="`url(#${logoUid}-blur)`">
          <path
            :fill="
              theme === 'dark'
                ? 'rgb(228 228 231 / 0.15)'
                : 'hsl(var(--primary) / 0.22)'
            "
            d="M200 361.739C288.366 361.739 360 290.105 360 201.739C360 113.374 288.366 41.7393 200 41.7393C111.634 41.7393 40 113.374 40 201.739C40 290.105 111.634 361.739 200 361.739Z"
          />
        </g>
        <path
          :fill="`url(#${logoUid}-grad)`"
          d="M200 0C101.217 0 44.1739 76.5217 44.1739 173.913C44.1739 243.478 41.3913 322.783 44.1739 367.304C45.5652 388.174 74.7826 392.348 88.6957 375.652C110.957 347.826 136 347.826 158.261 375.652C172.174 392.348 200 392.348 213.913 375.652C236.174 347.826 261.217 347.826 283.478 375.652C300.174 395.13 330.783 388.174 332.174 367.304C334.957 322.783 355.826 243.478 355.826 173.913C355.826 76.5217 298.783 0 200 0Z"
        />
        <path
          d="M149.913 201.739C159.902 201.739 168 189.281 168 173.913C168 158.545 159.902 146.087 149.913 146.087C139.924 146.087 131.826 158.545 131.826 173.913C131.826 189.281 139.924 201.739 149.913 201.739Z"
          fill="#09090B"
        />
        <path
          d="M250.087 201.739C260.076 201.739 268.174 189.281 268.174 173.913C268.174 158.545 260.076 146.087 250.087 146.087C240.098 146.087 232 158.545 232 173.913C232 189.281 240.098 201.739 250.087 201.739Z"
          fill="#09090B"
        />
        <path
          d="M154.087 170.017C157.314 170.017 159.93 167.401 159.93 164.174C159.93 160.947 157.314 158.33 154.087 158.33C150.86 158.33 148.244 160.947 148.244 164.174C148.244 167.401 150.86 170.017 154.087 170.017Z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M254.261 170.017C257.488 170.017 260.104 167.401 260.104 164.174C260.104 160.947 257.488 158.33 254.261 158.33C251.034 158.33 248.417 160.947 248.417 164.174C248.417 167.401 251.034 170.017 254.261 170.017Z"
          fill="white"
          opacity="0.95"
        />
        <defs>
          <filter
            :id="`${logoUid}-blur`"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
            height="400"
            width="400"
            x="0"
            y="1.73926"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              mode="normal"
              result="shape"
            />
            <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="20" />
          </filter>
          <linearGradient
            :id="`${logoUid}-grad`"
            gradientUnits="userSpaceOnUse"
            x1="136.804"
            x2="316.101"
            y1="1.5039e-06"
            y2="361.307"
          >
            <stop
              :stop-color="
                theme === 'dark'
                  ? '#FAFAFA'
                  : 'hsl(var(--chart-4, var(--primary)))'
              "
              offset="0%"
            />
            <stop
              :stop-color="
                theme === 'dark'
                  ? '#E4E4E7'
                  : 'hsl(var(--chart-1, var(--primary)))'
              "
              offset="45%"
            />
            <stop
              :stop-color="
                theme === 'dark'
                  ? '#A1A1AA'
                  : 'hsl(var(--chart-3, var(--primary)))'
              "
              offset="100%"
            />
          </linearGradient>
        </defs>
      </svg>

      <img
        v-else-if="logoSrc && shouldUseFullLogo"
        :alt="text"
        :src="logoSrc"
        :style="fullLogoStyle"
        class="w-full"
      />

      <VbenAvatar
        v-else-if="logoSrc"
        :alt="text"
        :src="logoSrc"
        :size="logoSize"
        :fit="fit"
        class="relative rounded-none bg-transparent"
      />
      <template v-if="shouldShowText">
        <slot name="text">
          <span
            class="text-foreground truncate font-semibold text-nowrap hidden sm:inline-flex items-center leading-none"
          >
            {{ text }}
          </span>
        </slot>
      </template>
    </a>
  </div>
</template>
