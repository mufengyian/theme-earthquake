export default () => ({
  show: false,
  timer: 0,
  canHover: function () {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  },
  open: function () {
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
    this.show = true;
  },
  toggle: function () {
    if (this.show) {
      this.show = false;
      return;
    }
    this.open();
  },
  close: function () {
    this.timer = window.setTimeout(() => (this.show = false), 300);
  },
  openByHover: function () {
    if (this.canHover()) {
      this.open();
    }
  },
  closeByHover: function () {
    if (this.canHover()) {
      this.close();
    }
  },
});
