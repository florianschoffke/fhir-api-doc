const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.window = global.window || {};
window.gematikLabels = {
    requirements: {
        SHALL: "Custom SHALL label",
        SHALL_NOT: "Custom SHALL NOT label"
    },
    ig: {
        Download_Button_Image: "Custom Bild herunterladen"
    },
    apiDoc: {
        Copied_Button_Label: "Custom copied button label"
    }
};

Object.defineProperty(HTMLElement.prototype, 'innerText', {
    get() {
        // Fallback to textContent for jsdom
        return this.textContent;
    },
    set(value) {
        this.textContent = value;
    }
});
