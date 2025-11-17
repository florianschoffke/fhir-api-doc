import gematikLabels from './labels.js'

const loadData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(error.message);
        return "";
    }
};


const createElement = (tag, { classes = [], attributes = {}, innerHTML = '', children = [] } = {}) => {
    const element = Object.assign(document.createElement(tag), { innerHTML });
    classes.forEach(cls => element.classList.add(cls));
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    children.forEach(child => element.appendChild(child));
    return element;
};


const createTable = (headers, rows, includeHeader = true, classes = []) => {
    const table = createElement('table', { attributes: { style: 'width: 100%' }, classes: classes });
    if (includeHeader) {
        const thead = createElement('thead');
        thead.appendChild(createElement('tr', {
            children: headers.map(headerText => createElement('th', { innerHTML: headerText }))
        }));
        table.appendChild(thead);
    }
    const tbody = createElement('tbody');
    rows.forEach(rowData => {
        tbody.appendChild(createElement('tr', {
            children: rowData.map(cellData => createElement('td', { innerHTML: cellData }))
        }));
    });
    table.appendChild(tbody);
    return table;
};

const createCopyButton = (data, language = null) => {
    const wrapper = createElement('div', { classes: ['gem-ig-copy-container'] });
    const languageElement = createElement('span', { classes: ['gem-id-code-lang'] })
    if (language) {
        languageElement.innerText = language.toLowerCase();
    }
    // The Copy Button
    const buttonWrapper = createElement('div', { classes: ['gem-ig-copy-button-wrapper'] });
    const button = createElement('button', { innerHTML: gematikLabels.apiDoc.Copy_Button_Label});
    // Add click event listener to copy button
    button.addEventListener('click', function () {
        navigator.clipboard.writeText(data).then(() => {
            button.innerText = gematikLabels.apiDoc.Copied_Button_Label;
            setTimeout(() => button.innerText = gematikLabels.apiDoc.Copy_Button_Label, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
    wrapper.appendChild(languageElement);
    buttonWrapper.appendChild(button);
    wrapper.appendChild(buttonWrapper);
    return wrapper;
};

const translateExpectation = (conformance) => ({
    "SHALL": gematikLabels.requirements.SHALL,
    "SHALL NOT": gematikLabels.requirements.SHALL_NOT,
    "SHALL-NOT": gematikLabels.requirements.SHALL_NOT,
    "SHOULD": gematikLabels.requirements.SHOULD,
    "SHOULD NOT": gematikLabels.requirements.SHOULD_NOT,
    "SHOULD-NOT": gematikLabels.requirements.SHOULD_NOT,
    "MAY": gematikLabels.requirements.MAY
}[conformance] || conformance);


const isJson = (str) => {
    if (typeof str !== "string") return false;

    try {
        const parsed = JSON.parse(str);
        return typeof parsed === "object" && parsed !== null;
    } catch (e) {
        return false;
    }
}

function toJson(value) {
    if (typeof value === "object" && value !== null) {
        return value; // already a JSON object or array
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return typeof parsed === "object" && parsed !== null ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    return null; // anything else is not JSON
}

function removeLeadingSlash(str) {
    return str.startsWith('/') ? str.slice(1) : str;
}

export default {
    loadData,
    createElement,
    createTable,
    createCopyButton,
    translateExpectation,
    isJson,
    toJson,
    removeLeadingSlash
};