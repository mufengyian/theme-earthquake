import type { ColorSchemeType } from "../utils/color-scheme";
import { currentColorScheme, setColorScheme } from "../utils/color-scheme";

export default () => ({
  colorSchemes: [
    {
      label: window.i18nResources["jsModule.colorSchemeSwitcher.light"],
      value: "light",
      icon: "icon-[gg--sun]",
    },
    {
      label: window.i18nResources["jsModule.colorSchemeSwitcher.dark"],
      value: "dark",
      icon: "icon-[gg--moon]",
    },
    {
      label: window.i18nResources["jsModule.colorSchemeSwitcher.auto"],
      value: "system",
      icon: "icon-[gg--dark-mode]",
    },
  ],
  currentValue: currentColorScheme,
  showColorSchemePicker: false,
  colorSchemePickerTimer: 0,
  get colorScheme() {
    return this.colorSchemes.find((x) => x.value === this.currentValue);
  },
  selectColorScheme(colorScheme: ColorSchemeType, event?: MouseEvent) {
    const origin = event
      ? { x: event.clientX, y: event.clientY }
      : undefined;
    setColorScheme(colorScheme, true, origin);
    this.currentValue = colorScheme;
    this.showColorSchemePicker = false;
  },
  openColorSchemePicker() {
    if (this.colorSchemePickerTimer) {
      window.clearTimeout(this.colorSchemePickerTimer);
    }
    this.showColorSchemePicker = true;
  },
  closeColorSchemePicker() {
    this.colorSchemePickerTimer = window.setTimeout(() => {
      this.showColorSchemePicker = false;
    }, 180);
  },
  cycleColorScheme(event?: MouseEvent) {
    const currentIndex = this.colorSchemes.findIndex(
      (x) => x.value === this.currentValue,
    );
    const next =
      this.colorSchemes[(currentIndex + 1) % this.colorSchemes.length];
    this.selectColorScheme(next.value as ColorSchemeType, event);
  },
  handleColorSchemeTriggerClick(event?: MouseEvent) {
    if (window.matchMedia("(min-width: 768px)").matches) {
      this.openColorSchemePicker();
      return;
    }
    this.cycleColorScheme(event);
  },
});
