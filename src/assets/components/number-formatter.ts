export default class NumberFormatterElement extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const value = this.getAttribute("value");
    if (value === null) {
      this.textContent = "0";
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      this.textContent = value;
      return;
    }

    this.textContent = this.formatNumber(num);
  }

  formatNumber(num: number): string {
    const locale = document.documentElement.lang || undefined;
    const formatter = new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    });
    return formatter.format(num);
  }
}

if (!customElements.get("number-formatter")) {
  customElements.define("number-formatter", NumberFormatterElement);
}
